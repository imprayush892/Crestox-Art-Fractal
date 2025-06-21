
'use client';

import type { Artist, Fractal } from '@/lib/data';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection as firestoreCollection, doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { artists as initialArtists, fractals as initialFractals } from '@/lib/data';

export interface OwnedFractal {
  id: string;
  artistId: string;
  artistName: string;
  purchasePrice: number;
  purchaseDate: string;
  serialNumber: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  collection: OwnedFractal[];
  investInPortfolio: (artist: Artist, quantity: number) => Promise<void>;
  holdingsByArtist: Map<string, number>;
  artists: Artist[];
  fractals: Fractal[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Calculates the new price based on the "Revised Multiplicative Impact Function".
 * S_new = S_current * exp(β * sqrt(Q/V))
 * @param P_old The current price of the fractal share.
 * @param Q The trade size (number of shares being bought).
 * @param N The total number of shares outstanding.
 * @returns The new price after the trade.
 */
const calculateNewPrice = (P_old: number, Q: number, N: number): number => {
  const beta = 1.118; // As per the revised model for Crestox
  
  if (N === 0 || Q <= 0) {
    return P_old;
  }

  const fraction = Q / N;
  const impactFactor = Math.exp(beta * Math.sqrt(fraction));
  const P_new = P_old * impactFactor;

  return Math.round(P_new * 100) / 100;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [collection, setCollection] = useState<OwnedFractal[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [fractals, setFractals] = useState<Fractal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    // This effect handles data loading.
    // It will try to connect to Firebase, but if it fails or isn't configured,
    // it will fall back to using local mock data.
    if (!isFirebaseConfigured) {
      console.warn(
        "Firebase configuration is missing in your .env file. The app is running in offline mode with mock data."
      );
      setArtists(initialArtists);
      setFractals(initialFractals);
      setIsLoading(false);
      return; // No cleanup needed for mock data
    }

    // If firebase is configured, set up listeners.
    const unsubscribeArtists = onSnapshot(
      firestoreCollection(db, 'artists'),
      (snapshot) => {
        const artistsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Artist));
        setArtists(artistsData);
        setIsLoading(false); // Set loading to false once we have a response
      },
      (error) => {
        console.error("Error listening to 'artists' collection. Falling back to mock data.", error);
        setArtists(initialArtists);
        setFractals(initialFractals);
        setIsLoading(false);
      }
    );

    const unsubscribeFractals = onSnapshot(
      firestoreCollection(db, 'fractals'),
      (snapshot) => {
        const fractalsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Fractal));
        setFractals(fractalsData);
      },
      (error) => {
        console.error("Error listening to 'fractals' collection. Falling back to mock data.", error);
        // Artists would have already been loaded or fallen back
        setFractals(initialFractals);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribeArtists();
      unsubscribeFractals();
    };
  }, [isFirebaseConfigured]);
  
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    if (user && isFirebaseConfigured) {
      const ownedFractalsRef = firestoreCollection(db, "users", user.uid, "ownedFractals");
      unsubscribe = onSnapshot(ownedFractalsRef, (querySnapshot) => {
        const userFractals = querySnapshot.docs.map(doc => doc.data() as OwnedFractal);
        setCollection(userFractals);
      });
    } else {
      setCollection([]);
    }
    return () => unsubscribe();
  }, [user, isFirebaseConfigured]);

  const login = () => {
    setUser({ uid: 'mock-user-id' });
    setIsLoggedIn(true);
  }
  
  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  const investInPortfolio = useCallback(async (artistToUpdate: Artist, quantity: number) => {
    if (!user) {
        throw new Error("User must be logged in to invest.");
    }
    if (!isFirebaseConfigured) {
        console.error("Cannot invest: Firebase is not configured.");
        // Here you could also implement an offline simulation if desired
        return;
    }
    
    const artistRef = doc(db, 'artists', artistToUpdate.id);

    try {
        await runTransaction(db, async (transaction) => {
            const artistDoc = await transaction.get(artistRef);
            if (!artistDoc.exists()) {
                throw "Artist document does not exist!";
            }
            
            const currentArtistData = artistDoc.data() as Artist;
            const purchasePrice = currentArtistData.fractalPrice;

            const newPrice = calculateNewPrice(
                purchasePrice,
                quantity,
                currentArtistData.totalEditions
            );
            
            const newTotalPortfolioValue = newPrice * currentArtistData.totalEditions;

            const newPriceHistoryEntry = {
              date: new Date().toISOString(),
              price: newPrice,
            };
            const newTotalValueHistoryEntry = {
                date: new Date().toISOString(),
                value: newTotalPortfolioValue
            };

            transaction.update(artistRef, {
                fractalPrice: newPrice,
                availableEditions: currentArtistData.availableEditions - quantity,
                priceHistory: [...currentArtistData.priceHistory, newPriceHistoryEntry],
                totalPortfolioValueHistory: [...currentArtistData.totalPortfolioValueHistory, newTotalValueHistoryEntry]
            });
            
            const purchaseDate = new Date().toISOString();

            for (let i = 0; i < quantity; i++) {
                const serialNumber = `CRESTOX-${currentArtistData.id.split('-')[1]}-${String(Date.now() + i).slice(-6)}`;
                const newFractal: OwnedFractal = {
                    id: `${currentArtistData.id}-${Date.now()}-${i}`,
                    artistId: currentArtistData.id,
                    artistName: currentArtistData.name,
                    purchasePrice: purchasePrice,
                    purchaseDate: purchaseDate,
                    serialNumber: serialNumber,
                };
                const newFractalRef = doc(firestoreCollection(db, 'users', user.uid, 'ownedFractals'));
                transaction.set(newFractalRef, newFractal);
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
    }
  }, [user, isFirebaseConfigured]);

  const holdingsByArtist = new Map<string, number>();
  collection.forEach(fractal => {
      holdingsByArtist.set(fractal.artistId, (holdingsByArtist.get(fractal.artistId) || 0) + 1);
  });

  const value = { isLoggedIn, login, logout, collection, investInPortfolio, holdingsByArtist, artists, fractals };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : null}
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
