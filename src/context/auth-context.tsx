

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection as firestoreCollection, query, where, writeBatch, Timestamp, serverTimestamp, updateDoc, arrayUnion, arrayRemove, addDoc, getDocs, runTransaction, Firestore, DocumentReference, DocumentData, DocumentSnapshot, collectionGroup } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Artist, Fractal, OwnedFractal, ResaleListing, EditArtworkFormValues, AIScorecardBreakdown, ArtworkFormValues, CreateArtistProfileData, OrderBreakdownItem, PublicUser, PrivateHolding, PublicHolding, CollectorInfo, Award, Exhibition, PreviouslySoldArtwork } from '@/lib/data';
import type { EvaluationResult, ValuationBreakdownItem } from '@/ai/flows/evaluate-artwork-flow';
import { artists as mockArtists, fractals as mockFractals } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';

type SuccessfulEvaluation = Extract<EvaluationResult, { status: 'success' }>;


// --- Interfaces ---
export interface User {
  uid: string;
  firstName: string;
  lastName:string;
  email: string | null;
  walletBalance: number;
  watchlist: string[];
  holdingsByArtist?: { [key: string]: number; };
}

export interface ArtistProfile extends Artist {
  userId: string;
}

// --- Context Type ---
interface AuthContextType {
  user: User | null;
  artistProfile: ArtistProfile | null;
  allUsers: PublicUser[];
  isLoggedIn: boolean;
  isLoading: boolean;
  isCollectionLoading: boolean;
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
  getCollectorsForArtist: (artistId: string) => Promise<CollectorInfo[]>;
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
  const [isCollectionLoading, setIsCollectionLoading] = useState(true);
  const [artists, setArtists] = useState<Artist[]>(initialArtists.map(sanitizeArtist));
  const [fractals, setFractals] = useState<Fractal[]>(initialFractals);
  const [collection, setCollection] = useState<OwnedFractal[]>([]);
  const [resaleListings, setResaleListings] = useState<ResaleListing[]>([]);
  const [allUsers, setAllUsers] = useState<PublicUser[]>([]);

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
            setAllUsers([]);
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
      let allUsersUnsub = () => {};
      
