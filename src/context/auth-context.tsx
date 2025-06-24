
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { artists as mockArtists, fractals as mockFractals, type Artist, type Fractal, type AIScorecardBreakdown, type ArtworkSize } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import type { EditArtworkFormValues } from '@/app/portfolio/artwork/edit/[id]/page';

// --- Interfaces ---
export interface User {
  uid: string;
  walletBalance: number;
}

export interface OwnedFractal {
  id: string;
  artistId: string;
  artistName: string;
  purchasePrice: number;
  purchaseDate: string;
  serialNumber: string;
  status: 'owned' | 'listed';
}

export interface ArtistProfile extends Artist {
  userId: string;
}

export interface ResaleListing {
    id: string;
    resellerId: string;
    artistId: string;
    fractalIds: string[];
    quantity: number;
    initialPrice: number;
    minPrice: number;
    periodSeconds: number;
    listingTimestamp: string;
    status: 'active' | 'sold' | 'cancelled';
}

export interface EvaluationResult {
    finalScore: number;
    grade: 'AAA' | 'AA' | 'A+' | 'A' | 'A-';
    breakdown: AIScorecardBreakdown[];
    crestoxPriceRange: [number, number];
}

interface NewArtworkData {
    title: string;
    description: string;
    materials: string;
    artworkSize: ArtworkSize;
    minEstimatedValue: number;
    maxEstimatedValue: number;
    editionsToIssue: number;
    image: string;
    subjectSignificance?: string;
    personalSignificance?: string;
    timeEffort?: string;
    biographicalContext?: string;
    commissionPatronage?: string;
}


