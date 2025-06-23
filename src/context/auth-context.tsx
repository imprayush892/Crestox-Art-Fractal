

'use client';

import type { Artist, Fractal, AIScorecardBreakdown } from '@/lib/data';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection as firestoreCollection, doc, onSnapshot, runTransaction, query, where, orderBy, limit, getDocs, writeBatch, Timestamp, collection, addDoc, updateDoc, getDoc } from 'firebase/firestore';
import type { ReevaluationResult } from '@/actions/reevaluate';

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

type NewArtworkData = {
    title: string;
    description: string;
    materials: string;
    artworkSize: string;
    minEstimatedValue: number;
    maxEstimatedValue: number;
    editionsToIssue: number;
    image: string; // data URI
    subjectSignificance?: string;
    personalSignificance?: string;
    timeEffort?: string;
    biographicalContext?: string;
    commissionPatronage?: string;
};

type CreateArtistProfileData = Omit<Artist, 'id'|'avatar'|'fractalPrice'|'priceHistory'|'totalPortfolioValueHistory'|'totalEditions'|'availableEditions'|'userId'>;

interface EvaluationResult {
    finalScore: number;
    grade: 'AAA' | 'AA' | 'A+' | 'A' | 'A-';
    breakdown: AIScorecardBreakdown[];
    crestoxPriceRange: [number, number];
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: { uid: string } | null;
  artistProfile: Artist | null;
  login: () => Promise<void>;
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
  createArtistProfile: (profileData: CreateArtistProfileData) => Promise<void>;
  updateArtistProfile: (profileData: Partial<Omit<Artist, 'id' | 'userId'>>) => Promise<void>;
  addArtwork: (artworkData: NewArtworkData, evaluation: EvaluationResult, finalPrice: number, shouldApplyGrade: boolean) => Promise<void>;
  updateArtworkDetails: (artworkId: string, data: { title: string; description: string; }) => Promise<void>;
  updateArtworkWithCrestoxValuation: (artworkId: string, evaluation: ReevaluationResult) => Promise<void>;
  updateArtworkWithNewScorecard: (artworkId: string, evaluation: ReevaluationResult) => Promise<void>;
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
  const [artistProfile, setArtistProfile] = useState<Artist | null>(null);
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

