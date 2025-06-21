'use client';

import type { Artist } from '@/lib/data';
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface OwnedFractal {
  id: string; // Unique ID for the ownership instance
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
  get holdingsByArtist(): Map<string, number>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [collection, setCollection] = useState<OwnedFractal[]>([]);
  const [serialCounter, setSerialCounter] = useState(1);

  const login = () => setIsLoggedIn(true);
  
  const logout = () => {
    setIsLoggedIn(false);
    setCollection([]);
  };

  const investInPortfolio = (artist: Artist, quantity: number) => {
    const newFractals: OwnedFractal[] = [];
    const purchaseDate = new Date().toISOString();
    let currentSerial = serialCounter;

    for (let i = 0; i < quantity; i++) {
        newFractals.push({
            id: `${artist.id}-${Date.now()}-${i}`,
            artistId: artist.id,
            artistName: artist.name,
            purchasePrice: artist.fractalPrice,
            purchaseDate: purchaseDate,
            serialNumber: `CRESTOX-${artist.id.split('-')[1]}-${String(currentSerial + i).padStart(6, '0')}`,
        });
    }
    setSerialCounter(currentSerial + quantity);
    setCollection(prev => [...prev, ...newFractals]);
  };

  const holdingsByArtist = new Map<string, number>();
  collection.forEach(fractal => {
      holdingsByArtist.set(fractal.artistId, (holdingsByArtist.get(fractal.artistId) || 0) + 1);
  });

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, collection, investInPortfolio, holdingsByArtist }}>
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
