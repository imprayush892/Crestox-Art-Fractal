
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection as firestoreCollection, query, where, writeBatch, Timestamp, serverTimestamp, updateDoc, arrayUnion, arrayRemove, addDoc, getDocs, runTransaction, Firestore, DocumentReference } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Artist, Fractal, OwnedFractal, ResaleListing, NewArtworkData, EditArtworkFormValues, AIScorecardBreakdown } from '@/lib/data';
import type { EvaluationResult } from '@/ai/flows/evaluate-artwork-flow';
import { artists as mockArtists, fractals as mockFractals } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';

// --- Interfaces ---
export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string | null;
  walletBalance: number;
  watchlist: string[];
}

export interface ArtistProfile extends Artist {
  userId: string;
}

// --- Context Type ---
interface AuthContextType {
  user: User | null;
  artistProfile: ArtistProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  artists: Artist[];
  fractals: Fractal[];
  collection: OwnedFractal[];
  resaleListings: ResaleListing[];
  watchlist: string[];
  login: (email: string, pass: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  collectFromPortfolio: (artist: Artist, quantity: number) => Promise<void>;
  listForResale: (artist: Artist, options: { quantity: number; initialPrice: number; minPrice: number; periodDays: number; }) => Promise<void>;
  cancelListing: (listingId: string) => Promise<void>;
  addToWatchlist: (artistId: string) => Promise<void>;
  removeFromWatchlist: (artistId: string) => Promise<void>;
  createArtistProfile: (profileData: Omit<Artist, 'id' | 'fractalPrice' | 'priceHistory' | 'totalPortfolioValueHistory' | 'totalEditions' | 'availableEditions'>) => Promise<void>;
  updateArtistProfile: (profileData: Partial<ArtistProfile>) => Promise<void>;
  addArtwork: (artworkData: NewArtworkData, evaluationResult: EvaluationResult, finalPrice: number, shouldApplyGrade: boolean) => Promise<void>;
  updateAndReevaluateArtwork: (artworkId: string, artworkData: EditArtworkFormValues, evaluationResult: EvaluationResult, useCrestoxPrice: boolean) => Promise<void>;
  updateArtworkDetails: (artworkId: string, data: EditArtworkFormValues) => Promise<void>;
  reevaluateArtworkForGrading: (fractal: Fractal) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const handleAuthError = (error: any): string => {
  console.error("Authentication/Database Error:", error, "Code:", error.code);
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in.';
    case 'auth/weak-password':
      return 'Password is too weak. It must be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    case 'permission-denied':
        return 'You do not have permission to perform this action. Check Firebase rules.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

export function AuthProvider({ children, initialArtists, initialFractals }: { children: ReactNode, initialArtists: Artist[], initialFractals: Fractal[] }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [fractals, setFractals] = useState<Fractal[]>(initialFractals);
  const [collection, setCollection] = useState<OwnedFractal[]>([]);
  const [resaleListings, setResaleListings] = useState<ResaleListing[]>([]);

  // Stage 1: One-time auth state check and initial profile load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!db) {
          setIsLoading(false);
          return;
        };
        if (firebaseUser) {
            const userRef = doc(db, "users", firebaseUser.uid);
            try {
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    setUser(docSnap.data() as User);
                } else {
                    console.log("User document not found for new login, will be created by login/signup logic.");
                }
            } catch (e) {
                const error = e as Error;
                console.error("Error fetching user document on auth change:", error);
                toast({ variant: 'destructive', title: 'Login Error', description: handleAuthError(error) });
                setUser(null);
            }
        } else {
            setUser(null);
            setArtistProfile(null);
        }
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  // Stage 2: Real-time listeners for all data, dependent on user state
  useEffect(() => {
      if (!db) return;
      const artistsUnsub = onSnapshot(firestoreCollection(db, "artists"), (snapshot) => {
          const liveArtists = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Artist[];
          const liveArtistIds = new Set(liveArtists.map(a => a.id));
          const uniqueMockArtists = mockArtists.filter(a => !liveArtistIds.has(a.id));
          setArtists([...liveArtists, ...uniqueMockArtists]);
      }, (error) => {
          console.error("Error fetching artists, using mock data.", error);
          setArtists(mockArtists);
      });

      const fractalsUnsub = onSnapshot(firestoreCollection(db, "fractals"), (snapshot) => {
          const liveFractals = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Fractal[];
          const liveFractalIds = new Set(liveFractals.map(f => f.id));
          const uniqueMockFractals = mockFractals.filter(f => !liveFractalIds.has(f.id));
          setFractals([...liveFractals, ...uniqueMockFractals]);
      }, (error) => {
          console.error("Error fetching fractals, using mock data.", error);
          setFractals(mockFractals);
      });

      const resaleUnsub = onSnapshot(firestoreCollection(db, "resaleListings"), (snapshot) => {
          const fetchedListings = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as ResaleListing[];
          setResaleListings(fetchedListings);
      });
      
      let artistUnsub = () => {};
      let holdingsUnsub = () => {};
      let userUnsub = () => {};

      if (user?.uid) {
          const userRef = doc(db, 'users', user.uid);
          userUnsub = onSnapshot(userRef, (docSnap) => {
              if (docSnap.exists()){
                  setUser(docSnap.data() as User);
              }
          });

          const artistQuery = query(firestoreCollection(db, 'artists'), where('userId', '==', user.uid));
          artistUnsub = onSnapshot(artistQuery, (snapshot) => {
              if (!snapshot.empty) {
                  setArtistProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ArtistProfile);
              } else {
                  setArtistProfile(null);
              }
          });
          
          const holdingsRef = firestoreCollection(db, 'users', user.uid, 'holdings');
          holdingsUnsub = onSnapshot(holdingsRef, (snapshot) => {
              const userHoldings = snapshot.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id })) as OwnedFractal[];
              setCollection(userHoldings);
          });
      } else {
          setArtistProfile(null);
          setCollection([]);
      }

      return () => {
          artistsUnsub();
          fractalsUnsub();
          resaleUnsub();
          artistUnsub();
          holdingsUnsub();
          userUnsub();
      };
  }, [user?.uid]);

  const signup = async (firstName: string, lastName: string, email: string, pass: string) => {
    if (!db) throw new Error("Database not available.");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser = userCredential.user;
      const profileData: User = { uid: newUser.uid, firstName, lastName, email: newUser.email, walletBalance: 50000, watchlist: [] };
      await setDoc(doc(db, "users", newUser.uid), profileData);
      setUser(profileData);
      toast({ title: "Account Created!", description: "Welcome to Crestox. You've been credited with 50,000 CreCoins." });
    } catch (error) { throw new Error(handleAuthError(error)); }
  };

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) { 
        toast({ variant: 'destructive', title: 'Login Failed', description: handleAuthError(error)});
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setArtistProfile(null);
    setCollection([]);
  };

  const createArtistProfile = async (profileData: Omit<Artist, 'id' | 'fractalPrice' | 'priceHistory' | 'totalPortfolioValueHistory' | 'totalEditions' | 'availableEditions'>) => {
    if (!db || !user) throw new Error("User not authenticated or database not available.");
    const artistRef = doc(db, 'artists', user.uid);
    const newArtist: Artist = {
        ...profileData,
        id: user.uid,
        userId: user.uid,
        fractalPrice: 0,
        priceHistory: [],
        totalPortfolioValueHistory: [],
        totalEditions: 0,
        availableEditions: 0,
    };
    try {
        await setDoc(artistRef, newArtist);
        setArtistProfile({ ...newArtist, userId: user.uid });
    } catch (error) { throw new Error(handleAuthError(error)); }
  };
  
  const updateArtistProfile = async (profileData: Partial<ArtistProfile>) => {
      if (!db || !artistProfile) throw new Error("Artist profile not found or database not available.");
      const artistRef = doc(db, "artists", artistProfile.id);
      try {
          await updateDoc(artistRef, profileData);
      } catch (error) { throw new Error(handleAuthError(error)); }
  };

  const addArtwork = async (artworkData: NewArtworkData, evaluationResult: EvaluationResult, finalPrice: number, shouldApplyGrade: boolean) => {
    if (!db || !artistProfile) throw new Error("Artist profile not found or database not available.");
    
    await runTransaction(db, async (transaction) => {
        const artistRef = doc(db, "artists", artistProfile.id);
        const artistSnap = await transaction.get(artistRef);
        if (!artistSnap.exists()) {
            throw new Error("Artist profile not found in database.");
        }
        
        const currentArtistData = artistSnap.data() as Artist;
        const newFractalRef = doc(firestoreCollection(db, 'fractals'));
        
        const width = 600;
        const height = 400;

        // Generate placeholder URLs instead of storing large data URIs
        const placeholderImages = artworkData.images.map(() => `https://placehold.co/${width}x${height}.png`);
        const heroPlaceholder = placeholderImages[artworkData.heroImage ? placeholderImages.indexOf(artworkData.heroImage) : 0];

        const newFractal: Fractal = {
            id: newFractalRef.id,
            artistId: artistProfile.id,
            title: artworkData.title,
            description: artworkData.description,
            materials: artworkData.materials,
            artworkSize: artworkData.artworkSize,
            subjectSignificance: artworkData.subjectSignificance,
            personalSignificance: artworkData.personalSignificance,
            timeEffort: artworkData.timeEffort,
            biographicalContext: artworkData.biographicalContext,
            commissionPatronage: artworkData.commissionPatronage,
            
            images: placeholderImages,
            heroImage: heroPlaceholder,

            price: finalPrice,
            priceHistory: [{ date: new Date().toISOString(), price: finalPrice }],
            aiScore: evaluationResult.finalScore,
            aiScorecard: evaluationResult.breakdown,
            crestoxGrade: shouldApplyGrade ? evaluationResult.grade : undefined,
            crestoxPriceRange: evaluationResult.crestoxPriceRange,
            artistMinEstimate: artworkData.minEstimatedValue,
            artistMaxEstimate: artworkData.maxEstimatedValue,
            width,
            height,
            aiHint: 'abstract fractal',
        };
        
        transaction.set(newFractalRef, newFractal);

        const currentTotalValue = currentArtistData.totalPortfolioValueHistory?.slice(-1)[0]?.value ?? 0;
        const newTotalValue = currentTotalValue + finalPrice;
        const newTotalEditions = currentArtistData.totalEditions + artworkData.editionsToIssue;
        const newFractalPrice = newTotalEditions > 0 ? newTotalValue / newTotalEditions : 0;
        
        transaction.update(artistRef, {
            totalEditions: newTotalEditions,
            availableEditions: currentArtistData.availableEditions + artworkData.editionsToIssue,
            fractalPrice: newFractalPrice,
            priceHistory: arrayUnion({ date: new Date().toISOString(), price: newFractalPrice }),
            totalPortfolioValueHistory: arrayUnion({ date: new Date().toISOString(), value: newTotalValue })
        });
    }).catch(error => {
      console.error("Add artwork transaction failed: ", error);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: handleAuthError(error),
      });
      throw error; // Re-throw to be caught by the calling function
    });
  };

  const updateAndReevaluateArtwork = async (artworkId: string, artworkData: EditArtworkFormValues, evaluationResult: EvaluationResult, useCrestoxPrice: boolean) => {
     if (!db || !artistProfile) throw new Error("Artist profile not found or database not available.");
      
      const crestoxPrice = Math.round((evaluationResult.crestoxPriceRange[0] + evaluationResult.crestoxPriceRange[1]) / 2);
      const artistPrice = Math.round(((artworkData.minEstimatedValue || 0) + (artworkData.maxEstimatedValue || 0)) / 2);
      const finalPrice = useCrestoxPrice ? crestoxPrice : artistPrice;
      const shouldApplyGrade = useCrestoxPrice || artistPrice <= crestoxPrice;

      await runTransaction(db, async (transaction) => {
          const artistRef = doc(db, "artists", artistProfile.id);
          const fractalRef = doc(db, "fractals", artworkId);
          const [artistSnap, fractalSnap] = await Promise.all([transaction.get(artistRef), transaction.get(fractalRef)]);
          
          if (!artistSnap.exists() || !fractalSnap.exists()) throw new Error("Artist or Fractal not found.");
          
          const oldFractalPrice = fractalSnap.data().price;
          
          transaction.update(fractalRef, {
              ...artworkData,
              price: finalPrice,
              priceHistory: arrayUnion({ date: new Date().toISOString(), price: finalPrice }),
              aiScore: evaluationResult.finalScore,
              aiScorecard: evaluationResult.breakdown,
              crestoxGrade: shouldApplyGrade ? evaluationResult.grade : fractalSnap.data().crestoxGrade,
          });

          const currentArtistData = artistSnap.data() as Artist;
          const currentTotalValue = (currentArtistData.totalPortfolioValueHistory?.slice(-1)[0]?.value ?? 0);

          const newTotalValue = currentTotalValue - oldFractalPrice + finalPrice;
          const newTotalEditions = currentArtistData.totalEditions + (artworkData.editionsToIssue || 0);
          const newFractalPrice = newTotalEditions > 0 ? newTotalValue / newTotalEditions : 0;
          
          transaction.update(artistRef, {
              totalEditions: newTotalEditions,
              availableEditions: currentArtistData.availableEditions + (artworkData.editionsToIssue || 0),
              fractalPrice: newFractalPrice,
              priceHistory: arrayUnion({ date: new Date().toISOString(), price: newFractalPrice }),
              totalPortfolioValueHistory: arrayUnion({ date: new Date().toISOString(), value: newTotalValue })
          });
      });
  };

  const reevaluateArtworkForGrading = async (fractal: Fractal) => {
    if (!db) throw new Error("Database not available.");
    if (!fractal.crestoxPriceRange) throw new Error("Missing data for re-evaluation.");
    const newPrice = Math.round((fractal.crestoxPriceRange[0] + fractal.crestoxPriceRange[1]) / 2);
    
    await runTransaction(db, async (transaction) => {
        const fractalRef = doc(db, "fractals", fractal.id);
        transaction.update(fractalRef, { price: newPrice });
    });
  };

  const updateArtworkDetails = async (artworkId: string, data: EditArtworkFormValues) => {
      if (!db) throw new Error("Database not available.");
      const fractalRef = doc(db, "fractals", artworkId);
      try {
        await updateDoc(fractalRef, data as any);
        toast({ title: "Update Successful", description: "Artwork details have been saved." });
      } catch (error) { throw new Error(handleAuthError(error)); }
  };
  
  const collectFromPortfolio = async (artist: Artist, quantity: number) => {
    if (!db || !user) throw new Error("User not authenticated or database not available.");
    
    await runTransaction(db, async (transaction) => {
        const artistRef = doc(db, "artists", artist.id);
        const userRef = doc(db, "users", user.uid);
        const artistSnap = await transaction.get(artistRef);
        const userSnap = await transaction.get(userRef);

        if (!artistSnap.exists() || !userSnap.exists()) throw new Error("Artist or user not found.");
        
        const artistData = artistSnap.data() as Artist;
        const userData = userSnap.data() as User;
        
        if (artistData.availableEditions < quantity) throw new Error("Not enough fractals available.");
        
        const totalCost = artistData.fractalPrice * quantity;
        if (userData.walletBalance < totalCost) throw new Error("Insufficient funds.");
        
        transaction.update(artistRef, { availableEditions: artistData.availableEditions - quantity });
        transaction.update(userRef, { walletBalance: userData.walletBalance - totalCost });
        
        for (let i = 0; i < quantity; i++) {
            const holdingRef = doc(firestoreCollection(db, `users/${user.uid}/holdings`));
            const newHolding: OwnedFractal = {
                id: holdingRef.id,
                fractalId: "portfolio-fractal",
                artistId: artist.id,
                purchaseDate: new Date().toISOString(),
                purchasePrice: artistData.fractalPrice,
                serialNumber: uuidv4(),
                status: 'owned',
            };
            transaction.set(holdingRef, newHolding);
        }
    });
    toast({ title: "Collection Successful!", description: `You have collected ${quantity} fractal(s) from ${artist.name}.` });
  };
  
  const listForResale = async (artist: Artist, options: { quantity: number; initialPrice: number; minPrice: number; periodDays: number; }) => {
      if (!db || !user) throw new Error("User not authenticated or database not available.");
      
      const { quantity, initialPrice, minPrice, periodDays } = options;
      
      await runTransaction(db, async (transaction) => {
          const holdingsQuery = query(
              firestoreCollection(db, `users/${user.uid}/holdings`),
              where("artistId", "==", artist.id),
              where("status", "==", "owned")
          );
          const holdingsSnap = await getDocs(holdingsQuery);
          
          if (holdingsSnap.docs.length < quantity) throw new Error("Not enough fractals to list.");
          
          const holdingsToUpdate = holdingsSnap.docs.slice(0, quantity);
          for (const docSnap of holdingsToUpdate) {
              transaction.update(docSnap.ref, { status: "listed" });
          }
          
          const listingRef = doc(firestoreCollection(db, 'resaleListings'));
          const newListing: ResaleListing = {
              id: listingRef.id,
              artistId: artist.id,
              resellerId: user.uid,
              quantity,
              initialPrice,
              minPrice,
              periodSeconds: periodDays * 24 * 60 * 60,
              listingTimestamp: new Date().toISOString(),
              status: 'active',
          };
          transaction.set(listingRef, newListing);
      });
      toast({ title: "Listing Successful!", description: `You have listed ${quantity} fractal(s) for sale.` });
  };
  
  const cancelListing = async (listingId: string) => {
      if (!db || !user) throw new Error("User not authenticated or database not available.");
      
      await runTransaction(db, async (transaction) => {
          const listingRef = doc(db, "resaleListings", listingId);
          const listingSnap = await transaction.get(listingRef);
          if (!listingSnap.exists() || listingSnap.data().resellerId !== user.uid) throw new Error("Listing not found or you do not own it.");
          
          const { quantity, artistId } = listingSnap.data();
          
          const holdingsQuery = query(
              firestoreCollection(db, `users/${user.uid}/holdings`),
              where("artistId", "==", artistId),
              where("status", "==", "listed")
          );
          const holdingsSnap = await getDocs(holdingsQuery);
          const holdingsToUpdate = holdingsSnap.docs.slice(0, quantity);

          if (holdingsToUpdate.length < quantity) throw new Error("Cannot find enough listed fractals to cancel.");
          
          for (const docSnap of holdingsToUpdate) {
              transaction.update(docSnap.ref, { status: "owned" });
          }
          
          transaction.update(listingRef, { status: "cancelled" });
      });
      toast({ title: "Listing Cancelled", description: "Your fractals have been returned to your holdings." });
  };

  const addToWatchlist = async (artistId: string) => {
    if (!db || !user) {
        toast({ variant: "destructive", title: "You must be logged in." });
        return;
    }
    try {
        await updateDoc(doc(db, "users", user.uid), { watchlist: arrayUnion(artistId) });
        toast({ title: "Added to Watchlist" });
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to update watchlist." });
    }
  };

  const removeFromWatchlist = async (artistId: string) => {
    if (!db || !user) {
        toast({ variant: "destructive", title: "You must be logged in." });
        return;
    }
    try {
       await updateDoc(doc(db, "users", user.uid), { watchlist: arrayRemove(artistId) });
       toast({ title: "Removed from Watchlist" });
    } catch (error) {
       toast({ variant: "destructive", title: "Failed to update watchlist." });
    }
  };

  const contextValue: AuthContextType = {
    user,
    artistProfile,
    isLoggedIn: !!user,
    isLoading,
    artists,
    fractals,
    collection,
    resaleListings,
    watchlist: user?.watchlist ?? [],
    login,
    signup,
    logout,
    collectFromPortfolio,
    listForResale,
    cancelListing,
    addToWatchlist,
    removeFromWatchlist,
    createArtistProfile,
    updateArtistProfile,
    addArtwork,
    updateAndReevaluateArtwork,
    updateArtworkDetails,
    reevaluateArtworkForGrading,
  };
  
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
