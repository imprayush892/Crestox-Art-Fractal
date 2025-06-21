
'use client';

import type { Artist, Fractal } from '@/lib/data';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, runTransaction, writeBatch, getDocs, getDoc } from 'firebase/firestore';
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
 * Formula: S_new = S_current * exp(β * sqrt(Q/V))
 * @param P_old The current price of the fractal share.
 * @param Q The trade size (number of shares being bought).
 * @param N The total number of shares outstanding.
 * @returns The new price after the trade.
 */
const calculateNewPrice = (P_old: number, Q: number, N: number): number => {
  const beta = 1.118;
  
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
  const [serialCounter, setSerialCounter] = useState(1);

  useEffect(() => {
    const seedData = async () => {
      const flagRef = doc(db, 'meta', 'isSeeded');
      const flagDoc = await getDoc(flagRef);

      if (!flagDoc.exists()) {
        console.log('Seeding data to Firestore for the first time...');
        const batch = writeBatch(db);

        initialArtists.forEach(artist => {
          const artistRef = doc(db, 'artists', artist.id);
          batch.set(artistRef, artist);
        });

        initialFractals.forEach(fractal => {
          const fractalRef = doc(db, 'fractals', fractal.id);
          batch.set(fractalRef, fractal);
        });
        
        batch.set(flagRef, { seeded: true });
        
        await batch.commit();
        console.log('Data seeding complete.');
      }
    };
    seedData();
  }, []);

  useEffect(() => {
    const artistsCollectionRef = collection(db, 'artists');
    const unsubscribeArtists = onSnapshot(artistsCollectionRef, (snapshot) => {
      const artistsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Artist));
      setArtists(artistsData);
      if (fractals.length > 0) setIsLoading(false);
    });

    const fractalsCollectionRef = collection(db, 'fractals');
    const unsubscribeFractals = onSnapshot(fractalsCollectionRef, (snapshot) => {
        const fractalsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Fractal));
        setFractals(fractalsData);
        if (artists.length > 0) setIsLoading(false);
    });

    return () => {
      unsubscribeArtists();
      unsubscribeFractals();
    };
  }, [artists.length, fractals.length]);
  
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    if (user) {
      const ownedFractalsRef = collection(db, "users", user.uid, "ownedFractals");
      unsubscribe = onSnapshot(ownedFractalsRef, (querySnapshot) => {
        const userFractals = querySnapshot.docs.map(doc => doc.data() as OwnedFractal);
        setCollection(userFractals);
      });
    } else {
      setCollection([]);
    }
    return () => unsubscribe();
  }, [user]);

  const login = () => {
    // In a real app, this would involve Firebase Auth.
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
            
            let currentSerial = Date.now(); // Using timestamp for a simple unique-ish serial
            const purchaseDate = new Date().toISOString();

            for (let i = 0; i < quantity; i++) {
                const serialNumber = `CRESTOX-${currentArtistData.id.split('-')[1]}-${String(currentSerial + i).slice(-6)}`;
                const newFractal: OwnedFractal = {
                    id: `${currentArtistData.id}-${Date.now()}-${i}`,
                    artistId: currentArtistData.id,
                    artistName: currentArtistData.name,
                    purchasePrice: purchasePrice,
                    purchaseDate: purchaseDate,
                    serialNumber: serialNumber,
                };
                const newFractalRef = doc(collection(db, 'users', user.uid, 'ownedFractals'));
                transaction.set(newFractalRef, newFractal);
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
    }
  }, [user]);

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
