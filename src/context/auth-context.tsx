'use client';

import type { Artist, Fractal } from '@/lib/data';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

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
  investInPortfolio: (artist: Artist, quantity: number) => void;
  holdingsByArtist: Map<string, number>;
  artists: Artist[];
  fractals: Fractal[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Calculates the new price based on the Revised Multiplicative Impact Function.
 * S_new = S_current * exp(β * sqrt(Q/V))
 * @param P_old The current price of the fractal share (S_current).
 * @param Q The trade size (number of shares being bought).
 * @param N The total number of shares outstanding (V).
 * @returns The new price after the trade.
 */
const calculateNewPrice = (P_old: number, Q: number, N: number): number => {
  // Revised model: S_new = S_current * exp(β * sqrt(Q/V)) for a buy.
  const beta = 1.118; // New calibration constant from the provided model.
  
  if (N === 0 || Q <= 0) {
    return P_old;
  }

  // Q is trade size, N is total shares outstanding (V).
  const fraction = Q / N;
  const impactFactor = Math.exp(beta * Math.sqrt(fraction));
  const P_new = P_old * impactFactor;

  return Math.round(P_new * 100) / 100; // Round to 2 decimal places.
};


interface AuthProviderProps {
  children: ReactNode;
  artists: Artist[];
  fractals: Fractal[];
}

export function AuthProvider({ children, artists: initialArtists, fractals: initialFractals }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [collection, setCollection] = useState<OwnedFractal[]>([]);
  const [serialCounter, setSerialCounter] = useState(1);
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [fractals] = useState<Fractal[]>(initialFractals);

  const login = () => setIsLoggedIn(true);
  
  const logout = () => {
    setIsLoggedIn(false);
    setCollection([]);
  };

  const investInPortfolio = useCallback((artistToUpdate: Artist, quantity: number) => {
    const purchasePrice = artistToUpdate.fractalPrice;

    // Use the new price calculation model
    const newPrice = calculateNewPrice(
      artistToUpdate.fractalPrice,
      quantity,
      artistToUpdate.totalEditions
    );
    
    setArtists(prevArtists => 
      prevArtists.map(artist => {
        if (artist.id === artistToUpdate.id) {
          const newPriceHistoryEntry = {
            date: new Date().toISOString(),
            price: newPrice,
          };
          return {
            ...artist,
            fractalPrice: newPrice,
            availableEditions: artist.availableEditions - quantity,
            priceHistory: [...artist.priceHistory, newPriceHistoryEntry],
          };
        }
        return artist;
      })
    );

    const newFractals: OwnedFractal[] = [];
    const purchaseDate = new Date().toISOString();
    let currentSerial = serialCounter;

    for (let i = 0; i < quantity; i++) {
        newFractals.push({
            id: `${artistToUpdate.id}-${Date.now()}-${i}`,
            artistId: artistToUpdate.id,
            artistName: artistToUpdate.name,
            purchasePrice: purchasePrice,
            purchaseDate: purchaseDate,
            serialNumber: `CRESTOX-${artistToUpdate.id.split('-')[1]}-${String(currentSerial + i).padStart(6, '0')}`,
        });
    }
    setSerialCounter(currentSerial + quantity);
    setCollection(prev => [...prev, ...newFractals]);
  }, [serialCounter]);

  const holdingsByArtist = new Map<string, number>();
  collection.forEach(fractal => {
      holdingsByArtist.set(fractal.artistId, (holdingsByArtist.get(fractal.artistId) || 0) + 1);
  });

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, collection, investInPortfolio, holdingsByArtist, artists, fractals }}>
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
