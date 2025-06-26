
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection as firestoreCollection, query, where, writeBatch, Timestamp, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Artist, Fractal, OwnedFractal, ResaleListing, NewArtworkData, EditArtworkFormValues } from '@/lib/data';
import type { EvaluationResult } from '@/ai/flows/evaluate-artwork-flow';
import { artists as mockArtists, fractals as mockFractals } from '@/lib/data';
import { Loader2 } from 'lucide-react';
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
  updateArtworkDetails: (artworkId: string, data: EditArtworkFormValues) => Promise<void>;
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

const handleAuthError = (error: any): string => {
  console.error("Authentication Error:", error, "Code:", error.code);
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
        return 'You do not have permission to perform this action. Check Firestore rules.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

export function AuthProvider({ children, initialArtists, initialFractals }: AuthProviderProps) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [fractals, setFractals] = useState<Fractal[]>(initialFractals);
  const [collection, setCollection] = useState<OwnedFractal[]>([]);
  const [resaleListings, setResaleListings] = useState<ResaleListing[]>([]);

  // Real-time listeners for public data
  useEffect(() => {
    if (!db) {
        console.log("Firebase not configured. Using mock data for artists and fractals.");
        setArtists(mockArtists);
        setFractals(mockFractals);
        return;
    }

    const artistsUnsub = onSnapshot(firestoreCollection(db, "artists"), (snapshot) => {
        const fetchedArtists = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Artist[];
        setArtists(fetchedArtists.length > 0 ? fetchedArtists : mockArtists);
    }, (error) => {
        console.error("Error fetching artists, using mock data.", error);
        setArtists(mockArtists);
    });

    const fractalsUnsub = onSnapshot(firestoreCollection(db, "fractals"), (snapshot) => {
        const fetchedFractals = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Fractal[];
        setFractals(fetchedFractals.length > 0 ? fetchedFractals : mockFractals);
    }, (error) => {
        console.error("Error fetching fractals, using mock data.", error);
        setFractals(mockFractals);
    });

    const resaleUnsub = onSnapshot(firestoreCollection(db, "resaleListings"), (snapshot) => {
        const fetchedListings = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as ResaleListing[];
        setResaleListings(fetchedListings);
    });
    
    return () => {
        artistsUnsub();
        fractalsUnsub();
        resaleUnsub();
    };
  }, []);

  // One-time auth state check and profile loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userRef = doc(db!, "users", firebaseUser.uid);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                setUser(docSnap.data() as User);
            } else {
                // This case handles users who signed up but profile creation failed,
                // or for auto-creating a profile on first login.
                const newProfileData: User = {
                    uid: firebaseUser.uid,
                    firstName: firebaseUser.displayName?.split(' ')[0] || "New",
                    lastName: firebaseUser.displayName?.split(' ')[1] || "User",
                    email: firebaseUser.email,
                    walletBalance: 50000,
                    watchlist: [],
                };
                await setDoc(userRef, newProfileData);
                setUser(newProfileData);
            }
        } else {
            setUser(null);
            setArtistProfile(null);
        }
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listeners for logged-in user data
  useEffect(() => {
      if (!user?.uid) {
          setArtistProfile(null);
          setCollection([]);
          return;
      };

      // Artist Profile Listener
      const artistQuery = query(firestoreCollection(db!, 'artists'), where('userId', '==', user.uid));
      const artistUnsub = onSnapshot(artistQuery, (snapshot) => {
          if (!snapshot.empty) {
              setArtistProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ArtistProfile);
          } else {
              setArtistProfile(null);
          }
      });
      
      // Holdings Listener
      const holdingsRef = firestoreCollection(db!, 'users', user.uid, 'holdings');
      const holdingsUnsub = onSnapshot(holdingsRef, (snapshot) => {
          const userHoldings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as OwnedFractal[];
          setCollection(userHoldings);
      });

      return () => {
          artistUnsub();
          holdingsUnsub();
      }
  }, [user?.uid]);

  const signup = async (firstName: string, lastName: string, email: string, pass: string) => {
    if (!db) throw new Error("Database not configured.");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser = userCredential.user;

      const profileData: User = {
        uid: newUser.uid,
        firstName,
        lastName,
        email: newUser.email,
        walletBalance: 50000,
        watchlist: [],
      };

      await setDoc(doc(db, "users", newUser.uid), profileData);
      
      // Don't call setUser here, onAuthStateChanged will handle it.
      
      toast({
        title: "Account Created!",
        description: "Welcome to Crestox. You've been credited with 50,000 CreCoins.",
      });
    } catch (error: any) {
      throw new Error(handleAuthError(error));
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle the rest.
    } catch (error: any) {
      throw new Error(handleAuthError(error));
    }
  };

  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged will set user and profile to null.
  };
  
  // --- Placeholder Functions ---
  const placeholderPromise = () => Promise.reject(new Error("Functionality not implemented."));
  const placeholderAction = () => { toast({ variant: 'destructive', title: 'Not Implemented' }) };

  const value: AuthContextType = {
    isLoggedIn: !!user,
    user,
    artistProfile,
    isLoading,
    artists,
    fractals,
    collection,
    resaleListings,
    login,
    signup,
    logout,
    // Placeholders
    collectFromPortfolio: placeholderPromise,
    listForResale: placeholderPromise,
    cancelListing: placeholderPromise,
    addToWatchlist: placeholderPromise,
    removeFromWatchlist: placeholderPromise,
    createArtistProfile: placeholderPromise,
    updateArtistProfile: placeholderPromise,
    addArtwork: placeholderPromise,
    updateArtworkDetails: placeholderPromise,
    updateAndReevaluateArtwork: placeholderPromise,
    reevaluateArtworkForGrading: placeholderPromise,
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
