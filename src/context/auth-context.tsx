'use client';

import type { Artist, Fractal } from '@/lib/data';
import { artists as initialArtists, fractals as initialFractals } from '@/lib/data';
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

const calculateNewPrice = (P_old: number, Q: number, N: number): number => {
  const beta = 0.4472;
  const gamma = 0.693;
  const lambda = 0.33;
  const alpha0 = 0.1;

  if (N === 0) return P_old;

  const alpha = Math.abs(Q) / N;
  const sign = Math.sign(Q);

  let P_new: number;

  if (alpha <= alpha0) {
    const gamma_lin = (Math.exp(gamma * Math.pow(alpha0, beta)) - 1) / alpha0;
    const impact = sign * gamma_lin * alpha;
    P_new = P_old * (1 + (1 - lambda) * impact);
  } else {
    const impact_exp = sign * gamma * Math.pow(alpha, beta);
    P_new = P_old * Math.exp((1 - lambda) * impact_exp);
  }

  return Math.round(P_new * 100) / 100;
};

export function AuthProvider({ children }: { children: ReactNode }) {
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
