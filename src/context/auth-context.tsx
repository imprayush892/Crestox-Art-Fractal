
'use client';

import type { Artist, Fractal } from '@/lib/data';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection as firestoreCollection, doc, onSnapshot, runTransaction, query, where, orderBy, limit, getDocs, writeBatch, Timestamp, collection } from 'firebase/firestore';

export interface ResaleListing {
  id: string;
  artistId: string;
  resellerId: string;
  quantity: number;
  initialPrice: number;
  minPrice: number;
  periodSeconds: number;
  listingTimestamp: string; // ISO string
  status: 'active' | 'completed';
}

export interface OwnedFractal {
  id: string;
  artistId: string;
  artistName: string;
  purchasePrice: number;
  purchaseDate: string;
  serialNumber: string;
  status?: 'available' | 'listed';
  listingId?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  collection: OwnedFractal[];
  investInPortfolio: (artist: Artist, quantity: number) => Promise<void>;
  listForResale: (artist: Artist, details: { quantity: number; initialPrice: number; minPrice: number; periodDays: number }) => Promise<void>;
  holdingsByArtist: Map<string, number>;
  artists: Artist[];
  fractals: Fractal[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const calculateMarketImpactPrice = (S_current: number, Q_trade: number, V_total: number): number => {
  const BETA = 1.118;
  if (V_total === 0 || Q_trade <= 0) {
    return S_current;
  }
  const fraction = Q_trade / V_total;
  const impactFactor = Math.exp(BETA * Math.sqrt(fraction));
  const S_new = S_current * impactFactor;
  return Math.round(S_new * 100) / 100;
};

interface AuthProviderProps {
  children: ReactNode;
  initialArtists: Artist[];
  initialFractals: Fractal[];
}

export function AuthProvider({ children, initialArtists, initialFractals }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [collection, setCollection] = useState<OwnedFractal[]>([]);
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [fractals, setFractals] = useState<Fractal[]>(initialFractals);
  const [resaleListings, setResaleListings] = useState<ResaleListing[]>([]);

  useEffect(() => {
    if (!db) {
      return;
    }

    const unsubArtists = onSnapshot(
      firestoreCollection(db, 'artists'),
      (snapshot) => {
        const artistsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Artist));
        if (artistsData.length > 0) setArtists(artistsData);
      },
      (error) => {
        console.error("Error listening to 'artists':", error);
        setArtists(initialArtists);
      }
    );

    const unsubFractals = onSnapshot(
      firestoreCollection(db, 'fractals'),
      (snapshot) => {
        const fractalsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Fractal));
        if (fractalsData.length > 0) setFractals(fractalsData);
      },
      (error) => {
        console.error("Error listening to 'fractals':", error);
        setFractals(initialFractals);
      }
    );
    
