
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection as firestoreCollection, query, where, writeBatch, Timestamp, serverTimestamp, updateDoc, arrayUnion, arrayRemove, addDoc, getDocs, runTransaction, Firestore, DocumentReference, DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Artist, Fractal, OwnedFractal, ResaleListing, EditArtworkFormValues, AIScorecardBreakdown, ArtworkFormValues, CreateArtistProfileData, OrderBreakdownItem } from '@/lib/data';
import type { EvaluationResult } from '@/ai/flows/evaluate-artwork-flow';
import type { SuccessfulEvaluationSchema } from '@/ai/flows/evaluate-artwork-flow';
import { artists as mockArtists, fractals as mockFractals } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';

type SuccessfulEvaluation = z.infer<typeof SuccessfulEvaluationSchema>['evaluation'];

// --- Interfaces ---
export interface User {
  uid: string;
  firstName: string;
  lastName:string;
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
  executeFractalPurchase: (artistId: string, orderBreakdown: OrderBreakdownItem[], totalCost: number) => Promise<void>;
  listForResale: (artist: Artist, options: { quantity: number; initialPrice: number; minPrice: number; periodDays: number; }) => Promise<void>;
  cancelListing: (listingId: string) => Promise<void>;
  addToWatchlist: (artistId: string) => Promise<void>;
  removeFromWatchlist: (artistId: string) => Promise<void>;
  createArtistProfile: (profileData: CreateArtistProfileData) => Promise<void>;
  updateArtistProfile: (profileData: Partial<CreateArtistProfileData>) => Promise<void>;
  addArtwork: (artworkData: ArtworkFormValues, evaluationResult: SuccessfulEvaluation, finalPrice: number, shouldApplyGrade: boolean) => Promise<void>;
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
    case 'storage/unauthorized':
        return 'You do not have permission to upload files. Check storage rules.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

const sanitizeArtist = (artist: Artist): Artist => ({
  ...artist,
  totalEditions: Number(artist.totalEditions || 0),
  availableEditions: Number(artist.availableEditions || 0),
});

export function AuthProvider({ children, initialArtists, initialFractals }: { children: ReactNode, initialArtists: Artist[], initialFractals: Fractal[] }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [artists, setArtists] = useState<Artist[]>(initialArtists.map(sanitizeArtist));
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
          setArtists([...liveArtists, ...uniqueMockArtists].map(sanitizeArtist));
      }, (error) => {
          console.error("Error fetching artists, using mock data.", error);
          setArtists(mockArtists.map(sanitizeArtist));
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

  const createArtistProfile = async (profileData: CreateArtistProfileData) => {
    if (!db || !user) throw new Error("User not authenticated or database not available.");
    
    const { avatar: avatarData, ...restOfProfileData } = profileData;
    let avatarUrl = '';
    
    if (avatarData) {
        if (avatarData instanceof File) {
            try {
                const avatarRef = ref(storage, `avatars/${user.uid}/${avatarData.name}`);
                await uploadBytes(avatarRef, avatarData);
                avatarUrl = await getDownloadURL(avatarRef);
            } catch (error) {
                throw new Error(handleAuthError(error));
            }
        } else if (typeof avatarData === 'string' && avatarData.startsWith('data:image')) {
            try {
                const avatarRef = ref(storage, `avatars/${user.uid}/profile.jpg`);
                await uploadString(avatarRef, avatarData, 'data_url');
                avatarUrl = await getDownloadURL(avatarRef);
            } catch (error) {
                throw new Error(handleAuthError(error));
            }
        }
    }
    
    const artistRef = doc(firestoreCollection(db, 'artists'));
    const newArtistData: Artist = {
        ...restOfProfileData,
        id: artistRef.id,
        userId: user.uid,
        avatar: avatarUrl,
        fractalPrice: 0,
        priceHistory: [],
        totalPortfolioValueHistory: [],
        totalEditions: 0,
        availableEditions: 0,
    };
    try {
        await setDoc(artistRef, newArtistData);
        setArtistProfile({ ...newArtistData, id: artistRef.id, userId: user.uid });
    } catch (error) { throw new Error(handleAuthError(error)); }
  };
  
  const updateArtistProfile = async (profileData: Partial<CreateArtistProfileData>) => {
      if (!db || !artistProfile) throw new Error("Artist profile not found or database not available.");
      
      const { avatar, ...restOfProfileData } = profileData;
      const dataToUpdate: { [key: string]: any } = {
        ...restOfProfileData,
      };

      if (profileData.awards) {
        dataToUpdate.awards = profileData.awards;
      }
      if (profileData.exhibitions) {
        dataToUpdate.exhibitions = profileData.exhibitions;
      }

      if (avatar && avatar instanceof File) {
          try {
              const avatarRef = ref(storage, `avatars/${artistProfile.id}/${avatar.name}`);
              await uploadBytes(avatarRef, avatar);
              dataToUpdate.avatar = await getDownloadURL(avatarRef);
          } catch (error) {
              throw new Error(handleAuthError(error));
          }
      } else if (typeof avatar === 'string' && avatar.startsWith('data:image')) {
         try {
            const avatarRef = ref(storage, `avatars/${artistProfile.id}/profile.jpg`);
            await uploadString(avatarRef, avatar, 'data_url');
            dataToUpdate.avatar = await getDownloadURL(avatarRef);
        } catch (error) {
            throw new Error(handleAuthError(error));
        }
      }
      
      const artistRef = doc(db, "artists", artistProfile.id);
      try {
          await updateDoc(artistRef, dataToUpdate);
          toast({title: "Profile Updated", description: "Your changes have been saved."});
      } catch (error) { throw new Error(handleAuthError(error)); }
  };

  const addArtwork = async (artworkData: ArtworkFormValues, evaluationResult: SuccessfulEvaluation, finalPrice: number, shouldApplyGrade: boolean) => {
    if (!db || !user || !artistProfile) throw new Error("User or artist profile not authenticated.");
    
    const newFractalId = doc(firestoreCollection(db, 'fractals')).id;

    const imageUrls = await Promise.all(
        artworkData.images.map(async (file: File) => {
            const storageRef = ref(storage, `artworks/${user.uid}/${newFractalId}/${uuidv4()}_${file.name}`);
            await uploadBytes(storageRef, file);
            return getDownloadURL(storageRef);
        })
    );

    const heroImageUrl = imageUrls[artworkData.heroImageIndex > -1 ? artworkData.heroImageIndex : 0];

    await runTransaction(db, async (transaction) => {
        const artistRef = doc(db, "artists", artistProfile.id);
        const artistSnap = await transaction.get(artistRef);
        if (!artistSnap.exists()) throw new Error("Artist profile does not exist.");

        const currentArtistData = artistSnap.data() as Artist;

        const { length, breadth, height, unit } = artworkData;
        const artworkSize = { length, breadth, unit, ...(height && { height }) };

        const newFractalData: Omit<Fractal, 'id'> = {
            artistId: artistProfile.id,
            title: artworkData.title,
            description: artworkData.description,
            materials: artworkData.materials,
            artworkSize,
            images: imageUrls,
            heroImage: heroImageUrl,
            price: finalPrice,
            priceHistory: [{ date: new Date().toISOString(), price: finalPrice }],
            artistMinEstimate: artworkData.minEstimatedValue,
            artistMaxEstimate: artworkData.maxEstimatedValue,
            width: 600, 
            height: 400,
            aiHint: 'custom artwork',
            subjectSignificance: artworkData.subjectSignificance || "",
            personalSignificance: artworkData.personalSignificance || "",
            timeEffort: artworkData.timeEffort || "",
            biographicalContext: artworkData.biographicalContext || "",
            commissionPatronage: artworkData.commissionPatronage || "",
            aiScore: evaluationResult.finalScore,
            aiScorecard: evaluationResult.breakdown,
            crestoxGrade: shouldApplyGrade ? evaluationResult.grade : undefined,
            crestoxPriceRange: evaluationResult.crestoxPriceRange,
        };
        
        const currentTotalValue = Number(currentArtistData.totalPortfolioValueHistory?.slice(-1)[0]?.value ?? 0);
        const newTotalValue = currentTotalValue + finalPrice;
        
        const newTotalEditions = Number(currentArtistData.totalEditions || 0) + Number(artworkData.editionsToIssue);
        const newAvailableEditions = Number(currentArtistData.availableEditions || 0) + Number(artworkData.editionsToIssue);
        const newFractalPrice = newTotalEditions > 0 ? newTotalValue / newTotalEditions : 0;

        const newFractalRef = doc(db, "fractals", newFractalId);
        transaction.set(newFractalRef, newFractalData);

        transaction.update(artistRef, {
            totalEditions: newTotalEditions,
            availableEditions: newAvailableEditions,
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
      throw error;
    });
  };

  const updateAndReevaluateArtwork = async (artworkId: string, artworkData: EditArtworkFormValues, evaluationResult: EvaluationResult, useCrestoxPrice: boolean) => {
     if (!db || !artistProfile) throw new Error("Artist profile not found or database not available.");
     
     if (evaluationResult.status === 'manual_review_required') {
        throw new Error("Cannot update artwork that requires manual review.");
     }

      const { evaluation } = evaluationResult;
      
      const crestoxPrice = Math.round((evaluation.crestoxPriceRange[0] + evaluation.crestoxPriceRange[1]) / 2);
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
              aiScore: evaluation.finalScore,
              aiScorecard: evaluation.breakdown,
              crestoxGrade: shouldApplyGrade ? evaluation.grade : fractalSnap.data().crestoxGrade,
          });

          const currentArtistData = artistSnap.data() as Artist;
          const currentTotalValue = Number(currentArtistData.totalPortfolioValueHistory?.slice(-1)[0]?.value ?? 0);

          const newTotalValue = currentTotalValue - oldFractalPrice + finalPrice;
          
          const newTotalEditions = Number(currentArtistData.totalEditions || 0) + Number(artworkData.editionsToIssue || 0);
          const newAvailableEditions = Number(currentArtistData.availableEditions || 0) + Number(artworkData.editionsToIssue || 0);
          const newFractalPrice = newTotalEditions > 0 ? newTotalValue / newTotalEditions : 0;
          
          transaction.update(artistRef, {
              totalEditions: newTotalEditions,
              availableEditions: newAvailableEditions,
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
  
  const executeFractalPurchase = async (artistId: string, orderBreakdown: OrderBreakdownItem[], totalCost: number) => {
    if (!db || !user) throw new Error("User not authenticated.");

    if (user.walletBalance < totalCost) {
        throw new Error("Insufficient CreCoin balance.");
    }

    await runTransaction(db, async (transaction) => {
        // --- PHASE 1: READ ALL TOP-LEVEL DOCUMENTS ---
        const docRefs = new Map<string, DocumentReference>();
        docRefs.set('buyer', doc(db, "users", user.uid));

        for (const item of orderBreakdown) {
            if (item.source === 'ARTIST') {
                if (!docRefs.has(`artist_${artistId}`)) {
                    docRefs.set(`artist_${artistId}`, doc(db, "artists", artistId));
                }
            } else if (item.source === 'RESELLER' && item.resellerId && item.listingId) {
                if (!docRefs.has(`seller_${item.resellerId}`)) {
                    docRefs.set(`seller_${item.resellerId}`, doc(db, "users", item.resellerId));
                }
                if (!docRefs.has(`listing_${item.listingId}`)) {
                    docRefs.set(`listing_${item.listingId}`, doc(db, "resaleListings", item.listingId));
                }
            }
        }
        
        const docSnaps = new Map<string, DocumentSnapshot>();
        const readPromises: Promise<DocumentSnapshot>[] = [];
        for (const ref of docRefs.values()) {
            readPromises.push(transaction.get(ref));
        }
        const snapshots = await Promise.all(readPromises);
        
        let i = 0;
        for (const key of docRefs.keys()) {
            docSnaps.set(key, snapshots[i++]);
        }
        
        // --- PHASE 2: VALIDATE AND READ HOLDING DOCUMENTS ---
        const buyerSnap = docSnaps.get('buyer');
        if (!buyerSnap?.exists() || (buyerSnap.data() as User).walletBalance < totalCost) {
            throw new Error("Insufficient funds or user not found.");
        }

        const holdingRefsToRead: DocumentReference[] = [];
        const listingIdToHoldingIds = new Map<string, string[]>();

        for (const item of orderBreakdown) {
            if (item.source === 'RESELLER' && item.resellerId && item.listingId) {
                const listingSnap = docSnaps.get(`listing_${item.listingId}`);
                if (!listingSnap?.exists()) throw new Error(`Listing ${item.listingId} not found.`);
                
                const listingData = listingSnap.data() as ResaleListing;
                if (listingData.status !== 'active' || listingData.quantity < item.quantity) {
                    throw new Error(`Listing for ${artistId} is not active or has insufficient quantity.`);
                }
                if (!listingData.holdingIds || !Array.isArray(listingData.holdingIds) || listingData.holdingIds.length < item.quantity) {
                    throw new Error(`Listing ${listingData.id} has insufficient holdings for this sale.`);
                }

                const holdingsToTransfer = listingData.holdingIds.slice(0, item.quantity);
                listingIdToHoldingIds.set(listingData.id, holdingsToTransfer);

                for (const holdingId of holdingsToTransfer) {
                    holdingRefsToRead.push(doc(db, `users/${item.resellerId}/holdings/${holdingId}`));
                }
            }
        }
        
        // Read all required holding documents
        const holdingDocSnapsToProcess: DocumentSnapshot[] = [];
        if (holdingRefsToRead.length > 0) {
            const holdingSnaps = await Promise.all(holdingRefsToRead.map(ref => transaction.get(ref)));
            for(const snap of holdingSnaps) {
                if (!snap.exists()) {
                    throw new Error(`A holding document (${snap.ref.path}) required for the sale does not exist.`);
                }
                holdingDocSnapsToProcess.push(snap);
            }
        }


        // --- PHASE 3: PREPARE AND EXECUTE WRITES ---
        transaction.update(docRefs.get('buyer')!, { walletBalance: (buyerSnap.data() as User).walletBalance - totalCost });
        
        const holdingsToCreate: Omit<OwnedFractal, 'id'>[] = [];

        for (const item of orderBreakdown) {
            if (item.source === 'ARTIST') {
                const artistRef = docRefs.get(`artist_${artistId}`)!;
                const artistData = docSnaps.get(`artist_${artistId}`)!.data() as Artist;
                if (artistData.availableEditions < item.quantity) {
                    throw new Error("Not enough fractals available from artist.");
                }
                transaction.update(artistRef, { availableEditions: artistData.availableEditions - item.quantity });
                for (let j = 0; j < item.quantity; j++) {
                    holdingsToCreate.push({
                        fractalId: "portfolio-fractal", artistId, purchaseDate: new Date().toISOString(),
                        purchasePrice: item.price, serialNumber: uuidv4(), status: 'owned',
                    });
                }
            } else if (item.source === 'RESELLER' && item.resellerId && item.listingId) {
                const sellerRef = docRefs.get(`seller_${item.resellerId}`)!;
                const sellerData = docSnaps.get(`seller_${item.resellerId}`)!.data() as User;
                transaction.update(sellerRef, { walletBalance: sellerData.walletBalance + (item.quantity * item.price) });
                
                const listingRef = docRefs.get(`listing_${item.listingId}`)!;
                const listingData = docSnaps.get(`listing_${item.listingId}`)!.data() as ResaleListing;
                
                const newQuantity = listingData.quantity - item.quantity;
                transaction.update(listingRef, {
                    quantity: newQuantity,
                    holdingIds: listingData.holdingIds.slice(item.quantity),
                    status: newQuantity === 0 ? 'completed' : 'active',
                });

                const holdingsForListing = listingIdToHoldingIds.get(item.listingId)!;
                for (const holdingId of holdingsForListing) {
                    transaction.delete(doc(db, `users/${item.resellerId}/holdings/${holdingId}`));
                    holdingsToCreate.push({
                         fractalId: "portfolio-fractal", artistId: listingData.artistId, purchaseDate: new Date().toISOString(),
                         purchasePrice: item.price, serialNumber: `resale-${uuidv4()}`, status: 'owned',
                    });
                }
            }
        }
                
        holdingsToCreate.forEach(holding => {
            const newHoldingRef = doc(firestoreCollection(db, `users/${user.uid}/holdings`));
            transaction.set(newHoldingRef, { ...holding, id: newHoldingRef.id });
        });
    });
    toast({ title: "Collection Successful!", description: `You have collected ${orderBreakdown.reduce((sum, item) => sum + item.quantity, 0)} fractal(s).` });
  };

  const listForResale = async (artist: Artist, options: { quantity: number; initialPrice: number; minPrice: number; periodDays: number; }) => {
    if (!db || !user) throw new Error("User not authenticated or database not available.");
    
    const { quantity, initialPrice, minPrice, periodDays } = options;
    
    // Step 1: Query for available holdings OUTSIDE the transaction.
    const holdingsQuery = query(
      firestoreCollection(db, `users/${user.uid}/holdings`),
      where("artistId", "==", artist.id),
      where("status", "==", "owned")
    );

    const initialHoldingsSnap = await getDocs(holdingsQuery);

    if (initialHoldingsSnap.docs.length < quantity) {
      throw new Error("Not enough fractals to list.");
    }
    
    // Get references to the documents we intend to modify.
    const docsToUpdate = initialHoldingsSnap.docs.slice(0, quantity);
    const docRefsToUpdate = docsToUpdate.map(d => d.ref);

    // Step 2: Run the transaction.
    try {
      await runTransaction(db, async (transaction) => {
        // Step 3: Re-read the documents INSIDE the transaction to ensure they haven't changed.
        const holdingsSnaps = await Promise.all(
          docRefsToUpdate.map(ref => transaction.get(ref))
        );

        for (const docSnap of holdingsSnaps) {
          if (!docSnap.exists() || docSnap.data().status !== 'owned') {
            throw new Error("One of the fractals you tried to list was no longer available. Please try again.");
          }
        }
        
        const holdingIdsToList = holdingsSnaps.map(doc => doc.id);

        // Step 4: Perform all writes.
        for (const docRef of docRefsToUpdate) {
          transaction.update(docRef, { status: "listed" });
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
          holdingIds: holdingIdsToList,
        };
        transaction.set(listingRef, newListing);
      });

      toast({ title: "Listing Successful!", description: `You have listed ${quantity} fractal(s) for sale.` });

    } catch(e: any) {
        console.error("Listing transaction failed:", e);
        toast({
            variant: "destructive",
            title: "Listing Failed",
            description: e.message || "Could not list fractals for sale.",
        });
        // Re-throw to indicate failure to the caller if needed
        throw e;
    }
  };
  
  const cancelListing = async (listingId: string) => {
      if (!db || !user) throw new Error("User not authenticated or database not available.");
      
      await runTransaction(db, async (transaction) => {
          const listingRef = doc(db, "resaleListings", listingId);
          const listingSnap = await transaction.get(listingRef);
          if (!listingSnap.exists() || listingSnap.data().resellerId !== user.uid) {
              throw new Error("Listing not found or you do not own it.");
          }
          
          const listingData = listingSnap.data() as ResaleListing;
          if (listingData.status !== 'active') throw new Error("This listing cannot be cancelled.");
          if (!listingData.holdingIds) throw new Error("Corrupted listing data: missing holding IDs.");

          for (const holdingId of listingData.holdingIds) {
              const holdingRef = doc(db, `users/${user.uid}/holdings/${holdingId}`);
              transaction.update(holdingRef, { status: "owned" });
          }
          
          transaction.update(listingRef, { status: "cancelled", quantity: 0, holdingIds: [] });
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
    executeFractalPurchase,
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