  const login = useCallback(async () => {
    const mockUser = { uid: 'mock-user-id' };
    setUser(mockUser);
    setIsLoggedIn(true);

    if (db) {
        try {
            const artistsQuery = query(collection(db, 'artists'), where('userId', '==', mockUser.uid), limit(1));
            const snapshot = await getDocs(artistsQuery);
            if (!snapshot.empty) {
                const userArtistProfile = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as Artist;
                setArtistProfile(userArtistProfile);
            } else {
                setArtistProfile(null);
            }
        } catch(e) {
            console.error("Error fetching artist profile:", e);
            setArtistProfile(null);
        }
    } else {
        const existingProfile = artists.find(a => a.userId === mockUser.uid);
        setArtistProfile(existingProfile || null);
    }
  }, [artists]);
  
  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setArtistProfile(null);
  };

  const createArtistProfile = useCallback(async (profileData: CreateArtistProfileData) => {
    if (!user) throw new Error("User must be logged in to create a profile.");

    const newArtistData: Omit<Artist, 'id'> = {
        userId: user.uid,
        name: profileData.name,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
        style: profileData.style,
        awardsAndExhibitions: profileData.awardsAndExhibitions,
        avatar: 'https://placehold.co/100x100.png',
        fractalPrice: 0,
        priceHistory: [],
        totalPortfolioValueHistory: [],
        totalEditions: 0,
        availableEditions: 0,
    };
    
    if (db) {
        const docRef = await addDoc(collection(db, 'artists'), newArtistData);
        const createdArtist: Artist = { ...newArtistData, id: docRef.id };
        setArtistProfile(createdArtist);
    } else {
        console.warn("Firebase not configured. Simulating artist creation locally.");
        const createdArtist: Artist = { ...newArtistData, id: `local-artist-${Date.now()}` };
        setArtistProfile(createdArtist);
        setArtists(prev => [...prev, createdArtist]);
    }

  }, [user]);
  
  const updateArtistProfile = useCallback(async (profileData: Partial<Omit<Artist, 'id' | 'userId'>>) => {
    if (!user || !artistProfile) throw new Error("User or artist profile not available for update.");
    
    if (db) {
        const artistRef = doc(db, 'artists', artistProfile.id);
        await updateDoc(artistRef, profileData);
        setArtistProfile(prev => prev ? { ...prev, ...profileData } : null);
    } else {
        console.warn("Firebase not configured. Simulating profile update locally.");
        const updatedProfile = { ...artistProfile, ...profileData };
        setArtistProfile(updatedProfile);
        setArtists(prev => prev.map(a => a.id === artistProfile.id ? updatedProfile : a));
    }
  }, [user, artistProfile]);
  
  const addArtwork = useCallback(async (artworkData: NewArtworkData, evaluation: EvaluationResult, finalPrice: number, shouldApplyGrade: boolean) => {
    if (!user || !artistProfile) throw new Error("Artist profile not found.");

    if (db) {
        const artistRef = doc(db, 'artists', artistProfile.id);
        const fractalCollectionRef = collection(db, 'fractals');

        await runTransaction(db, async (transaction) => {
            const artistDoc = await transaction.get(artistRef);
            if (!artistDoc.exists()) throw new Error("Artist does not exist.");

            const artistData = artistDoc.data() as Artist;

            const newFractalData: Omit<Fractal, 'id'> = {
                title: artworkData.title,
                image: artworkData.image,
                artistId: artistProfile.id,
                description: artworkData.description,
                materials: artworkData.materials,
                artworkSize: artworkData.artworkSize,
                aiHint: 'custom artwork',
                width: 1000,
                height: 1000,
                price: finalPrice,
                priceHistory: [{ date: new Date().toISOString(), price: finalPrice }],
                editions: 1,
                editionsAvailable: 1,
                aiScore: evaluation.finalScore,
                aiGrade: shouldApplyGrade ? evaluation.grade : undefined,
                aiScorecard: evaluation.breakdown,
                crestoxPriceRange: evaluation.crestoxPriceRange,
            };
            const newFractalRef = doc(fractalCollectionRef);
            transaction.set(newFractalRef, newFractalData);

            // 2. Update the artist's portfolio
            const newTotalPortfolioValue = (artistData.totalPortfolioValueHistory.slice(-1)[0]?.value ?? 0) + finalPrice;
            const newTotalEditions = artistData.totalEditions + artworkData.editionsToIssue;
            const newAvailableEditions = artistData.availableEditions + artworkData.editionsToIssue;
            const newFractalPrice = newTotalEditions > 0 ? newTotalPortfolioValue / newTotalEditions : 0;
            const roundedNewFractalPrice = Math.round(newFractalPrice * 100) / 100;
            const now = new Date().toISOString();

            const updatedArtistData = {
                totalEditions: newTotalEditions,
                availableEditions: newAvailableEditions,
                fractalPrice: roundedNewFractalPrice,
                priceHistory: [...artistData.priceHistory, { date: now, price: roundedNewFractalPrice }],
                totalPortfolioValueHistory: [...artistData.totalPortfolioValueHistory, { date: now, value: newTotalPortfolioValue }],
            };

            transaction.update(artistRef, updatedArtistData);
        });
    } else {
        console.warn("Firebase not configured. Simulating artwork creation locally.");

        const createdFractal: Fractal = {
            id: `local-fractal-${Date.now()}`,
            title: artworkData.title,
            image: artworkData.image,
            artistId: artistProfile.id,
            description: artworkData.description,
            materials: artworkData.materials,
            artworkSize: artworkData.artworkSize,
            aiHint: 'custom artwork',
            width: 1000,
            height: 1000,
            price: finalPrice,
            priceHistory: [{ date: new Date().toISOString(), price: finalPrice }],
            editions: 1,
            editionsAvailable: 1,
            aiScore: evaluation.finalScore,
            aiGrade: shouldApplyGrade ? evaluation.grade : undefined,
            aiScorecard: evaluation.breakdown,
            crestoxPriceRange: evaluation.crestoxPriceRange,
        };
        setFractals(prev => [...prev, createdFractal]);

        const artistToUpdate = artists.find(a => a.id === artistProfile.id);
        if (artistToUpdate) {
            const newTotalPortfolioValue = (artistToUpdate.totalPortfolioValueHistory.slice(-1)[0]?.value ?? 0) + finalPrice;
            const newTotalEditions = artistToUpdate.totalEditions + artworkData.editionsToIssue;
            const newAvailableEditions = artistToUpdate.availableEditions + artworkData.editionsToIssue;
            const newFractalPrice = newTotalEditions > 0 ? newTotalPortfolioValue / newTotalEditions : 0;
            const roundedNewFractalPrice = Math.round(newFractalPrice * 100) / 100;
            const now = new Date().toISOString();

            const updatedArtist = {
                ...artistToUpdate,
                totalEditions: newTotalEditions,
                availableEditions: newAvailableEditions,
                fractalPrice: roundedNewFractalPrice,
                priceHistory: [...artistToUpdate.priceHistory, { date: now, price: roundedNewFractalPrice }],
                totalPortfolioValueHistory: [...artistToUpdate.totalPortfolioValueHistory, { date: now, value: newTotalPortfolioValue }],
            };
            setArtists(prev => prev.map(a => a.id === artistProfile.id ? updatedArtist : a));
            setArtistProfile(updatedArtist);
        }
    }
  }, [user, artistProfile, artists]);

  const updateArtworkDetails = useCallback(async (artworkId: string, data: { title: string; description: string; }) => {
    if (!user || !artistProfile) throw new Error("Artist profile not found.");

    if (db) {
        const artworkRef = doc(db, 'fractals', artworkId);
        const artworkDoc = await getDoc(artworkRef);

        if (!artworkDoc.exists() || artworkDoc.data().artistId !== artistProfile.id) {
            throw new Error("Artwork not found or you do not have permission to edit it.");
        }
        
        await updateDoc(artworkRef, {
            title: data.title,
            description: data.description,
        });

    } else {
        console.warn("Firebase not configured. Simulating artwork update locally.");
        setFractals(prevFractals =>
            prevFractals.map(f =>
                f.id === artworkId && f.artistId === artistProfile.id
                    ? { ...f, title: data.title, description: data.description }
                    : f
            )
        );
    }
  }, [user, artistProfile]);
  
  const updateArtworkWithCrestoxValuation = useCallback(async (artworkId: string, evaluation: ReevaluationResult) => {
    if (!db || !artistProfile) throw new Error("Not available");
    
    await runTransaction(db, async (transaction) => {
        const artistRef = doc(db, 'artists', artistProfile.id);
        const fractalRef = doc(db, 'fractals', artworkId);

        const [artistDoc, fractalDoc] = await Promise.all([
            transaction.get(artistRef),
            transaction.get(fractalRef)
        ]);

        if (!artistDoc.exists() || !fractalDoc.exists()) throw new Error("Data not found.");
        
        const artistData = artistDoc.data() as Artist;
        const fractalData = fractalDoc.data() as Fractal;

        const oldPrice = fractalData.price;
        const newPrice = Math.round((evaluation.crestoxPriceRange[0] + evaluation.crestoxPriceRange[1]) / 2);
        const priceDifference = newPrice - oldPrice;
        
        transaction.update(fractalRef, {
            price: newPrice,
            aiGrade: evaluation.grade,
            aiScore: evaluation.finalScore,
            aiScorecard: evaluation.breakdown,
            crestoxPriceRange: evaluation.crestoxPriceRange,
            priceHistory: [...fractalData.priceHistory, { date: new Date().toISOString(), price: newPrice }],
        });

        const newTotalPortfolioValue = (artistData.totalPortfolioValueHistory.slice(-1)[0]?.value ?? 0) + priceDifference;
        const newFractalPrice = artistData.totalEditions > 0 ? newTotalPortfolioValue / artistData.totalEditions : 0;
        const roundedNewFractalPrice = Math.round(newFractalPrice * 100) / 100;
        const now = new Date().toISOString();
        
        transaction.update(artistRef, {
            fractalPrice: roundedNewFractalPrice,
            totalPortfolioValueHistory: [...artistData.totalPortfolioValueHistory, { date: now, value: newTotalPortfolioValue }],
            priceHistory: [...artistData.priceHistory, { date: now, price: roundedNewFractalPrice }]
        });
    });
  }, [artistProfile]);

  const updateArtworkWithNewScorecard = useCallback(async (artworkId: string, evaluation: ReevaluationResult) => {
    if (!db) throw new Error("Not available");

    const fractalRef = doc(db, 'fractals', artworkId);
    await updateDoc(fractalRef, {
        aiScore: evaluation.finalScore,
        aiScorecard: evaluation.breakdown,
        crestoxPriceRange: evaluation.crestoxPriceRange,
    });
  }, []);

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
        const listingToCancel = resaleListings.find(l => l.id === listingId);
        if (!listingToCancel) return;

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

  }, [user, resaleListings]);

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
    
    // OFFLINE / DEMO MODE
    if (!db) {
        console.warn("Firebase not configured. Simulating investment locally.");
        const artistData = artists.find(a => a.id === artist.id);
        if (!artistData) throw new Error("Artist not found for local simulation");

        const activeResaleListings = resaleListings.filter(l => l.artistId === artist.id && l.status === 'active');
        
        type Share = { price: number; isResold: boolean; sourceId: string; resellerId?: string; listingId?: string };
        const orderBook: Share[] = [];
        const now = new Date();

        activeResaleListings.forEach(listing => {
            const t = (now.getTime() - new Date(listing.listingTimestamp).getTime()) / 1000;
            const P_t = t >= listing.periodSeconds 
                ? listing.minPrice 
                : listing.initialPrice - (listing.initialPrice - listing.minPrice) * (t / listing.periodSeconds);
            
            for (let i = 0; i < listing.quantity; i++) {
                orderBook.push({ price: P_t, isResold: true, sourceId: listing.id, resellerId: listing.resellerId, listingId: listing.id });
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
        let newCollection = [...collection];

        for (const share of sharesToBuy) {
            const serialNumber = `CRESTOX-${artist.id.split('-')[1]}-${String(Date.now()).slice(-6)}-${Math.random().toString(36).substring(2, 5)}`;
            const purchasePriceWithTax = Math.round(share.price * 1.18 * 100) / 100;
            
            const newOwnedFractal: OwnedFractal = {
                id: `local-fractal-${Date.now()}-${Math.random()}`,
                artistId: artist.id,
                artistName: artist.name,
                purchasePrice: purchasePriceWithTax,
                purchaseDate: purchaseDate,
                serialNumber: serialNumber,
                status: 'available'
            };
            newOwnedFractals.push(newOwnedFractal);

            if (share.isResold && share.listingId) {
                const listingIndex = newResaleListings.findIndex(l => l.id === share.listingId);
                if (listingIndex !== -1) {
                    const updatedListing = { ...newResaleListings[listingIndex] };
                    updatedListing.quantity -= 1;
                    if (updatedListing.quantity === 0) {
                        updatedListing.status = 'completed';
                    }
                    newResaleListings[listingIndex] = updatedListing;
                }
                // Remove a listed fractal from the seller's collection
                const sellerFractalIndex = newCollection.findIndex(f => f.listingId === share.listingId);
                if(sellerFractalIndex > -1){
                    newCollection.splice(sellerFractalIndex, 1);
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
        
        setCollection([...newCollection, ...newOwnedFractals]);
        setArtists(prevArtists => prevArtists.map(a => a.id === artist.id ? newArtistData : a));
        setResaleListings(newResaleListings);

        return;
    }
    
    // ONLINE / FIREBASE MODE
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
            const purchasePriceWithTax = Math.round(share.price * 1.18 * 100) / 100;
            const newOwnedFractal: Omit<OwnedFractal, 'id'> = {
                artistId: artist.id,
                artistName: artist.name,
                purchasePrice: purchasePriceWithTax,
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

                if (share.resellerId) {
                    const resellerFractalQuery = query(
                        collection(db, 'users', share.resellerId, 'ownedFractals'),
                        where('listingId', '==', share.sourceId),
                        limit(1)
                    );
                    const resellerFractalSnapshot = await getDocs(resellerFractalQuery);
                    if (!resellerFractalSnapshot.empty) {
                        transaction.delete(resellerFractalSnapshot.docs[0].ref);
                    }
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
  }, [user, artists, resaleListings, collection]);

  const holdingsByArtist = new Map<string, number>();
  collection.forEach(fractal => {
      if (fractal.status !== 'listed') {
        holdingsByArtist.set(fractal.artistId, (holdingsByArtist.get(fractal.artistId) || 0) + 1);
      }
  });

  const value = { isLoggedIn, user, artistProfile, login, logout, collection, investInPortfolio, listForResale, cancelListing, holdingsByArtist, artists, fractals, resaleListings, watchlist, addToWatchlist, removeFromWatchlist, createArtistProfile, updateArtistProfile, addArtwork, updateArtworkDetails, updateArtworkWithCrestoxValuation, updateArtworkWithNewScorecard };

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
