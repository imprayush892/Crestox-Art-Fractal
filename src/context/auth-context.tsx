
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
    // This effect is for initializing with mock data.
    // In a real app, you would fetch from a database.
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
    const newUser: User = { uid: 'mock-user-id', walletBalance: 50000 };
    setUser(newUser);
    setIsLoggedIn(true);
    toast({
        title: "Welcome!",
        description: "You've been credited with 50,000 CreCoins to start your collection."
    });
  };
  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  // --- Collection & Wallet ---
  const collectFromPortfolio = useCallback(async (artist: Artist, quantity: number) => {
    if (!user) throw new Error("User must be logged in.");
    if (quantity <= 0) throw new Error("Quantity must be greater than zero.");
    
    // Create mutable copies of state for the transaction
    let tempArtists = [...artists];
    let tempFractals = [...fractals];
    let tempCollection = [...collection];
    let tempResaleListings = [...resaleListings];
    let tempUser = {...user};
    const artistForTx = tempArtists.find(a => a.id === artist.id)!;

    // --- 1. Build and sort the order book ---
    let orderBook: { price: number; quantity: number; source: 'resale' | 'primary'; id: string; resellerId?: string, fractalIds?: string[] }[] = [];
    
    // Add resold shares to the order book
    tempResaleListings.filter(l => l.artistId === artist.id && l.status === 'active').forEach(listing => {
        const now = Date.now();
        const startTime = new Date(listing.listingTimestamp).getTime();
        const elapsedSeconds = (now - startTime) / 1000;
        let currentPrice = listing.initialPrice - (listing.initialPrice - listing.minPrice) * (elapsedSeconds / listing.periodSeconds);
        if (elapsedSeconds >= listing.periodSeconds) {
            currentPrice = listing.minPrice;
        }
        orderBook.push({
            price: Math.round(currentPrice * 100) / 100,
            quantity: listing.quantity,
            source: 'resale',
            id: listing.id,
            resellerId: listing.resellerId,
            fractalIds: listing.fractalIds,
        });
    });

    // Add primary shares from the artist
    if (artistForTx.availableEditions > 0) {
        orderBook.push({
            price: artistForTx.fractalPrice,
            quantity: artistForTx.availableEditions,
            source: 'primary',
            id: artistForTx.id
        });
    }

    // Sort by price (asc), prioritizing resold shares if prices are equal
    orderBook.sort((a, b) => a.price !== b.price ? a.price - b.price : a.source === 'resale' ? -1 : 1);

    // --- 2. Fulfill the order ---
    let remainingQty = quantity;
    let totalCost = 0;
    const purchasedShares: { price: number; quantity: number; source: 'resale' | 'primary'; id: string, resellerId?: string, fractalIds?: string[] }[] = [];
    
    for (const order of orderBook) {
        if (remainingQty <= 0) break;
        const qtyToTake = Math.min(remainingQty, order.quantity);
        purchasedShares.push({ ...order, quantity: qtyToTake });
        totalCost += qtyToTake * order.price;
        remainingQty -= qtyToTake;
    }
    
    if (remainingQty > 0) throw new Error("Not enough fractals available to fulfill the order.");
    if (tempUser.walletBalance < totalCost) throw new Error("Insufficient CreCoins for this transaction.");

    // --- 3. Execute Transaction & State Updates ---
    tempUser.walletBalance -= totalCost;
    
    const newOwnedFractals: OwnedFractal[] = [];
    
    purchasedShares.forEach(purchase => {
        // Handle consumption from the source
        if (purchase.source === 'resale') {
            const listingIndex = tempResaleListings.findIndex(l => l.id === purchase.id);
            if(listingIndex > -1) {
                tempResaleListings[listingIndex].quantity -= purchase.quantity;
                 if (tempResaleListings[listingIndex].quantity <= 0) {
                    tempResaleListings[listingIndex].status = 'sold';
                }
            }
        }
        
        // Create new fractals for the buyer
        for (let i = 0; i < purchase.quantity; i++) {
            newOwnedFractals.push({
                id: `${artist.id}-${Date.now()}-${Math.random()}`,
                artistId: artist.id,
                artistName: artist.name,
                purchasePrice: purchase.price,
                purchaseDate: new Date().toISOString(),
                serialNumber: `CRESTOX-${artist.id.split('-')[1]}-${String(Date.now() + i).slice(-6)}`,
                status: 'owned'
            });
        }
    });

    tempCollection.push(...newOwnedFractals);
    tempResaleListings = tempResaleListings.filter(l => l.status !== 'sold');

    // --- 4. Market Impact & Reverse Pricing ---
    const P_old = artistForTx.fractalPrice;
    const F = artistForTx.totalEditions;
    const BETA = 1.118;
    const P_new = F > 0 ? P_old * Math.exp(BETA * Math.sqrt(quantity / F)) : P_old;

    let artistArtworks = tempFractals.filter(f => f.artistId === artist.id);
    const V = artistArtworks.reduce((sum, f) => sum + f.price, 0);
    const sum_Si_Vi = artistArtworks.reduce((sum, f) => sum + (f.aiScore || 0) * f.price, 0);
    const k = sum_Si_Vi > 0 ? V / sum_Si_Vi : 0;
    
    if (k > 0) {
        const delta_V_eff = (P_new - P_old) * F;
        const sum_S_squared = artistArtworks.reduce((sum, f) => sum + Math.pow(f.aiScore || 0, 2), 0);
        const c = sum_S_squared > 0 ? delta_V_eff / (k * sum_S_squared) : 0;
        
        tempFractals = tempFractals.map(f => {
            if (f.artistId === artist.id) {
                const Vi_old = f.price;
                const Si = f.aiScore || 0;
                const delta_Vi = c * Si;
                const Vi_new = Math.max(0, Vi_old + delta_Vi);
                const rounded_Vi_new = Math.round(Vi_new * 100) / 100;
                return { ...f, price: rounded_Vi_new, priceHistory: [...f.priceHistory, { date: new Date().toISOString(), price: rounded_Vi_new }]};
            }
            return f;
        });
    }
    
    const newTotalPortfolioValue = tempFractals.filter(f => f.artistId === artist.id).reduce((sum, f) => sum + f.price, 0);
    const primarySharesBought = purchasedShares.filter(p => p.source === 'primary').reduce((sum, p) => sum + p.quantity, 0);
    
    const artistIndexToUpdate = tempArtists.findIndex(a => a.id === artist.id);
    const updatedArtist = {
        ...artistForTx,
        fractalPrice: P_new,
        availableEditions: artistForTx.availableEditions - primarySharesBought,
        priceHistory: [...artistForTx.priceHistory, { date: new Date().toISOString(), price: P_new }],
        totalPortfolioValueHistory: [...artistForTx.totalPortfolioValueHistory, { date: new Date().toISOString(), value: Math.round(newTotalPortfolioValue) }],
    };
    tempArtists[artistIndexToUpdate] = updatedArtist;
    
    // --- 5. Set All States Atomically ---
    setUser(tempUser);
    setCollection(tempCollection);
    setResaleListings(tempResaleListings);
    setArtists(tempArtists);
    setFractals(tempFractals);

  }, [user, artists, fractals, collection, resaleListings]);


  // --- Resale Market ---
   const listForResale = useCallback(async (artist: Artist, options: { quantity: number; initialPrice: number; minPrice: number; periodDays: number; }) => {
    if (!user) throw new Error("User must be logged in.");

    const availableToSell = collection.filter(f => f.artistId === artist.id && f.status === 'owned');
    if (options.quantity > availableToSell.length) {
      throw new Error("Not enough fractals to sell.");
    }
    
    const fractalsToList = availableToSell.slice(0, options.quantity);
    const fractalIdsToList = fractalsToList.map(f => f.id);

    // This is the correct way to update multiple states that depend on each other.
    // We create new versions of the arrays and then set them.
    const newCollection = collection.map(f => fractalIdsToList.includes(f.id) ? { ...f, status: 'listed' } : f);

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
    const newResaleListings = [...resaleListings, newListing];
    
    const newArtists = artists.map(a => {
        if (a.id === artist.id) {
            // Add the newly listed shares back to the available pool for buyers
            return { ...a, availableEditions: a.availableEditions + options.quantity };
        }
        return a;
    });

    // Set all states at once
    setCollection(newCollection);
    setResaleListings(newResaleListings);
    setArtists(newArtists);
    
    toast({
        title: 'Listing Successful!',
        description: `You have listed ${options.quantity} fractal${options.quantity > 1 ? 's' : ''} of ${artist.name}'s portfolio for sale.`,
    });

  }, [user, collection, artists, resaleListings, toast]);

  const cancelListing = useCallback(async (listingId: string) => {
    const listing = resaleListings.find(l => l.id === listingId && l.resellerId === user?.uid);
    if (!listing) return;
    
    const newCollection = collection.map(f => listing.fractalIds.includes(f.id) ? { ...f, status: 'owned' } : f);
    const newResaleListings = resaleListings.filter(l => l.id !== listingId);
    const newArtists = artists.map(a => {
        if (a.id === listing.artistId) {
            // Remove the shares from the available pool
            return { ...a, availableEditions: a.availableEditions - listing.quantity };
        }
        return a;
    });
    
    setCollection(newCollection);
    setResaleListings(newResaleListings);
    setArtists(newArtists);

    toast({ title: 'Listing Cancelled', description: 'Your fractals have been returned to your holdings.'});
  }, [resaleListings, user, collection, artists, toast]);


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
        availableEditions: 0,
        avatar: profileData.avatar || 'https://placehold.co/100x100.png'
     };
     setArtists(prev => [...prev, newProfile]);
     setArtistProfile(newProfile);
  }, [user, artists.length]);
  
  const updateArtistProfile = useCallback(async (profileData: Partial<ArtistProfile>) => {
    if (!artistProfile) throw new Error("Artist profile not found.");
    
    const newArtists = artists.map(a => a.id === artistProfile.id ? { ...a, ...profileData } as Artist : a);
    const newArtistProfile = { ...artistProfile, ...profileData };

    setArtists(newArtists);
    setArtistProfile(newArtistProfile);
  }, [artistProfile, artists]);

  const addArtwork = useCallback(async (artworkData: NewArtworkData, evaluationResult: EvaluationResult, finalPrice: number, shouldApplyGrade: boolean) => {
      if (!artistProfile) throw new Error("Artist profile not found.");
      
      const newFractal: Fractal = {
        id: `fractal-${fractals.length + 1}`,
        artistId: artistProfile.id,
        ...artworkData,
        width: 800, 
        height: 600,
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

      const newFractals = [...fractals, newFractal];
      setFractals(newFractals);

      const artistFractals = newFractals.filter(f => f.artistId === artistProfile.id);
      const V = artistFractals.reduce((sum, f) => sum + f.price, 0);
      const sum_Si_Vi = artistFractals.reduce((sum, f) => sum + (f.aiScore || 0) * f.price, 0);
      const k = sum_Si_Vi > 0 ? V / sum_Si_Vi : 0;
      
      const newTotalEditions = artistProfile.totalEditions + artworkData.editionsToIssue;
      const V_eff = k * sum_Si_Vi;
      const newFractalPrice = newTotalEditions > 0 ? V_eff / newTotalEditions : artistProfile.fractalPrice;

      setArtists(prevArtists => prevArtists.map(a => {
        if (a.id === artistProfile.id) {
            const updatedArtist = {
                ...a,
                totalEditions: newTotalEditions,
                availableEditions: a.availableEditions + artworkData.editionsToIssue,
                totalPortfolioValueHistory: [...a.totalPortfolioValueHistory, { date: new Date().toISOString(), value: Math.round(V) }],
                fractalPrice: newFractalPrice,
                priceHistory: [...a.priceHistory, { date: new Date().toISOString(), price: newFractalPrice }]
            };
            setArtistProfile(updatedArtist as ArtistProfile);
            return updatedArtist;
        }
        return a;
      }));

  }, [artistProfile, fractals]);

  const updateAndReevaluateArtwork = useCallback(async (artworkId: string, artworkData: EditArtworkFormValues, evaluationResult: EvaluationResult, useCrestoxPrice: boolean) => {
     if (!artistProfile) throw new Error("Artist profile not found.");

     const oldFractal = fractals.find(f => f.id === artworkId);
     if (!oldFractal) throw new Error("Artwork not found.");

     const crestoxPrice = Math.round((evaluationResult.crestoxPriceRange[0] + evaluationResult.crestoxPriceRange[1]) / 2);
     const artistPrice = Math.round((artworkData.minEstimatedValue + artworkData.maxEstimatedValue) / 2);
     const finalPrice = useCrestoxPrice ? crestoxPrice : artistPrice;
     const shouldApplyGrade = useCrestoxPrice || artistPrice <= crestoxPrice;
     
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
     
     const newFractals = fractals.map(f => f.id === artworkId ? updatedFractal : f);
     setFractals(newFractals);

      const artistFractals = newFractals.filter(f => f.artistId === artistProfile.id);
      const V = artistFractals.reduce((sum, f) => sum + f.price, 0);
      const sum_Si_Vi = artistFractals.reduce((sum, f) => sum + (f.aiScore || 0) * f.price, 0);
      const k = sum_Si_Vi > 0 ? V / sum_Si_Vi : 0;
      
      const newTotalEditions = artistProfile.totalEditions + artworkData.editionsToIssue;
      const V_eff = k * sum_Si_Vi;
      const newFractalPrice = newTotalEditions > 0 ? V_eff / newTotalEditions : artistProfile.fractalPrice;

     setArtists(prevArtists => prevArtists.map(a => {
        if (a.id === artistProfile.id) {
            const updatedArtist = {
                ...a,
                totalEditions: newTotalEditions,
                availableEditions: a.availableEditions + artworkData.editionsToIssue,
                totalPortfolioValueHistory: [...a.totalPortfolioValueHistory, { date: new Date().toISOString(), value: Math.round(V) }],
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