      if (user?.uid) {
          setIsCollectionLoading(true);
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
          
          const publicHoldingsRef = firestoreCollection(db, 'users', user.uid, 'holdings');
          holdingsUnsub = onSnapshot(publicHoldingsRef, async (publicSnapshot) => {
              const publicHoldings = publicSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as (PublicHolding & {id: string})[];
              
              const privateHoldingPromises = publicHoldings.map(publicDoc => {
                  const privateDocRef = doc(db, 'users', user.uid, 'privateHoldings', publicDoc.id);
                  return getDoc(privateDocRef);
              });

              const privateHoldingSnaps = await Promise.all(privateHoldingPromises);

              const fullCollection = publicHoldings.map((publicDoc, index) => {
                  const privateDocSnap = privateHoldingSnaps[index];
                  if (privateDocSnap.exists()) {
                      const privateData = privateDocSnap.data() as PrivateHolding;
                      return {
                          ...publicDoc,
                          ...privateData
                      };
                  }
                  return null;
              }).filter((item): item is OwnedFractal => item !== null);
              
              setCollection(fullCollection);
              setIsCollectionLoading(false);
          });
          
          const allUsersQuery = query(firestoreCollection(db, 'users'));
          allUsersUnsub = onSnapshot(allUsersQuery, (snapshot) => {
            const users = snapshot.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    name: `${data.firstName} ${data.lastName}`,
                    avatar: (data.artistProfile as any)?.avatar || '',
                }
            }) as PublicUser[];
            setAllUsers(users);
          }, (error) => {
             console.error("Error fetching all users:", error);
          });

      } else {
          setArtistProfile(null);
          setCollection([]);
          setAllUsers([]);
          setIsCollectionLoading(false);
      }

      return () => {
          artistsUnsub();
          fractalsUnsub();
          resaleUnsub();
          artistUnsub();
          holdingsUnsub();
          userUnsub();
          allUsersUnsub();
      };
  }, [user?.uid]);
  
  const getCollectorsForArtist = async (artistId: string) => {
      if (!db || !user) throw new Error("Not authenticated.");
      const holdingsQuery = query(
          collectionGroup(db, 'holdings'),
          where('artistId', '==', artistId)
      );
      
      const snapshot = await getDocs(holdingsQuery);
      
      const collectorData: Record<string, { userId: string, ownedCount: number }> = {};

      snapshot.forEach(doc => {
          const userId = doc.ref.parent.parent!.id;
          
          if (!collectorData[userId]) {
              collectorData[userId] = { userId, ownedCount: 0 };
          }
          collectorData[userId].ownedCount++;
      });
      
      return Object.values(collectorData);
  }

  const signup = async (firstName: string, lastName: string, email: string, pass: string) => {
    if (!db) throw new Error("Database not available.");
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
        holdingsByArtist: {} 
      };
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
    
    const { avatar, awards, exhibitions, previouslySoldArtworks, ...restOfProfileData } = profileData;
    let avatarUrl = '';
    
    const artistRef = doc(firestoreCollection(db, 'artists'));
    const artistId = artistRef.id;
    
    if (avatar instanceof File) {
      try {
        const avatarRef = ref(storage, `avatars/${user.uid}/profile.jpg`);
        await uploadBytes(avatarRef, avatar);
        avatarUrl = await getDownloadURL(avatarRef);
      } catch (error) { throw new Error(handleAuthError(error)); }
    }

    const processedAwards = await Promise.all(
        (awards || []).map(async (award) => {
            if (award.image instanceof File) {
                const storageRef = ref(storage, `achievements/${artistId}/awards/${uuidv4()}`);
                await uploadBytes(storageRef, award.image);
                const imageUrl = await getDownloadURL(storageRef);
                return { value: award.value, image: imageUrl };
            }
            return { value: award.value };
        })
    );

    const processedExhibitions = await Promise.all(
        (exhibitions || []).map(async (exhibition) => {
            if (exhibition.images && exhibition.images.length > 0) {
                const imageUrls = await Promise.all(
                    exhibition.images.filter(img => img instanceof File).map(async (img) => {
                        const storageRef = ref(storage, `achievements/${artistId}/exhibitions/${uuidv4()}`);
                        await uploadBytes(storageRef, img as File);
                        return getDownloadURL(storageRef);
                    })
                );
                return { value: exhibition.value, images: imageUrls };
            }
            return { value: exhibition.value };
        })
    );
    
    const processedSoldArtworks = await Promise.all(
        (previouslySoldArtworks || []).map(async (artwork) => {
            const artworkImageUrl = artwork.artworkImage instanceof File ? await getDownloadURL(await uploadBytes(ref(storage, `previouslySold/${artistId}/${uuidv4()}`), artwork.artworkImage).then(s => s.ref)) : '';
            const proofImageUrl = artwork.proofOfSaleImage instanceof File ? await getDownloadURL(await uploadBytes(ref(storage, `previouslySold/${artistId}/${uuidv4()}`), artwork.proofOfSaleImage).then(s => s.ref)) : '';
            return {
                name: artwork.name,
                saleValue: artwork.saleValue,
                artworkImage: artworkImageUrl,
                proofOfSaleImage: proofImageUrl,
            };
        })
    );

    const newArtistData: Omit<Artist, 'id'> = {
        ...restOfProfileData,
        userId: user.uid,
        avatar: avatarUrl,
        awards: processedAwards,
        exhibitions: processedExhibitions,
        previouslySoldArtworks: processedSoldArtworks,
        fractalPrice: 0,
        priceHistory: [],
        totalPortfolioValue: 0,
        totalPortfolioValueHistory: [],
        totalEditions: 0,
        availableEditions: 0,
        kFactor: 0,
        totalScoreWeightedValuation: 0,
        sumOfScoresSquared: 0,
    };

    try {
        await setDoc(artistRef, newArtistData);
        await updateDoc(doc(db, "users", user.uid), {
          artistProfile: {
            id: artistRef.id,
            avatar: avatarUrl,
            name: newArtistData.name,
          }
        });
        setArtistProfile({ ...newArtistData, id: artistRef.id, userId: user.uid });
    } catch (error) { throw new Error(handleAuthError(error)); }
  };
  
  const updateArtistProfile = async (profileData: Partial<CreateArtistProfileData>) => {
      if (!db || !artistProfile || !user) throw new Error("Artist profile not found or database not available.");
      
      const { avatar, awards, exhibitions, previouslySoldArtworks, ...restOfProfileData } = profileData;
      const dataToUpdate: { [key: string]: any } = { ...restOfProfileData };

      if (avatar instanceof File) {
          try {
              const avatarRef = ref(storage, `avatars/${user.uid}/profile.jpg`);
              await uploadBytes(avatarRef, avatar);
              dataToUpdate.avatar = await getDownloadURL(avatarRef);
          } catch (error) { throw new Error(handleAuthError(error)); }
      }

      if (awards) {
        dataToUpdate.awards = await Promise.all(
          awards.map(async (award) => {
            if (award.image instanceof File) {
              const storageRef = ref(storage, `achievements/${artistProfile.id}/awards/${uuidv4()}`);
              await uploadBytes(storageRef, award.image);
              const imageUrl = await getDownloadURL(storageRef);
              return { value: award.value, image: imageUrl };
            }
            return { value: award.value, image: award.image || undefined };
          })
        );
      }
      
      if (exhibitions) {
        dataToUpdate.exhibitions = await Promise.all(
          exhibitions.map(async (exhibition) => {
            if (exhibition.images && exhibition.images.length > 0) {
              const imageUrls = await Promise.all(
                exhibition.images.map(async (img) => {
                  if (img instanceof File) {
                    const storageRef = ref(storage, `achievements/${artistProfile.id}/exhibitions/${uuidv4()}`);
                    await uploadBytes(storageRef, img);
                    return getDownloadURL(storageRef);
                  }
                  return img; // It's already a URL string
                })
              );
              return { value: exhibition.value, images: imageUrls.filter(Boolean) as string[] };
            }
            return { value: exhibition.value, images: [] };
          })
        );
      }

      if (previouslySoldArtworks) {
          dataToUpdate.previouslySoldArtworks = await Promise.all(
              previouslySoldArtworks.map(async (artwork) => {
                  const artworkImageUrl = artwork.artworkImage instanceof File
                      ? await getDownloadURL(await uploadBytes(ref(storage, `previouslySold/${artistProfile.id}/${uuidv4()}`), artwork.artworkImage).then(s => s.ref))
                      : artwork.artworkImage;
                  const proofImageUrl = artwork.proofOfSaleImage instanceof File
                      ? await getDownloadURL(await uploadBytes(ref(storage, `previouslySold/${artistProfile.id}/${uuidv4()}`), artwork.proofOfSaleImage).then(s => s.ref))
                      : artwork.proofOfSaleImage;
                  return {
                      name: artwork.name,
                      saleValue: artwork.saleValue,
                      artworkImage: artworkImageUrl,
                      proofOfSaleImage: proofImageUrl,
                  };
              })
          );
      }
      
      const artistRef = doc(db, "artists", artistProfile.id);
      try {
          await updateDoc(artistRef, dataToUpdate);
          
          const userArtistProfileUpdate: any = {};
          if(dataToUpdate.avatar) userArtistProfileUpdate['artistProfile.avatar'] = dataToUpdate.avatar;
          if(dataToUpdate.name) userArtistProfileUpdate['artistProfile.name'] = dataToUpdate.name;

          if (Object.keys(userArtistProfileUpdate).length > 0) {
            await updateDoc(doc(db, "users", user.uid), userArtistProfileUpdate);
          }
          
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

    const artistFractalsQuery = query(firestoreCollection(db, "fractals"), where("artistId", "==", artistProfile.id));
    const artistFractalsSnap = await getDocs(artistFractalsQuery);
    const allExistingFractals = artistFractalsSnap.docs.map(doc => doc.data() as Fractal);

    await runTransaction(db, async (transaction) => {
        const artistRef = doc(db, "artists", artistProfile.id);
        const artistSnap = await transaction.get(artistRef);
        if (!artistSnap.exists()) throw new Error("Artist profile does not exist.");
        
        const { length, breadth, height, unit } = artworkData;
        const artworkSize = { length, breadth, unit, ...(height && { height }) };
        
        const new_Vi = Number(finalPrice) || 0;
        const new_Si = Number(evaluationResult.evaluation.finalScore) || 0;
        const new_Fi = parseInt(String(artworkData.editionsToIssue), 10) || 0;

        const newFractalData: Fractal = {
            id: newFractalId,
            artistId: artistProfile.id,
            title: artworkData.title,
            description: artworkData.description,
            materials: artworkData.materials,
            artworkSize,
            images: imageUrls,
            heroImage: heroImageUrl,
            price: new_Vi,
            priceHistory: [{ date: new Date().toISOString(), price: new_Vi }],
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
            aiScore: new_Si,
            aiScorecard: evaluationResult.evaluation.breakdown,
            valuationBreakdown: evaluationResult.evaluation.valuationBreakdown,
            crestoxPriceRange: evaluationResult.evaluation.crestoxPriceRange,
            editions: new_Fi,
            editionsAvailable: new_Fi,
            ...(shouldApplyGrade && { crestoxGrade: evaluationResult.evaluation.grade }),
        };
        
        const allFractalsForCalc = [...allExistingFractals, newFractalData];

        const V_new = allFractalsForCalc.reduce((sum, f) => sum + (f.price || 0), 0);
        const F_new = allFractalsForCalc.reduce((sum, f) => sum + (f.editions || 0), 0);
        const sum_SiVi_new = allFractalsForCalc.reduce((sum, f) => sum + ((f.aiScore || 0) * (f.price || 0)), 0);
        const sum_S_squared_new = allFractalsForCalc.reduce((sum, f) => sum + Math.pow(f.aiScore || 0, 2), 0);
        
        const k_new = sum_SiVi_new > 0 ? V_new / sum_SiVi_new : 0;
        const P_new = F_new > 0 ? V_new / F_new : 0;
        const available_F_new = (artistSnap.data().availableEditions || 0) + new_Fi;

        const newFractalRef = doc(db, "fractals", newFractalId);
        transaction.set(newFractalRef, newFractalData);

        transaction.update(artistRef, {
            totalPortfolioValue: V_new,
            totalEditions: F_new,
            availableEditions: available_F_new,
            fractalPrice: P_new,
            kFactor: k_new,
            totalScoreWeightedValuation: sum_SiVi_new,
            sumOfScoresSquared: sum_S_squared_new,
            priceHistory: arrayUnion({ date: new Date().toISOString(), price: P_new }),
            totalPortfolioValueHistory: arrayUnion({ date: new Date().toISOString(), value: V_new })
        });
    }).catch(error => {
      console.error("Add artwork transaction failed: ", error);
      toast({ variant: "destructive", title: "Database Error", description: handleAuthError(error) });
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
      const artistMin = Number(artworkData.minEstimatedValue || 0);
      const artistMax = Number(artworkData.maxEstimatedValue || 0);
      const artistPrice = (artistMin + artistMax) / 2;
      const v_new = useCrestoxPrice ? crestoxPrice : artistPrice;
      const s_new = Number(evaluation.finalScore) || 0;
      const f_portfolio_new = parseInt(String(artworkData.editionsToIssue), 10) || 0;
      const shouldApplyGrade = useCrestoxPrice || artistPrice <= crestoxPrice;
      
      const artistFractalsQuery = query(firestoreCollection(db, "fractals"), where("artistId", "==", artistProfile.id));
      const artistFractalsSnap = await getDocs(artistFractalsQuery);
      const allExistingFractals = artistFractalsSnap.docs.map(doc => ({id: doc.id, ...doc.data()} as Fractal));
      const oldFractalData = allExistingFractals.find(f => f.id === artworkId);
      if (!oldFractalData) throw new Error("Original artwork data not found.");
      
      const f_old = oldFractalData.editions || 0;

      await runTransaction(db, async (transaction) => {
          const artistRef = doc(db, "artists", artistProfile.id);
          const fractalRef = doc(db, "fractals", artworkId);
          const artistSnap = await transaction.get(artistRef);
          if (!artistSnap.exists()) throw new Error("Artist not found.");
          
          const { length, breadth, height, unit, ...restOfArtworkData } = artworkData;
          const artworkSize = { length, breadth, unit, ...(height && { height }) };
          
          const fractalUpdateData: { [key: string]: any } = {
              ...restOfArtworkData,
              artworkSize,
              price: v_new,
              priceHistory: arrayUnion({ date: new Date().toISOString(), price: v_new }),
              aiScore: s_new,
              aiScorecard: evaluation.breakdown,
              valuationBreakdown: evaluation.valuationBreakdown,
              artistMinEstimate: artworkData.minEstimatedValue,
              artistMaxEstimate: artworkData.maxEstimatedValue,
              crestoxPriceRange: evaluation.crestoxPriceRange,
              editions: f_old + f_portfolio_new,
          };
          if (shouldApplyGrade) {
              fractalUpdateData.crestoxGrade = evaluation.grade;
          } else {
              fractalUpdateData.crestoxGrade = null;
          }
          
          transaction.update(fractalRef, fractalUpdateData);

          const updatedFractalList = allExistingFractals.map(f => f.id === artworkId ? {...f, ...fractalUpdateData} : f);

          const V_final = updatedFractalList.reduce((sum, f) => sum + (f.price || 0), 0);
          const F_final = updatedFractalList.reduce((sum, f) => sum + (f.editions || 0), 0);
          const sum_SiVi_final = updatedFractalList.reduce((sum, f) => sum + ((f.aiScore || 0) * (f.price || 0)), 0);
          const sum_S_squared_final = updatedFractalList.reduce((sum, f) => sum + Math.pow(f.aiScore || 0, 2), 0);

          const k_final = sum_SiVi_final > 0 ? V_final / sum_SiVi_final : 0;
          const P_final = F_final > 0 ? V_final / F_final : 0;
          const available_F_final = (artistSnap.data().availableEditions || 0) + f_portfolio_new;

          transaction.update(artistRef, {
              totalPortfolioValue: V_final,
              totalEditions: F_final,
              availableEditions: available_F_final,
              fractalPrice: P_final,
              kFactor: k_final,
              totalScoreWeightedValuation: sum_SiVi_final,
              sumOfScoresSquared: sum_S_squared_final,
              priceHistory: arrayUnion({ date: new Date().toISOString(), price: P_final }),
              totalPortfolioValueHistory: arrayUnion({ date: new Date().toISOString(), value: V_final })
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
        const { length, breadth, height, unit, ...restOfData } = data;
        const artworkSize = { length, breadth, unit, ...(height && { height }) };
        await updateDoc(fractalRef, {...restOfData, artworkSize});
        toast({ title: "Update Successful", description: "Artwork details have been saved." });
      } catch (error) { throw new Error(handleAuthError(error)); }
  };
  
  const executeFractalPurchase = async (artistId: string, orderBreakdown: OrderBreakdownItem[], totalCost: number) => {
    if (!db || !user) throw new Error("User not authenticated.");

    const totalPayable = totalCost * 1.18; // 18% GST
    if (user.walletBalance < totalPayable) {
        throw new Error("Insufficient CreCoin balance.");
    }
    
    const artistFractalsQuery = query(firestoreCollection(db, "fractals"), where("artistId", "==", artistId));
    const artistFractalsSnap = await getDocs(artistFractalsQuery);
    const allArtistFractals = artistFractalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fractal));

    await runTransaction(db, async (transaction) => {
        const buyerRef = doc(db, "users", user.uid);
        const artistRef = doc(db, "artists", artistId);

        const buyerSnap = await transaction.get(buyerRef);
        const artistSnap = await transaction.get(artistRef);
        
        if (!buyerSnap.exists()) throw new Error("Buyer user document not found.");
        if (!artistSnap.exists()) throw new Error("Artist document not found.");

        const buyerData = buyerSnap.data() as User;
        const artistData = artistSnap.data() as Artist;
        
        const F_total = artistData.totalEditions || 0;
        const P_current = artistData.fractalPrice || 0;

        if (buyerData.walletBalance < totalPayable) {
            throw new Error("Insufficient funds. Your balance may have changed.");
        }

        const holdingLimit = F_total > 0 ? Math.floor(F_total * 0.1) : 0;
        const currentUserHoldings = buyerData.holdingsByArtist?.[artistId] || 0;
        const purchaseQuantity = orderBreakdown.reduce((sum, item) => sum + item.quantity, 0);

        if (holdingLimit > 0 && currentUserHoldings + purchaseQuantity > holdingLimit) {
            throw new Error(`This purchase would exceed the ${holdingLimit} fractal limit (10%) for this artist.`);
        }
        
        // --- PRE-FETCH RESELLER DATA (outside main loop)
        const resellerRefs = new Map<string, DocumentReference>();
        for (const item of orderBreakdown) {
          if (item.source === 'RESELLER' && item.resellerId) {
            if (!resellerRefs.has(item.resellerId)) {
              resellerRefs.set(item.resellerId, doc(db, "users", item.resellerId));
            }
          }
        }
        const resellerSnaps = new Map<string, DocumentSnapshot>();
        for(const [id, ref] of resellerRefs) { resellerSnaps.set(id, await transaction.get(ref)); }
        // --- END PRE-FETCH
        
        let P_new = P_current;
        const quantityFromArtist = orderBreakdown
            .filter(item => item.source === 'ARTIST')
            .reduce((sum, item) => sum + item.quantity, 0);
        
        // Step 1: `ArtFractalValueChange` - Calculate new fractal price from market impact
        if (quantityFromArtist > 0 && F_total > 0) {
            const beta = 0.4472;
            const fraction = quantityFromArtist / F_total;
            const impactFactor = Math.exp(beta * Math.sqrt(fraction));
            P_new = P_current * impactFactor;
        }

        // Step 2: `ArtFractalPro` Reverse Mechanism
        const delta_Veff = (P_new - P_current) * F_total;
        
        // Recalculate aggregates from scratch for accuracy
        const V_current_sum = allArtistFractals.reduce((sum, f) => sum + (f.price || 0), 0);
        const sum_SiVi_current = allArtistFractals.reduce((sum, f) => sum + ((f.aiScore || 0) * (f.price || 0)), 0);
        const k_recalculated = V_current_sum > 0 && sum_SiVi_current > 0 ? V_current_sum / sum_SiVi_current : 0;
        const sum_S_squared = allArtistFractals.reduce((sum, f) => sum + Math.pow(f.aiScore || 0, 2), 0);

        let c = 0;
        if (k_recalculated > 0 && sum_S_squared > 0) {
            c = delta_Veff / (k_recalculated * sum_S_squared);
        }

        // Update each artwork's valuation
        let V_new_total = 0;
        for (const fractal of allArtistFractals) {
            const Vi_current = fractal.price || 0;
            const Si = fractal.aiScore || 0;
            const delta_Vi = c * Si;
            const Vi_new = Vi_current + delta_Vi;
            V_new_total += Vi_new;

            const fractalRef = doc(db, "fractals", fractal.id);
            transaction.update(fractalRef, {
                price: Vi_new,
                priceHistory: arrayUnion({ date: new Date().toISOString(), price: Vi_new }),
            });
        }

        // 3. Process wallet transfers and holding movements
        transaction.update(buyerRef, { 
            walletBalance: buyerData.walletBalance - totalPayable,
            [`holdingsByArtist.${artistId}`]: currentUserHoldings + purchaseQuantity
        });

        for (const item of orderBreakdown) {
            for (let j = 0; j < item.quantity; j++) {
              const newHoldingId = uuidv4();
              const newPublicHoldingRef = doc(db, `users/${user.uid}/holdings/${newHoldingId}`);
              transaction.set(newPublicHoldingRef, { artistId, purchaseDate: new Date().toISOString(), status: 'owned' });
              const newPrivateHoldingRef = doc(db, `users/${user.uid}/privateHoldings/${newHoldingId}`);
              transaction.set(newPrivateHoldingRef, { purchasePrice: item.price, serialNumber: uuidv4() });
            }

            if (item.source === 'RESELLER' && item.resellerId && item.listingId) {
                const sellerRef = resellerRefs.get(item.resellerId)!;
                const sellerSnap = resellerSnaps.get(item.resellerId)!;
                if (!sellerSnap.exists()) throw new Error("Seller not found");
                
                const sellerData = sellerSnap.data() as User;
                const proceeds = (item.quantity * item.price) * 0.98;
                const sellerHoldingsCount = sellerData.holdingsByArtist?.[artistId] || 0;
                transaction.update(sellerRef, { 
                    walletBalance: sellerData.walletBalance + proceeds,
                    [`holdingsByArtist.${artistId}`]: Math.max(0, sellerHoldingsCount - item.quantity)
                });
                
                const listingRef = doc(db, "resaleListings", item.listingId);
                const listingDataSnap = await transaction.get(listingRef);
                if (!listingDataSnap.exists()) throw new Error(`Listing ${item.listingId} not found.`);
                const listingData = listingDataSnap.data() as ResaleListing;

                const newQuantity = listingData.quantity - item.quantity;
                transaction.update(listingRef, {
                    quantity: newQuantity,
                    holdingIds: listingData.holdingIds.slice(item.quantity),
                    status: newQuantity === 0 ? 'completed' : 'active',
                });
                
                const holdingsToTransfer = listingData.holdingIds.slice(0, item.quantity);
                for (const holdingId of holdingsToTransfer) {
                    transaction.delete(doc(db, `users/${item.resellerId}/holdings/${holdingId}`));
                    transaction.delete(doc(db, `users/${item.resellerId}/privateHoldings/${holdingId}`));
                }
            }
        }
        
        // 4. Atomically update the artist document with all new values
        const artistUpdate: Record<string, any> = {
            fractalPrice: P_new,
            totalPortfolioValue: V_new_total,
            priceHistory: arrayUnion({ date: new Date().toISOString(), price: P_new }),
            totalPortfolioValueHistory: arrayUnion({ date: new Date().toISOString(), value: V_new_total }),
            kFactor: k_recalculated,
            sumOfScoresSquared: sum_S_squared
        };
        if (quantityFromArtist > 0) {
            artistUpdate.availableEditions = artistData.availableEditions - quantityFromArtist;
        }
        transaction.update(artistRef, artistUpdate);
    });
    toast({ title: "Collection Successful!", description: `You have collected ${orderBreakdown.reduce((sum, item) => sum + item.quantity, 0)} fractal(s).` });
  };

  const listForResale = async (artist: Artist, options: { quantity: number; initialPrice: number; minPrice: number; periodDays: number; }) => {
    if (!db || !user) throw new Error("User not authenticated or database not available.");
    
    const { quantity, initialPrice, minPrice, periodDays } = options;
    
    const holdingsQuery = query(
      firestoreCollection(db, `users/${user.uid}/holdings`),
      where("artistId", "==", artist.id),
      where("status", "==", "owned")
    );

    const initialHoldingsSnap = await getDocs(holdingsQuery);

    if (initialHoldingsSnap.docs.length < quantity) {
      throw new Error("Not enough fractals to list.");
    }
    
    const docsToUpdate = initialHoldingsSnap.docs.slice(0, quantity);
    const docRefsToUpdate = docsToUpdate.map(d => d.ref);

    try {
      await runTransaction(db, async (transaction) => {
        const holdingsSnaps = await Promise.all(
          docRefsToUpdate.map(ref => transaction.get(ref))
        );

        for (const docSnap of holdingsSnaps) {
          if (!docSnap.exists() || docSnap.data().status !== 'owned') {
            throw new Error("One of the fractals you tried to list was no longer available. Please try again.");
          }
        }
        
        const holdingIdsToList = holdingsSnaps.map(doc => doc.id);

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
    allUsers,
    isLoggedIn: !!user,
    isLoading,
    isCollectionLoading,
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
    getCollectorsForArtist,
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