    const unsubResale = onSnapshot(
        query(firestoreCollection(db, 'resaleListings'), where('status', '==', 'active')),
        (snapshot) => {
            const listingsData = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as ResaleListing));
            setResaleListings(listingsData);
        }
    );


    return () => {
      unsubArtists();
      unsubFractals();
      unsubResale();
    };
  }, [initialArtists, initialFractals]);
  
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    if (user && db) {
      const q = query(firestoreCollection(db, "users", user.uid, "ownedFractals"));
      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userFractals = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id} as OwnedFractal));
        setCollection(userFractals);
      });
    } else {
      setCollection([]);
    }
    return () => unsubscribe();
  }, [user]);

  const login = () => {
    setUser({ uid: 'mock-user-id' });
    setIsLoggedIn(true);
  }
  
  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  const listForResale = useCallback(async (artist: Artist, details: { quantity: number, initialPrice: number, minPrice: number, periodDays: number}) => {
    if (!user) throw new Error("User must be logged in to sell.");

    const fractalsToSellQuery = query(
        collection(db, 'users', user.uid, 'ownedFractals'),
        where('artistId', '==', artist.id),
        where('status', '==', 'available'),
        limit(details.quantity)
    );
    
    const batch = writeBatch(db);

    const newListingRef = doc(collection(db, 'resaleListings'));
    const newListing: Omit<ResaleListing, 'id'> = {
        artistId: artist.id,
        resellerId: user.uid,
        quantity: details.quantity,
        initialPrice: details.initialPrice,
        minPrice: details.minPrice,
        periodSeconds: details.periodDays * 24 * 60 * 60,
        listingTimestamp: new Date().toISOString(),
        status: 'active'
    };
    batch.set(newListingRef, newListing);

    const snapshot = await getDocs(fractalsToSellQuery);
    if(snapshot.docs.length < details.quantity) {
        throw new Error("Not enough available fractals to sell.");
    }

    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'listed', listingId: newListingRef.id });
    });

    await batch.commit();

  }, [user]);

  const investInPortfolio = useCallback(async (artist: Artist, quantity: number) => {
    if (!user) throw new Error("User must be logged in to invest.");
    if (!db) throw new Error("Firebase not configured");

    await runTransaction(db, async (transaction) => {
        // 1. Get all available shares
        const artistRef = doc(db, 'artists', artist.id);
        const artistDoc = await transaction.get(artistRef);
        if (!artistDoc.exists()) throw new Error("Artist not found");
        const artistData = artistDoc.data() as Artist;
        
        const resaleListingsQuery = query(
            collection(db, 'resaleListings'),
            where('artistId', '==', artist.id),
            where('status', '==', 'active')
        );
        const resaleListingsSnapshot = await getDocs(resaleListingsQuery);
        const activeResaleListings = resaleListingsSnapshot.docs.map(d => ({...d.data(), id: d.id} as ResaleListing));

        // 2. Create combined order book
        type Share = { price: number; isResold: boolean; sourceId: string; resellerId?: string };
        const orderBook: Share[] = [];

        // Add resold shares
        const now = new Date();
        activeResaleListings.forEach(listing => {
            const t = (now.getTime() - new Date(listing.listingTimestamp).getTime()) / 1000;
            const P_t = t >= listing.periodSeconds 
                ? listing.minPrice 
                : listing.initialPrice - (listing.initialPrice - listing.minPrice) * (t / listing.periodSeconds);
            
            for (let i = 0; i < listing.quantity; i++) {
                orderBook.push({ price: P_t, isResold: true, sourceId: listing.id, resellerId: listing.resellerId });
            }
        });

        // Add platform shares
        for (let i = 0; i < artistData.availableEditions; i++) {
            orderBook.push({ price: artistData.fractalPrice, isResold: false, sourceId: artist.id });
        }

        // 3. Sort by price (resold first on tie)
        orderBook.sort((a, b) => a.price - b.price || (a.isResold ? -1 : 1));

        if (orderBook.length < quantity) throw new Error("Not enough shares available to fulfill the order.");
        
        // 4. Fulfill order with the cheapest K shares
        const sharesToBuy = orderBook.slice(0, quantity);

        const purchaseDate = now.toISOString();

        for (const share of sharesToBuy) {
            const newFractalRef = doc(collection(db, 'users', user.uid, 'ownedFractals'));
            const serialNumber = `CRESTOX-${artist.id.split('-')[1]}-${String(Date.now()).slice(-6)}`;
            const newOwnedFractal: Omit<OwnedFractal, 'id'> = {
                artistId: artist.id,
                artistName: artist.name,
                purchasePrice: share.price,
                purchaseDate: purchaseDate,
                serialNumber: serialNumber,
                status: 'available'
            };
            transaction.set(newFractalRef, newOwnedFractal);

            if (share.isResold) {
                const listingRef = doc(db, 'resaleListings', share.sourceId);
                const listingDoc = activeResaleListings.find(l => l.id === share.sourceId)!;
                
                const newQuantity = listingDoc.quantity - 1;
                transaction.update(listingRef, { quantity: newQuantity, status: newQuantity === 0 ? 'completed' : 'active' });
                listingDoc.quantity = newQuantity; 

                const resellerFractalQuery = query(
                    collection(db, 'users', share.resellerId!, 'ownedFractals'),
                    where('listingId', '==', share.sourceId),
                    limit(1)
                );
                const resellerFractalSnapshot = await getDocs(resellerFractalQuery);
                if (!resellerFractalSnapshot.empty) {
                    transaction.delete(resellerFractalSnapshot.docs[0].ref);
                }

            } else { // It's a platform share
                transaction.update(artistRef, { availableEditions: artistData.availableEditions - 1 });
                artistData.availableEditions -= 1;
            }
        }
        
        // 5. Apply market impact
        const newMarketPrice = calculateMarketImpactPrice(artistData.fractalPrice, quantity, artistData.totalEditions);
        const newTotalPortfolioValue = newMarketPrice * artistData.totalEditions;

        transaction.update(artistRef, {
            fractalPrice: newMarketPrice,
            priceHistory: [...artistData.priceHistory, { date: purchaseDate, price: newMarketPrice }],
            totalPortfolioValueHistory: [...artistData.totalPortfolioValueHistory, { date: purchaseDate, value: newTotalPortfolioValue }],
        });
    });
  }, [user]);

  const holdingsByArtist = new Map<string, number>();
  collection.forEach(fractal => {
      holdingsByArtist.set(fractal.artistId, (holdingsByArtist.get(fractal.artistId) || 0) + 1);
  });

  const value = { isLoggedIn, login, logout, collection, investInPortfolio, listForResale, holdingsByArtist, artists, fractals };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
