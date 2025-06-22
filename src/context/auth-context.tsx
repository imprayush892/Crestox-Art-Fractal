
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
  status: 'active' | 'completed' | 'cancelled';
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
  user: { uid: string } | null;
  login: () => void;
  logout: () => void;
  collection: OwnedFractal[];
  investInPortfolio: (artist: Artist, quantity: number) => Promise<void>;
  listForResale: (artist: Artist, details: { quantity: number; initialPrice: number; minPrice: number; periodDays: number }) => Promise<void>;
  cancelListing: (listingId: string) => Promise<void>;
  holdingsByArtist: Map<string, number>;
  artists: Artist[];
  fractals: Fractal[];
  resaleListings: ResaleListing[];
  watchlist: string[];
  addToWatchlist: (artistId: string) => void;
  removeFromWatchlist: (artistId: string) => void;
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
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    if (!db) return;

    const unsubArtists = onSnapshot(firestoreCollection(db, 'artists'), (snapshot) => {
      setArtists(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Artist)));
    }, () => setArtists(initialArtists));

    const unsubFractals = onSnapshot(firestoreCollection(db, 'fractals'), (snapshot) => {
      setFractals(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Fractal)));
    }, () => setFractals(initialFractals));
    
    const unsubResale = onSnapshot(query(firestoreCollection(db, 'resaleListings')), (snapshot) => {
      setResaleListings(snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as ResaleListing)));
    });

    return () => { unsubArtists(); unsubFractals(); unsubResale(); };
  }, [initialArtists, initialFractals]);
  
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    if (user && db) {
      const q = query(firestoreCollection(db, "users", user.uid, "ownedFractals"));
      unsubscribe = onSnapshot(q, (querySnapshot) => {
        setCollection(querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id} as OwnedFractal)));
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
  
  const addToWatchlist = (artistId: string) => {
    setWatchlist(prev => [...new Set([...prev, artistId])]);
  };

  const removeFromWatchlist = (artistId: string) => {
      setWatchlist(prev => prev.filter(id => id !== artistId));
  };
  
  const cancelListing = useCallback(async (listingId: string) => {
    if (!user) throw new Error("User must be logged in.");

    if (!db) {
        console.warn("Firebase not configured. Simulating cancellation locally.");
        setResaleListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'cancelled' } : l));
        setCollection(prev => prev.map(f => f.listingId === listingId ? { ...f, status: 'available', listingId: undefined } : f));
        return;
    }

    const batch = writeBatch(db);
    const listingRef = doc(db, 'resaleListings', listingId);
    
    batch.update(listingRef, { status: 'cancelled' });

    const fractalsToUpdateQuery = query(
        collection(db, 'users', user.uid, 'ownedFractals'),
        where('listingId', '==', listingId)
    );
    const snapshot = await getDocs(fractalsToUpdateQuery);
    if(snapshot.empty) {
      console.warn("No fractals found for this listing to cancel.");
    }
    snapshot.docs.forEach(docToUpdate => {
        batch.update(docToUpdate.ref, { status: 'available', listingId: '' });
    });
    
    await batch.commit();

  }, [user]);

  const listForResale = useCallback(async (artist: Artist, details: { quantity: number, initialPrice: number, minPrice: number, periodDays: number}) => {
    if (!user) throw new Error("User must be logged in to sell.");

    if (!db) {
        console.warn("Firebase not configured. Simulating listing locally.");
        const availableToSell = collection.filter(f => f.artistId === artist.id && f.status !== 'listed');
        if (availableToSell.length < details.quantity) {
            throw new Error("Not enough available fractals to sell.");
        }

        const newListingId = `local-listing-${Date.now()}`;
        const newListing: ResaleListing = {
            id: newListingId,
            artistId: artist.id,
            resellerId: user.uid,
            quantity: details.quantity,
            initialPrice: details.initialPrice,
            minPrice: details.minPrice,
            periodSeconds: details.periodDays * 24 * 60 * 60,
            listingTimestamp: new Date().toISOString(),
            status: 'active'
        };
        
        setResaleListings(prev => [...prev, newListing]);

        const fractalsToUpdate = availableToSell.slice(0, details.quantity);
        const fractalIdsToUpdate = new Set(fractalsToUpdate.map(f => f.id));

        setCollection(currentCollection => currentCollection.map(f => 
            fractalIdsToUpdate.has(f.id) ? { ...f, status: 'listed', listingId: newListingId } : f
        ));
        
        return;
    }

    const fractalsToSellQuery = query(
        collection(db, 'users', user.uid, 'ownedFractals'),
        where('artistId', '==', artist.id),
        where('status', '==', 'available'),
        limit(details.quantity)
    );
    
    const snapshot = await getDocs(fractalsToSellQuery);
    if(snapshot.docs.length < details.quantity) {
        throw new Error("Not enough available fractals to sell.");
    }

    const batch = writeBatch(db);
    const newListingRef = doc(collection(db, 'resaleListings'));
    const newListingData: Omit<ResaleListing, 'id'> = {
        artistId: artist.id,
        resellerId: user.uid,
        quantity: details.quantity,
        initialPrice: details.initialPrice,
        minPrice: details.minPrice,
        periodSeconds: details.periodDays * 24 * 60 * 60,
        listingTimestamp: new Date().toISOString(),
        status: 'active'
    };
    batch.set(newListingRef, newListingData);

    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'listed', listingId: newListingRef.id });
    });

    await batch.commit();

  }, [user, collection]);

  const investInPortfolio = useCallback(async (artist: Artist, quantity: number) => {
    if (!user) throw new Error("User must be logged in to invest.");
    
    if (!db) {
        console.warn("Firebase not configured. Simulating investment locally.");
        const artistData = artists.find(a => a.id === artist.id);
        if (!artistData) throw new Error("Artist not found for local simulation");

        const activeResaleListings = resaleListings.filter(l => l.artistId === artist.id && l.status === 'active');
        
        type Share = { price: number; isResold: boolean; sourceId: string; resellerId?: string };
        const orderBook: Share[] = [];
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

        for (let i = 0; i < artistData.availableEditions; i++) {
            orderBook.push({ price: artistData.fractalPrice, isResold: false, sourceId: artist.id });
        }

        orderBook.sort((a, b) => a.price - b.price || (a.isResold ? -1 : 1));

        if (orderBook.length < quantity) throw new Error("Not enough shares available to fulfill the order.");
        
        const sharesToBuy = orderBook.slice(0, quantity);
        const purchaseDate = now.toISOString();

        const newOwnedFractals: OwnedFractal[] = [];
        let newArtistData = { ...artistData };
        let newResaleListings = [...resaleListings];

        for (const share of sharesToBuy) {
            const serialNumber = `CRESTOX-${artist.id.split('-')[1]}-${String(Date.now()).slice(-6)}-${Math.random().toString(36).substring(2, 5)}`;
            const newOwnedFractal: OwnedFractal = {
                id: `local-fractal-${Date.now()}-${Math.random()}`,
                artistId: artist.id,
                artistName: artist.name,
                purchasePrice: Math.round(share.price * 1.18 * 100) / 100,
                purchaseDate: purchaseDate,
                serialNumber: serialNumber,
                status: 'available'
            };
            newOwnedFractals.push(newOwnedFractal);

            if (share.isResold) {
                const listingIndex = newResaleListings.findIndex(l => l.id === share.sourceId);
                if (listingIndex !== -1) {
                    const updatedListing = { ...newResaleListings[listingIndex] };
                    updatedListing.quantity -= 1;
                    if (updatedListing.quantity === 0) {
                        updatedListing.status = 'completed';
                    }
                    newResaleListings[listingIndex] = updatedListing;
                }
            } else {
                newArtistData.availableEditions -= 1;
            }
        }
        
        const newMarketPrice = calculateMarketImpactPrice(newArtistData.fractalPrice, quantity, newArtistData.totalEditions);
        const newTotalPortfolioValue = newMarketPrice * newArtistData.totalEditions;

        newArtistData.fractalPrice = newMarketPrice;
        newArtistData.priceHistory = [...newArtistData.priceHistory, { date: purchaseDate, price: newMarketPrice }];
        newArtistData.totalPortfolioValueHistory = [...newArtistData.totalPortfolioValueHistory, { date: purchaseDate, value: newTotalPortfolioValue }];
        
        setCollection(prev => [...prev, ...newOwnedFractals]);
        setArtists(prevArtists => prevArtists.map(a => a.id === artist.id ? newArtistData : a));
        setResaleListings(newResaleListings);

        return;
    }

    await runTransaction(db, async (transaction) => {
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

        type Share = { price: number; isResold: boolean; sourceId: string; resellerId?: string };
        const orderBook: Share[] = [];

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

        for (let i = 0; i < artistData.availableEditions; i++) {
            orderBook.push({ price: artistData.fractalPrice, isResold: false, sourceId: artist.id });
        }

        orderBook.sort((a, b) => a.price - b.price || (a.isResold ? -1 : 1));

        if (orderBook.length < quantity) throw new Error("Not enough shares available to fulfill the order.");
        
        const sharesToBuy = orderBook.slice(0, quantity);
        const purchaseDate = now.toISOString();

        for (const share of sharesToBuy) {
            const newFractalRef = doc(collection(db, 'users', user.uid, 'ownedFractals'));
            const serialNumber = `CRESTOX-${artist.id.split('-')[1]}-${String(Date.now()).slice(-6)}-${Math.random().toString(36).substring(2, 5)}`;
            const newOwnedFractal: Omit<OwnedFractal, 'id'> = {
                artistId: artist.id,
                artistName: artist.name,
                purchasePrice: Math.round(share.price * 1.18 * 100) / 100,
                purchaseDate: purchaseDate,
                serialNumber: serialNumber,
                status: 'available'
            };
            transaction.set(newFractalRef, newOwnedFractal);

            if (share.isResold) {
                const listingRef = doc(db, 'resaleListings', share.sourceId);
                const listingDocSnapshot = await transaction.get(listingRef);
                const listingData = listingDocSnapshot.data() as ResaleListing;

                const newQuantity = listingData.quantity - 1;
                transaction.update(listingRef, { quantity: newQuantity, status: newQuantity === 0 ? 'completed' : 'active' });

                const resellerFractalQuery = query(
                    collection(db, 'users', share.resellerId!, 'ownedFractals'),
                    where('listingId', '==', share.sourceId),
                    limit(1)
                );
                const resellerFractalSnapshot = await getDocs(resellerFractalQuery);
                if (!resellerFractalSnapshot.empty) {
                    transaction.delete(resellerFractalSnapshot.docs[0].ref);
                }

            } else {
                const currentArtistDoc = await transaction.get(artistRef);
                const currentArtistData = currentArtistDoc.data() as Artist;
                transaction.update(artistRef, { availableEditions: currentArtistData.availableEditions - 1 });
            }
        }
        
        const postTradeArtistDoc = await transaction.get(artistRef);
        const postTradeArtistData = postTradeArtistDoc.data() as Artist;

        const newMarketPrice = calculateMarketImpactPrice(postTradeArtistData.fractalPrice, quantity, postTradeArtistData.totalEditions);
        const newTotalPortfolioValue = newMarketPrice * postTradeArtistData.totalEditions;

        transaction.update(artistRef, {
            fractalPrice: newMarketPrice,
            priceHistory: [...postTradeArtistData.priceHistory, { date: purchaseDate, price: newMarketPrice }],
            totalPortfolioValueHistory: [...postTradeArtistData.totalPortfolioValueHistory, { date: purchaseDate, value: newTotalPortfolioValue }],
        });
    });
  }, [user, artists, resaleListings]);

  const holdingsByArtist = new Map<string, number>();
  collection.forEach(fractal => {
      if (fractal.status !== 'listed') {
        holdingsByArtist.set(fractal.artistId, (holdingsByArtist.get(fractal.artistId) || 0) + 1);
      }
  });

  const value = { isLoggedIn, user, login, logout, collection, investInPortfolio, listForResale, cancelListing, holdingsByArtist, artists, fractals, resaleListings, watchlist, addToWatchlist, removeFromWatchlist };

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
