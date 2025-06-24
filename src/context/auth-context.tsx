
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { artists as mockArtists, fractals as mockFractals, type Artist, type Fractal, type AIScorecardBreakdown, type ArtworkSize } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import type { EditArtworkFormValues } from '@/app/portfolio/artwork/edit/[id]/page';
import { evaluateArtwork } from '@/ai/flows/evaluate-artwork-flow';

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
  createArtistProfile: (profileData: Omit<ArtistProfile, 'id' | 'userId' | 'fractalPrice' | 'priceHistory' | 'totalPortfolioValueHistory' | 'totalEditions' | 'availableEditions' | 'avatar'> & { avatar?: any; }) => Promise<void>;
  updateArtistProfile: (profileData: Partial<ArtistProfile>) => Promise<void>;
  addArtwork: (artworkData: NewArtworkData, evaluationResult: EvaluationResult, finalPrice: number, shouldApplyGrade: boolean) => Promise<void>;
  updateAndReevaluateArtwork: (artworkId: string, artworkData: EditArtworkFormValues, evaluationResult: EvaluationResult, useCrestoxPrice: boolean) => Promise<void>;
  reevaluateArtworkForGrading: (fractal: Fractal) => Promise<void>;
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
  
  useEffect(() => {
    if(user) {
        const profile = artists.find(a => a.userId === user.uid) as ArtistProfile | undefined;
        setArtistProfile(profile || null);
    } else {
        setArtistProfile(null);
    }
  }, [user, artists]);
  
  useEffect(() => {
    if (isLoggedIn && user?.walletBalance === 50000) {
         toast({
            title: "Welcome!",
            description: "You've been credited with 50,000 CreCoins to start your collection."
        });
    }
  }, [isLoggedIn, user, toast]);

  const login = () => {
    const newUser: User = { uid: 'mock-user-id', walletBalance: 50000 };
    setUser(newUser);
    setIsLoggedIn(true);
  };
  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  const collectFromPortfolio = useCallback(async (artistToUpdate: Artist, quantity: number) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Login Required', description: 'You must be logged in to collect fractals.' });
        return;
    }
    if (quantity <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Quantity', description: 'Quantity must be greater than zero.' });
        return;
    }

    const artist = artists.find(a => a.id === artistToUpdate.id);
    if (!artist) {
        toast({ variant: 'destructive', title: 'Error', description: 'Artist not found.' });
        return;
    }

    let orderBook: { price: number; quantity: number; source: 'resale' | 'primary'; listingId?: string; resellerId?: string; fractalIds?: string[] }[] = [];
    const activeResaleListings = resaleListings.filter(l => l.artistId === artist.id && l.status === 'active');
    
    activeResaleListings.forEach(listing => {
        const t = (Date.now() - new Date(listing.listingTimestamp).getTime()) / 1000;
        const price = Math.max(listing.minPrice, listing.initialPrice - ((listing.initialPrice - listing.minPrice) * t / listing.periodSeconds));
        orderBook.push({
          price: Math.round(price * 100) / 100,
          quantity: listing.quantity,
          source: 'resale',
          listingId: listing.id,
          resellerId: listing.resellerId,
          fractalIds: [...listing.fractalIds], 
        });
    });

    if (artist.availableEditions > 0) {
      orderBook.push({
        price: artist.fractalPrice,
        quantity: artist.availableEditions,
        source: 'primary'
      });
    }

    orderBook.sort((a, b) => a.price !== b.price ? a.price - b.price : a.source === 'resale' ? -1 : 1);

    let remainingQty = quantity;
    let cost = 0;
    const newOwnedFractalsForBuyer: OwnedFractal[] = [];
    let sellerProceeds: Record<string, number> = {};
    let tempResaleListings = [...resaleListings];
    let tempCollection = [...collection];
    let artistPrimarySharesSold = 0;

    for (const order of orderBook) {
      if (remainingQty <= 0) break;
      const qtyToTake = Math.min(remainingQty, order.quantity);
      
      cost += qtyToTake * order.price;

      if (order.source === 'resale' && order.listingId && order.resellerId) {
        const listingIndex = tempResaleListings.findIndex(l => l.id === order.listingId);
        if (listingIndex > -1) {
          const currentListing = {...tempResaleListings[listingIndex]};
          const soldFractalIds = currentListing.fractalIds.splice(0, qtyToTake);
          
          tempCollection = tempCollection.filter(f => !soldFractalIds.includes(f.id));
          
          sellerProceeds[order.resellerId] = (sellerProceeds[order.resellerId] || 0) + (qtyToTake * order.price);

          currentListing.quantity -= qtyToTake;
          if (currentListing.quantity <= 0) {
             currentListing.status = 'sold';
          }
          tempResaleListings[listingIndex] = currentListing;
        }
      } else { 
        artistPrimarySharesSold += qtyToTake;
      }
      
      for (let i = 0; i < qtyToTake; i++) {
         newOwnedFractalsForBuyer.push({
            id: `${artist.id}-${Date.now()}-${Math.random()}`,
            artistId: artist.id,
            artistName: artist.name,
            purchasePrice: order.price,
            purchaseDate: new Date().toISOString(),
            serialNumber: `CRESTOX-${artist.id.split('-')[1]}-${String(Date.now() + i).slice(-6)}`,
            status: 'owned'
        });
      }
      remainingQty -= qtyToTake;
    }

    if (remainingQty > 0) {
      toast({ variant: "destructive", title: "Order Failed", description: "Not enough fractals available to fulfill the order." });
      return;
    }
    if (user.walletBalance < cost) {
      toast({ variant: "destructive", title: "Order Failed", description: "Insufficient CreCoins for this transaction." });
      return;
    }
    
    const finalCost = cost;
    const newUser = { ...user, walletBalance: user.walletBalance - finalCost };
    
    if(sellerProceeds[user.uid]) {
        newUser.walletBalance += sellerProceeds[user.uid];
    }

    const P_old = artist.fractalPrice;
    const F = artist.totalEditions;
    const BETA = 1.118;
    const P_new = F > 0 ? P_old * Math.exp(BETA * Math.sqrt(quantity / F)) : P_old;
    const P_new_rounded = Math.round(P_new * 100) / 100;
    
    const artistArtworks = fractals.filter(f => f.artistId === artist.id);
    const V = artistArtworks.reduce((sum, f) => sum + f.price, 0);
    const sum_Si_Vi = artistArtworks.reduce((sum, f) => sum + (f.aiScore || 0) * f.price, 0);
    const k = sum_Si_Vi > 0 ? V / sum_Si_Vi : 0;
    
    let newFractals = [...fractals];
    if (k > 0) {
        const delta_V_eff = (P_new_rounded - P_old) * F;
        const sum_S_squared = artistArtworks.reduce((sum, f) => sum + Math.pow(f.aiScore || 0, 2), 0);
        const c = sum_S_squared > 0 ? delta_V_eff / (k * sum_S_squared) : 0;
        
        newFractals = fractals.map(f => {
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
    
    const newTotalPortfolioValue = newFractals.filter(f => f.artistId === artist.id).reduce((sum, f) => sum + f.price, 0);
    
    const newArtistData = {
        ...artist,
        availableEditions: artist.availableEditions - artistPrimarySharesSold,
        fractalPrice: P_new_rounded,
        priceHistory: [...artist.priceHistory, { date: new Date().toISOString(), price: P_new_rounded }],
        totalPortfolioValueHistory: [...artist.totalPortfolioValueHistory, { date: new Date().toISOString(), value: Math.round(newTotalPortfolioValue) }],
    };

    const newArtists = artists.map(a => a.id === artist.id ? newArtistData : a);

    setArtists(newArtists);
    setFractals(newFractals);
    setCollection([...tempCollection, ...newOwnedFractalsForBuyer]);
    setResaleListings(tempResaleListings.filter(l => l.status === 'active'));
    setUser(newUser);

    toast({
        title: 'Collection Successful!',
        description: `You have collected ${quantity} fractal${quantity > 1 ? 's' : ''} of ${artist.name}'s portfolio for ${finalCost.toFixed(2)} CreCoins.`,
    });

  }, [user, artists, fractals, collection, resaleListings, toast]);


  const listForResale = useCallback(async (artist: Artist, options: { quantity: number; initialPrice: number; minPrice: number; periodDays: number; }) => {
    if (!user) throw new Error("User must be logged in.");

    const availableToSell = collection.filter(f => f.artistId === artist.id && f.status === 'owned');
    if (options.quantity > availableToSell.length) {
      toast({ variant: 'destructive', title: 'Listing Failed', description: "Not enough fractals to sell."});
      return;
    }
    
    const fractalsToList = availableToSell.slice(0, options.quantity);
    const fractalIdsToList = fractalsToList.map(f => f.id);

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
    setCollection(prev => prev.map(f => fractalIdsToList.includes(f.id) ? { ...f, status: 'listed' } : f));
    setArtists(prev => prev.map(a => 
      a.id === artist.id 
        ? { ...a, availableEditions: a.availableEditions + options.quantity } 
        : a
    ));
    toast({ title: 'Listing Successful!', description: `${options.quantity} fractal(s) have been listed for sale.`});

  }, [user, collection, toast]);

  const cancelListing = useCallback(async (listingId: string) => {
    const listing = resaleListings.find(l => l.id === listingId && l.resellerId === user?.uid);
    if (!listing) return;
    
    setCollection(prev => prev.map(f => listing.fractalIds.includes(f.id) ? { ...f, status: 'owned' } : f));
    setResaleListings(prev => prev.filter(l => l.id !== listingId));
    setArtists(prev => prev.map(a => 
      a.id === listing.artistId 
        ? { ...a, availableEditions: a.availableEditions - listing.quantity } 
        : a
    ));

    toast({ title: 'Listing Cancelled', description: 'Your fractals have been returned to your holdings.'});
  }, [resaleListings, user, toast]);


  const addToWatchlist = (artistId: string) => setWatchlist(prev => [...new Set([...prev, artistId])]);
  const removeFromWatchlist = (artistId: string) => setWatchlist(prev => prev.filter(id => id !== artistId));
  
  const createArtistProfile = useCallback(async (profileData: Omit<ArtistProfile, 'id' | 'userId' | 'fractalPrice' | 'priceHistory' | 'totalPortfolioValueHistory' | 'totalEditions' | 'availableEditions' | 'avatar'> & { avatar?: any; }) => {
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
    
    setArtists(prevArtists => prevArtists.map(a => a.id === artistProfile.id ? { ...a, ...profileData } as Artist : a));
    setArtistProfile(prevProfile => prevProfile ? { ...prevProfile, ...profileData } : null);

  }, [artistProfile]);

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
    
    const updatedFractals = [...fractals, newFractal];
    setFractals(updatedFractals);

    setArtists(prevArtists => {
      const artistIndex = prevArtists.findIndex(a => a.id === artistProfile.id);
      if (artistIndex === -1) return prevArtists;

      let tempArtists = [...prevArtists];
      let artistToUpdate = { ...tempArtists[artistIndex] };
      
      const artistFractals = updatedFractals.filter(f => f.artistId === artistToUpdate.id);
      const V = artistFractals.reduce((sum, f) => sum + f.price, 0);
      const sum_Si_Vi = artistFractals.reduce((sum, f) => sum + (f.aiScore || 0) * f.price, 0);
      const k = sum_Si_Vi > 0 ? V / sum_Si_Vi : 0;
      
      const newTotalEditions = artistToUpdate.totalEditions + artworkData.editionsToIssue;
      const V_eff = k * sum_Si_Vi;
      const newFractalPrice = newTotalEditions > 0 ? V_eff / newTotalEditions : artistToUpdate.fractalPrice;
      const newFractalPriceRounded = Math.round(newFractalPrice * 100) / 100;

      const updatedArtist = {
          ...artistToUpdate,
          totalEditions: newTotalEditions,
          availableEditions: artistToUpdate.availableEditions + artworkData.editionsToIssue,
          totalPortfolioValueHistory: [...artistToUpdate.totalPortfolioValueHistory, { date: new Date().toISOString(), value: Math.round(V) }],
          fractalPrice: newFractalPriceRounded,
          priceHistory: [...artistToUpdate.priceHistory, { date: new Date().toISOString(), price: newFractalPriceRounded }]
      };
      tempArtists[artistIndex] = updatedArtist;
      setArtistProfile(updatedArtist as ArtistProfile);
      return tempArtists;
    });

  }, [artistProfile, fractals]);

  const updateAndReevaluateArtwork = useCallback(async (artworkId: string, artworkData: EditArtworkFormValues, evaluationResult: EvaluationResult, useCrestoxPrice: boolean) => {
    if (!artistProfile) throw new Error("Artist profile not found.");

    let finalFractals: Fractal[] = [];
    setFractals(prevFractals => {
        const oldFractal = prevFractals.find(f => f.id === artworkId);
        if (!oldFractal) return prevFractals;

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
        
        finalFractals = prevFractals.map(f => f.id === artworkId ? updatedFractal : f);
        return finalFractals;
    });

    setArtists(prevArtists => {
      if (finalFractals.length === 0) return prevArtists;

      const artistIndex = prevArtists.findIndex(a => a.id === artistProfile.id);
      if (artistIndex === -1) return prevArtists;

      let tempArtists = [...prevArtists];
      let artistToUpdate = { ...tempArtists[artistIndex] };
      
      const artistFractals = finalFractals.filter(f => f.artistId === artistToUpdate.id);
      const V = artistFractals.reduce((sum, f) => sum + f.price, 0);
      const sum_Si_Vi = artistFractals.reduce((sum, f) => sum + (f.aiScore || 0) * f.price, 0);
      const k = sum_Si_Vi > 0 ? V / sum_Si_Vi : 0;
      
      const newTotalEditions = artistToUpdate.totalEditions + artworkData.editionsToIssue;
      const V_eff = k * sum_Si_Vi;
      const newFractalPrice = newTotalEditions > 0 ? V_eff / newTotalEditions : artistToUpdate.fractalPrice;
      const newFractalPriceRounded = Math.round(newFractalPrice * 100) / 100;

      const updatedArtist = {
          ...artistToUpdate,
          totalEditions: newTotalEditions,
          availableEditions: artistToUpdate.availableEditions + artworkData.editionsToIssue,
          totalPortfolioValueHistory: [...artistToUpdate.totalPortfolioValueHistory, { date: new Date().toISOString(), value: Math.round(V) }],
          fractalPrice: newFractalPriceRounded,
          priceHistory: [...artistToUpdate.priceHistory, { date: new Date().toISOString(), price: newFractalPriceRounded }]
      };
      tempArtists[artistIndex] = updatedArtist;
      setArtistProfile(updatedArtist as ArtistProfile);
      return tempArtists;
    });

  }, [artistProfile]);
  
  const reevaluateArtworkForGrading = useCallback(async (fractalToReevaluate: Fractal) => {
    if (!artistProfile) throw new Error("Artist profile not found.");
    
    const artworkSizeString = `${fractalToReevaluate.artworkSize.length} x ${fractalToReevaluate.artworkSize.breadth}${fractalToReevaluate.artworkSize.height ? ` x ${fractalToReevaluate.artworkSize.height}` : ''} ${fractalToReevaluate.artworkSize.unit}`;

    const evaluationInput = {
        photoDataUri: fractalToReevaluate.image,
        title: fractalToReevaluate.title,
        description: fractalToReevaluate.description,
        materials: fractalToReevaluate.materials,
        artworkSize: artworkSizeString,
        minEstimatedValue: fractalToReevaluate.artistMinEstimate || 0,
        maxEstimatedValue: fractalToReevaluate.artistMaxEstimate || 0,
        subjectSignificance: fractalToReevaluate.subjectSignificance,
        personalSignificance: fractalToReevaluate.personalSignificance,
        timeEffort: fractalToReevaluate.timeEffort,
        biographicalContext: fractalToReevaluate.biographicalContext,
        commissionPatronage: fractalToReevaluate.commissionPatronage,
        artistBio: artistProfile.bio,
        artistAwards: artistProfile.awards.join(', '),
        artistExhibitions: artistProfile.exhibitions.join(', '),
    };

    const evaluationResult = await evaluateArtwork(evaluationInput);

    const artworkId = fractalToReevaluate.id;
    let finalFractals: Fractal[] = [];
    
    setFractals(prevFractals => {
        const oldFractal = prevFractals.find(f => f.id === artworkId);
        if (!oldFractal) return prevFractals;

        const crestoxPrice = Math.round((evaluationResult.crestoxPriceRange[0] + evaluationResult.crestoxPriceRange[1]) / 2);
        
        const updatedFractal: Fractal = {
          ...oldFractal,
          price: crestoxPrice,
          priceHistory: [...oldFractal.priceHistory, { date: new Date().toISOString(), price: crestoxPrice }],
          aiScore: evaluationResult.finalScore,
          crestoxGrade: evaluationResult.grade,
          aiScorecard: evaluationResult.breakdown,
          crestoxPriceRange: evaluationResult.crestoxPriceRange,
        };
        
        finalFractals = prevFractals.map(f => f.id === artworkId ? updatedFractal : f);
        return finalFractals;
    });

    setArtists(prevArtists => {
        if (finalFractals.length === 0) return prevArtists;

        const artistIndex = prevArtists.findIndex(a => a.id === artistProfile.id);
        if (artistIndex === -1) return prevArtists;

        let tempArtists = [...prevArtists];
        let artistToUpdate = { ...tempArtists[artistIndex] };
        
        const artistFractals = finalFractals.filter(f => f.artistId === artistToUpdate.id);
        const V = artistFractals.reduce((sum, f) => sum + f.price, 0);

        const updatedArtist = {
            ...artistToUpdate,
            totalPortfolioValueHistory: [...artistToUpdate.totalPortfolioValueHistory, { date: new Date().toISOString(), value: Math.round(V) }],
        };
        
        tempArtists[artistIndex] = updatedArtist;
        setArtistProfile(updatedArtist as ArtistProfile);
        return tempArtists;
    });

  }, [artistProfile]);

  const holdingsByArtist = useMemo(() => {
    return collection.reduce((acc, fractal) => {
      acc.set(fractal.artistId, (acc.get(fractal.artistId) || 0) + 1);
      return acc;
    }, new Map<string, number>());
  }, [collection]);

  const value = {
    isLoggedIn, user, artistProfile, artists, fractals, collection, watchlist, resaleListings, holdingsByArtist,
    login, logout, collectFromPortfolio, listForResale, cancelListing, addToWatchlist, removeFromWatchlist,
    createArtistProfile, updateArtistProfile, addArtwork, updateAndReevaluateArtwork, reevaluateArtworkForGrading
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
