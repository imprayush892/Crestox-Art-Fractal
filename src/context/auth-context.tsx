
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection as firestoreCollection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Artist, Fractal, OwnedFractal, ResaleListing, EvaluationResult, NewArtworkData, EditArtworkFormValues } from '@/lib/data';
import { artists as mockArtists, fractals as mockFractals } from '@/lib/data';
import { Loader2 } from 'lucide-react';

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
  // Placeholder functions from original context
  collectFromPortfolio: (artist: Artist, quantity: number) => Promise<void>;
  listForResale: (artist: Artist, options: { quantity: number; initialPrice: number; minPrice: number; periodDays: number; }) => Promise<void>;
  cancelListing: (listingId: string) => Promise<void>;
  addToWatchlist: (artistId: string) => void;
  removeFromWatchlist: (artistId: string) => void;
  createArtistProfile: (profileData: any) => Promise<void>;
  updateArtistProfile: (profileData: Partial<ArtistProfile>) => Promise<void>;
  addArtwork: (artworkData: NewArtworkData, evaluationResult: EvaluationResult, finalPrice: number, shouldApplyGrade: boolean) => Promise<void>;
  updateArtworkDetails: (artworkId: string, data: Partial<Fractal>) => Promise<void>;
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

  useEffect(() => {
    if (!db) {
        setArtists(mockArtists);
        setFractals(mockFractals);
        setIsLoading(false);
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
    
    return () => {
        artistsUnsub();
        fractalsUnsub();
    };
  }, []);

  useEffect(() => {
    let userProfileUnsubscribe: (() => void) | undefined;
    let artistProfileUnsubscribe: (() => void) | undefined;
    
    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Clean up previous user's listeners
      if (userProfileUnsubscribe) userProfileUnsubscribe();
      if (artistProfileUnsubscribe) artistProfileUnsubscribe();

      if (firebaseUser) {
        const userRef = doc(db!, "users", firebaseUser.uid);
        
        userProfileUnsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setUser(docSnap.data() as User);
            }
        });
        
        const artistQuery = query(firestoreCollection(db!, 'artists'), where('userId', '==', firebaseUser.uid));
        artistProfileUnsubscribe = onSnapshot(artistQuery, (snapshot) => {
           if (!snapshot.empty) {
               setArtistProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ArtistProfile);
           } else {
               setArtistProfile(null);
           }
        });

      } else {
        setUser(null);
        setArtistProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      authUnsubscribe();
      if (userProfileUnsubscribe) userProfileUnsubscribe();
      if (artistProfileUnsubscribe) artistProfileUnsubscribe();
    };
  }, []);


  const signup = async (firstName: string, lastName: string, email: string, pass: string) => {
    if (!db) throw new Error("Database not configured.");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser = userCredential.user;

      const profileData = {
        uid: newUser.uid,
        firstName,
        lastName,
        email: newUser.email,
        walletBalance: 50000,
        watchlist: [],
      };

      await setDoc(doc(db, "users", newUser.uid), profileData);
      setUser(profileData);
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
    } catch (error: any) {
      throw new Error(handleAuthError(error));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setArtistProfile(null);
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
    addToWatchlist: placeholderAction,
    removeFromWatchlist: placeholderAction,
    createArtistProfile: placeholderPromise,
    updateArtistProfile: placeholderPromise,
    addArtwork: placeholderPromise,
    updateArtworkDetails: placeholderPromise,
    updateAndReevaluateArtwork: placeholderPromise,
    reevaluateArtworkForGrading: placeholderPromise,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
          <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
              <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading Crestox...</p>
              </div>
          </div>
      ) : children}
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