// --- Context Type ---
interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  artistProfile: ArtistProfile | null;
  artists: Artist[];
  fractals: Fractal[];
  collection: OwnedFractal[];
  watchlist: string[];
  resaleListings: ResaleListing[];
  holdingsByArtist: Map<string, number>;
  login: () => void;
  logout: () => void;
  collectFromPortfolio: (artist: Artist, quantity: number) => Promise<void>;
  listForResale: (artist: Artist, options: { quantity: number; initialPrice: number; minPrice: number; periodDays: number; }) => Promise<void>;
  cancelListing: (listingId: string) => Promise<void>;
  addToWatchlist: (artistId: string) => void;
  removeFromWatchlist: (artistId: string) => void;
  createArtistProfile: (profileData: Omit<ArtistProfile, 'id' | 'userId' | 'fractalPrice' | 'priceHistory' | 'totalPortfolioValueHistory' | 'totalEditions' | 'availableEditions'>) => Promise<void>;
  updateArtistProfile: (profileData: Partial<ArtistProfile>) => Promise<void>;
  addArtwork: (artworkData: NewArtworkData, evaluationResult: EvaluationResult, finalPrice: number, shouldApplyGrade: boolean) => Promise<void>;
  updateAndReevaluateArtwork: (artworkId: string, artworkData: EditArtworkFormValues, evaluationResult: EvaluationResult, useCrestoxPrice: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Price Calculation Logic ---
const calculateNewPrice = (P_old: number, Q: number, N: number): number => {
  const beta = 1.118;
  if (N === 0 || Q <= 0) return P_old;
  const fraction = Q / N;
  const impactFactor = Math.exp(beta * Math.sqrt(fraction));
  return Math.round(P_old * impactFactor * 100) / 100;
};

// --- Provider Component ---
interface AuthProviderProps {
  children: ReactNode;
  initialArtists: Artist[];
  initialFractals: Fractal[];
}

export function AuthProvider({ children, initialArtists, initialFractals }: AuthProviderProps) {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [fractals, setFractals] = useState<Fractal[]>(initialFractals);
  const [collection, setCollection] = useState<OwnedFractal[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(['artist-2', 'artist-5']);
  const [resaleListings, setResaleListings] = useState<ResaleListing[]>([]);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  
  // --- Effects ---
  useEffect(() => {
    // This effect can be expanded to use Firebase listeners
    setArtists(mockArtists);
    setFractals(mockFractals);
  }, []);

  useEffect(() => {
    if(user) {
        const profile = artists.find(a => a.userId === user.uid) as ArtistProfile | undefined;
        setArtistProfile(profile || null);
    } else {
        setArtistProfile(null);
    }
  }, [user, artists]);

  // --- Core Auth Functions ---
  const login = () => {
    setUser({ uid: 'mock-user-id', walletBalance: 5000 });
    setIsLoggedIn(true);
  };
  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  // --- Collection & Wallet ---
  const collectFromPortfolio = useCallback(async (artist: Artist, quantity: number) => {
    if (!user) throw new Error("User must be logged in.");
    const totalCost = quantity * artist.fractalPrice;
    if (user.walletBalance < totalCost) {
      toast({ variant: "destructive", title: "Insufficient Cred Coins", description: "You don't have enough Cred Coins for this transaction." });
      throw new Error("Insufficient funds");
    }

    const newPrice = calculateNewPrice(artist.fractalPrice, quantity, artist.totalEditions);
    const newTotalPortfolioValue = newPrice * artist.totalEditions;

    // Update artist state
    setArtists(prevArtists => prevArtists.map(a => 
      a.id === artist.id ? {
        ...a,
        fractalPrice: newPrice,
        availableEditions: a.availableEditions - quantity,
        priceHistory: [...a.priceHistory, { date: new Date().toISOString(), price: newPrice }],
        totalPortfolioValueHistory: [...a.totalPortfolioValueHistory, { date: new Date().toISOString(), value: newTotalPortfolioValue }]
      } : a
    ));

    // Update user wallet and collection
    setUser(prevUser => prevUser ? { ...prevUser, walletBalance: prevUser.walletBalance - totalCost } : null);
    
    const newFractals: OwnedFractal[] = Array.from({ length: quantity }, (_, i) => ({
      id: `${artist.id}-${Date.now()}-${i}`,
      artistId: artist.id,
      artistName: artist.name,
      purchasePrice: artist.fractalPrice,
      purchaseDate: new Date().toISOString(),
      serialNumber: `CRESTOX-${artist.id.split('-')[1]}-${String(Date.now() + i).slice(-6)}`,
      status: 'owned'
    }));
    
    setCollection(prevCollection => [...prevCollection, ...newFractals]);

  }, [user, collection, toast]);

  // --- Resale Market ---
   const listForResale = useCallback(async (artist: Artist, options: { quantity: number; initialPrice: number; minPrice: number; periodDays: number; }) => {
    if (!user) throw new Error("User must be logged in.");

    const availableToSell = collection.filter(f => f.artistId === artist.id && f.status === 'owned');
    if (options.quantity > availableToSell.length) {
      throw new Error("Not enough fractals to sell.");
    }
    
    const fractalsToList = availableToSell.slice(0, options.quantity);
    const fractalIdsToList = fractalsToList.map(f => f.id);

    // Update status of fractals in user's collection
    setCollection(prev => prev.map(f => fractalIdsToList.includes(f.id) ? { ...f, status: 'listed' } : f));

    // Create new resale listing
    const newListing: ResaleListing = {
      id: `resale-${Date.now()}`,
      resellerId: user.uid,
      artistId: artist.id,
      fractalIds: fractalIdsToList,
      quantity: options.quantity,
      initialPrice: options.initialPrice,
      minPrice: options.minPrice,
      periodSeconds: options.periodDays * 24 * 60 * 60,
      listingTimestamp: new Date().toISOString(),
      status: 'active'
    };
    setResaleListings(prev => [...prev, newListing]);
  }, [user, collection]);

  const cancelListing = useCallback(async (listingId: string) => {
    const listing = resaleListings.find(l => l.id === listingId);
    if (!listing) return;
    
    // Update listing status
    setResaleListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'cancelled' } : l));
    // Revert fractals to 'owned' status
    setCollection(prev => prev.map(f => listing.fractalIds.includes(f.id) ? { ...f, status: 'owned' } : f));
  }, [resaleListings]);


  // --- Watchlist ---
  const addToWatchlist = (artistId: string) => setWatchlist(prev => [...new Set([...prev, artistId])]);
  const removeFromWatchlist = (artistId: string) => setWatchlist(prev => prev.filter(id => id !== artistId));
  
  // --- Artist Profile & Artwork Management ---
  const createArtistProfile = useCallback(async (profileData: Omit<ArtistProfile, 'id' | 'userId' | 'fractalPrice' | 'priceHistory' | 'totalPortfolioValueHistory' | 'totalEditions' | 'availableEditions'>) => {
     if (!user) throw new Error("User must be logged in.");
     const newArtistId = `artist-${artists.length + 1}`;
     const newProfile: ArtistProfile = {
        id: newArtistId,
        userId: user.uid,
        ...profileData,
        fractalPrice: 25.00,
        priceHistory: [{ date: new Date().toISOString(), price: 25.00 }],
        totalPortfolioValueHistory: [{ date: new Date().toISOString(), value: 0 }],
        totalEditions: 0,
        availableEditions: 0
     };
     setArtists(prev => [...prev, newProfile]);
     setArtistProfile(newProfile);
  }, [user, artists.length]);
  
  const updateArtistProfile = useCallback(async (profileData: Partial<ArtistProfile>) => {
    if (!artistProfile) throw new Error("Artist profile not found.");
    setArtists(prev => prev.map(a => a.id === artistProfile.id ? { ...a, ...profileData } as Artist : a));
    setArtistProfile(prev => prev ? { ...prev, ...profileData } : null);
  }, [artistProfile]);

  const addArtwork = useCallback(async (artworkData: NewArtworkData, evaluationResult: EvaluationResult, finalPrice: number, shouldApplyGrade: boolean) => {
      if (!artistProfile) throw new Error("Artist profile not found.");
      
      const newFractal: Fractal = {
        id: `fractal-${fractals.length + 1}`,
        artistId: artistProfile.id,
        ...artworkData,
        width: 800, // Placeholder
        height: 600, // Placeholder
        aiHint: 'abstract art',
        price: finalPrice,
        priceHistory: [{ date: new Date().toISOString(), price: finalPrice }],
        aiScore: evaluationResult.finalScore,
        crestoxGrade: shouldApplyGrade ? evaluationResult.grade : undefined,
        aiScorecard: evaluationResult.breakdown,
        crestoxPriceRange: evaluationResult.crestoxPriceRange,
        artistMinEstimate: artworkData.minEstimatedValue,
        artistMaxEstimate: artworkData.maxEstimatedValue,
      };

      setFractals(prev => [...prev, newFractal]);

      // Update artist portfolio value and fractals
      const oldTotalValue = artistProfile.totalPortfolioValueHistory.slice(-1)[0]?.value ?? 0;
      const newTotalValue = oldTotalValue + newFractal.price;
      const newTotalEditions = artistProfile.totalEditions + artworkData.editionsToIssue;

      const newFractalPrice = newTotalEditions > 0 ? newTotalValue / newTotalEditions : artistProfile.fractalPrice;

      setArtists(prevArtists => prevArtists.map(a => {
        if (a.id === artistProfile.id) {
            const updatedArtist = {
                ...a,
                totalEditions: newTotalEditions,
                availableEditions: a.availableEditions + artworkData.editionsToIssue,
                totalPortfolioValueHistory: [...a.totalPortfolioValueHistory, { date: new Date().toISOString(), value: newTotalValue }],
                fractalPrice: newFractalPrice,
                priceHistory: [...a.priceHistory, { date: new Date().toISOString(), price: newFractalPrice }]
            };
            setArtistProfile(updatedArtist as ArtistProfile);
            return updatedArtist;
        }
        return a;
      }));

  }, [artistProfile, fractals.length]);

  const updateAndReevaluateArtwork = useCallback(async (artworkId: string, artworkData: EditArtworkFormValues, evaluationResult: EvaluationResult, useCrestoxPrice: boolean) => {
     if (!artistProfile) throw new Error("Artist profile not found.");

     const oldFractal = fractals.find(f => f.id === artworkId);
     if (!oldFractal) throw new Error("Artwork not found.");

     const crestoxPrice = Math.round((evaluationResult.crestoxPriceRange[0] + evaluationResult.crestoxPriceRange[1]) / 2);
     const artistPrice = Math.round((artworkData.minEstimatedValue + artworkData.maxEstimatedValue) / 2);
     const finalPrice = useCrestoxPrice ? crestoxPrice : artistPrice;
     const shouldApplyGrade = useCrestoxPrice || artistPrice <= crestoxPrice;
     
     const priceDifference = finalPrice - oldFractal.price;

     const artworkSize: ArtworkSize = { length: artworkData.length, breadth: artworkData.breadth, unit: artworkData.unit };
     if (artworkData.height) artworkSize.height = artworkData.height;

     const updatedFractal: Fractal = {
        ...oldFractal,
        ...artworkData,
        artworkSize,
        price: finalPrice,
        priceHistory: [...oldFractal.priceHistory, { date: new Date().toISOString(), price: finalPrice }],
        aiScore: evaluationResult.finalScore,
        crestoxGrade: shouldApplyGrade ? evaluationResult.grade : oldFractal.crestoxGrade,
        aiScorecard: evaluationResult.breakdown,
        crestoxPriceRange: evaluationResult.crestoxPriceRange,
        artistMinEstimate: artworkData.minEstimatedValue,
        artistMaxEstimate: artworkData.maxEstimatedValue,
     };
     setFractals(prev => prev.map(f => f.id === artworkId ? updatedFractal : f));

     const oldTotalValue = artistProfile.totalPortfolioValueHistory.slice(-1)[0]?.value ?? 0;
     const newTotalValue = oldTotalValue + priceDifference;
     const newTotalEditions = artistProfile.totalEditions + artworkData.editionsToIssue;
     const newFractalPrice = newTotalEditions > 0 ? newTotalValue / newTotalEditions : artistProfile.fractalPrice;

     setArtists(prevArtists => prevArtists.map(a => {
        if (a.id === artistProfile.id) {
            const updatedArtist = {
                ...a,
                totalEditions: newTotalEditions,
                availableEditions: a.availableEditions + artworkData.editionsToIssue,
                totalPortfolioValueHistory: [...a.totalPortfolioValueHistory, { date: new Date().toISOString(), value: newTotalValue }],
                fractalPrice: newFractalPrice,
                priceHistory: [...a.priceHistory, { date: new Date().toISOString(), price: newFractalPrice }]
            };
            setArtistProfile(updatedArtist as ArtistProfile);
            return updatedArtist;
        }
        return a;
      }));

  }, [artistProfile, fractals]);

  // --- Memoized Values ---
  const holdingsByArtist = useMemo(() => {
    return collection.reduce((acc, fractal) => {
      acc.set(fractal.artistId, (acc.get(fractal.artistId) || 0) + 1);
      return acc;
    }, new Map<string, number>());
  }, [collection]);

  const value = {
    isLoggedIn, user, artistProfile, artists, fractals, collection, watchlist, resaleListings, holdingsByArtist,
    login, logout, collectFromPortfolio, listForResale, cancelListing, addToWatchlist, removeFromWatchlist,
    createArtistProfile, updateArtistProfile, addArtwork, updateAndReevaluateArtwork
  };

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
