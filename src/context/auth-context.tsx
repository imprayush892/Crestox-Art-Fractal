'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  collection: string[];
  addToCollection: (fractalId: string) => void;
  removeFromCollection: (fractalId: string) => void;
  isInCollection: (fractalId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [collection, setCollection] = useState<string[]>([]);

  const login = () => setIsLoggedIn(true);
  
  const logout = () => {
    setIsLoggedIn(false);
    setCollection([]);
  };

  const addToCollection = (fractalId: string) => {
    setCollection(prev => [...new Set([...prev, fractalId])]);
  };

  const removeFromCollection = (fractalId: string) => {
    setCollection(prev => prev.filter(id => id !== fractalId));
  };

  const isInCollection = (fractalId: string) => {
    return collection.includes(fractalId);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, collection, addToCollection, removeFromCollection, isInCollection }}>
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
