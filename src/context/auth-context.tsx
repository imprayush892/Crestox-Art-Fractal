
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection as firestoreCollection, query, where, writeBatch, Timestamp, serverTimestamp, updateDoc, arrayUnion, arrayRemove, addDoc, getDocs, runTransaction, Firestore, DocumentReference, DocumentData, DocumentSnapshot, collectionGroup, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Artist, Fractal, OwnedFractal, ResaleListing, EditArtworkFormValues, AIScorecardBreakdown, ArtworkFormValues, CreateArtistProfileData, OrderBreakdownItem, PublicUser, PrivateHolding, PublicHolding, CollectorInfo, Award, Exhibition, PreviouslySoldArtwork, Notification, AdminNotification } from '@/lib/data';
import type { EvaluationResult, ValuationBreakdownItem } from '@/ai/flows/evaluate-artwork-flow';
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
  artistProfile?: {
    id: string;
    avatar: string;
    name: string;
  }
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
  isArtist: boolean;
  isAdmin: boolean;
  artists: Artist[];
  fractals: Fractal[];
  collection: OwnedFractal[];
  resaleListings: ResaleListing[];
  watchlist: string[];
  notifications: Notification[];
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
  requestManualArtworkCreation: (artworkData: ArtworkFormValues, reason: string) => Promise<void>;
  requestManualReevaluation: (artworkId: string, reason: string) => Promise<void>;
  submitManualValuationAsAdmin: (artworkId: string, minPrice: number, maxPrice: number, grade: string) => Promise<void>;
  updateAndReevaluateArtwork: (artworkId: string, artworkData: EditArtworkFormValues, evaluationResult: EvaluationResult, useCrestoxPrice: boolean) => Promise<void>;
  updateArtworkDetails: (artworkId: string, data: EditArtworkFormValues) => Promise<void>;
  reevaluateArtworkForGrading: (fractal: Fractal) => Promise<void>;
  getCollectorsForArtist: (artistId: string) => Promise<CollectorInfo[]>;
  updateFractalPriceAsAdmin: (fractalId: string, newPrice: number) => Promise<void>;
  flagArtwork: (fractalId: string, flag: boolean, reason: string) => Promise<void>;
  flagArtistContent: (artistId: string, imageUrl: string, flag: boolean, reason: string) => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
  deleteArtistAchievement: (artistId: string, type: 'award' | 'exhibition', item: Award | Exhibition) => Promise<void>;
  updateArtworkStatus: (fractalId: string, status: 'pending_review' | 'active' | 'private') => Promise<void>;
  deleteArtwork: (fractalId: string, artistId: string) => Promise<void>;
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

export function AuthProvider({ children, initialArtists, initialFractals }: { children: ReactNode, initialArtists: Artist[], initialFractals: Fractal[] }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollectionLoading, setIsCollectionLoading] = useState(true);
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [fractals, setFractals] = useState<Fractal[]>(initialFractals);
  const [collection, setCollection] = useState<OwnedFractal[]>([]);
  const [resaleListings, setResaleListings] = useState<ResaleListing[]>([]);
  const [allUsers, setAllUsers] = useState<PublicUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let unsubscribeUser: () => void = () => {};
    let unsubscribeArtistProfile: () => void = () => {};
    let unsubscribeHoldings: () => void = () => {};
    let unsubscribeAllUsers: () => void = () => {};
    let unsubscribeNotifications: () => void = () => {};
    
    // --- Data Listeners ---
    const unsubscribeArtists = onSnapshot(firestoreCollection(db, "artists"), (snapshot) => {
        const artistsFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist));
        setArtists(currentArtists => {
            const combined = [...currentArtists];
            const existingIds = new Set(currentArtists.map(a => a.id));
            artistsFromDb.forEach(dbArtist => {
                if (!existingIds.has(dbArtist.id)) {
                    combined.push(dbArtist);
                } else {
                    const index = combined.findIndex(a => a.id === dbArtist.id);
                    if (index !== -1) combined[index] = dbArtist; // Update existing
                }
            });
            return combined;
        });
    });

    const unsubscribeFractals = onSnapshot(firestoreCollection(db, "fractals"), (snapshot) => {
        const fractalsFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fractal));
        setFractals(currentFractals => {
            const combined = [...currentFractals];
            const existingIds = new Set(currentFractals.map(f => f.id));
            fractalsFromDb.forEach(dbFractal => {
                if (!existingIds.has(dbFractal.id)) {
                    combined.push(dbFractal);
                } else {
                    const index = combined.findIndex(f => f.id === dbFractal.id);
                    if (index !== -1) combined[index] = dbFractal; // Update existing
                }
            });
            return combined;
        });
    });

    const unsubscribeResaleListings = onSnapshot(firestoreCollection(db, "resaleListings"), (snapshot) => {
        const fetchedListings = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as ResaleListing[];
        setResaleListings(fetchedListings);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Unsubscribe from all previous user-specific listeners
      unsubscribeUser();
      unsubscribeArtistProfile();
      unsubscribeHoldings();
      unsubscribeAllUsers();
      unsubscribeNotifications();
      
      if (firebaseUser) {
        setIsLoading(true);
        setIsCollectionLoading(true);
        
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        const userIsAdmin = !!adminEmail && firebaseUser.email === adminEmail;
        setIsAdmin(userIsAdmin);

        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeUser = onSnapshot(userRef, async (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);

            if (userData.artistProfile?.id) {
              const artistRef = doc(db, 'artists', userData.artistProfile.id);
              unsubscribeArtistProfile = onSnapshot(artistRef, (artistDoc) => {
                if (artistDoc.exists()) {
                  setArtistProfile({ id: artistDoc.id, ...artistDoc.data() } as ArtistProfile);
                } else {
                  console.warn("Artist document link is broken, resetting profile.");
                  setArtistProfile(null);
                }
              });
            } else {
              setArtistProfile(null);
            }
            
            const publicHoldingsRef = firestoreCollection(db, 'users', firebaseUser.uid, 'holdings');
            unsubscribeHoldings = onSnapshot(publicHoldingsRef, async (publicSnapshot) => {
                const publicHoldings = publicSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as (PublicHolding & {id: string})[];
                const privateHoldingPromises = publicHoldings.map(publicDoc => getDoc(doc(db, 'users', firebaseUser.uid, 'privateHoldings', publicDoc.id)));
                const privateHoldingSnaps = await Promise.all(privateHoldingPromises);
                const fullCollection = publicHoldings.map((publicDoc, index) => {
                    const privateDocSnap = privateHoldingSnaps[index];
                    return privateDocSnap.exists() ? { ...publicDoc, ...(privateDocSnap.data() as PrivateHolding) } : null;
                }).filter((item): item is OwnedFractal => item !== null);
                
                setCollection(fullCollection);
                setIsCollectionLoading(false);
            });

            const allUsersQuery = query(firestoreCollection(db, 'users'));
            unsubscribeAllUsers = onSnapshot(allUsersQuery, (snapshot) => {
                const users = snapshot.docs.map(d => ({
                    id: d.id,
                    name: `${d.data().firstName} ${d.data().lastName}`,
                    avatar: (d.data().artistProfile as any)?.avatar || '',
                })) as PublicUser[];
                setAllUsers(users);
            });
            
            const notificationsRef = firestoreCollection(db, 'users', firebaseUser.uid, 'notifications');
            const notificationsQuery = query(notificationsRef, orderBy('timestamp', 'desc'));
            unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
                const fetchedNotifications = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Notification[];
                setNotifications(fetchedNotifications);
            });


            setIsLoading(false);
          } else {
            console.error(`User ${firebaseUser.uid} is authenticated but has no user document.`);
            setUser(null);
            setArtistProfile(null);
            setCollection([]);
            setAllUsers([]);
            setIsLoading(false);
            setIsCollectionLoading(false);
          }
        });
        
      } else {
        setUser(null);
        setArtistProfile(null);
        setCollection([]);
        setAllUsers([]);
        setNotifications([]);
        setIsAdmin(false);
        setIsLoading(false);
        setIsCollectionLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeArtists();
      unsubscribeFractals();
      unsubscribeResaleListings();
      unsubscribeUser();
      unsubscribeArtistProfile();
      unsubscribeHoldings();
      unsubscribeAllUsers();
      unsubscribeNotifications();
    };
  }, []);
  
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
                const storageRef = ref(storage, `achievements/${user.uid}/awards/${uuidv4()}`);
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
                        const storageRef = ref(storage, `achievements/${user.uid}/exhibitions/${uuidv4()}`);
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
            const artworkImageUrl = artwork.artworkImage instanceof File ? await getDownloadURL(await uploadBytes(ref(storage, `previouslySold/${user.uid}/${uuidv4()}`), artwork.artworkImage).then(s => s.ref)) : '';
            const proofImageUrl = artwork.proofOfSaleImage instanceof File ? await getDownloadURL(await uploadBytes(ref(storage, `previouslySold/${user.uid}/${uuidv4()}`), artwork.proofOfSaleImage).then(s => s.ref)) : '';
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
              const storageRef = ref(storage, `achievements/${user.uid}/awards/${uuidv4()}`);
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
                    const storageRef = ref(storage, `achievements/${user.uid}/exhibitions/${uuidv4()}`);
                    await uploadBytes(storageRef, img);
                    return getDownloadURL(storageRef);
                  }
                  return img;
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
                      ? await getDownloadURL(await uploadBytes(ref(storage, `previouslySold/${user.uid}/${uuidv4()}`), artwork.artworkImage).then(s => s.ref))
                      : artwork.artworkImage;
                  const proofImageUrl = artwork.proofOfSaleImage instanceof File
                      ? await getDownloadURL(await uploadBytes(ref(storage, `previouslySold/${user.uid}/${uuidv4()}`), artwork.proofOfSaleImage).then(s => s.ref))
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

    await runTransaction(db, async (transaction) => {
        const artistRef = doc(db, "artists", artistProfile.id);
        const artistSnap = await transaction.get(artistRef);
        if (!artistSnap.exists()) throw new Error("Artist profile does not exist.");
        
        const artistData = artistSnap.data() as Artist;

        const { length, breadth, height, unit } = artworkData;
        const artworkSize = { length, breadth, unit, ...(height && { height }) };
        
        const new_Vi = Number(finalPrice) || 0;
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
            aiScore: evaluationResult.evaluation.finalScore,
            aiScorecard: evaluationResult.evaluation.breakdown,
            valuationBreakdown: evaluationResult.evaluation.valuationBreakdown,
            crestoxPriceRange: evaluationResult.evaluation.crestoxPriceRange,
            editions: new_Fi,
            editionsAvailable: new_Fi,
            status: 'active',
            ...(shouldApplyGrade && { crestoxGrade: evaluationResult.evaluation.grade }),
        };
        
        const V_total_new = artistData.totalPortfolioValue + new_Vi;
        const F_total_new = artistData.totalEditions + new_Fi;
        const P_new = F_total_new > 0 ? V_total_new / F_total_new : 0;
        const available_F_new = artistData.availableEditions + new_Fi;

        const newFractalRef = doc(db, "fractals", newFractalId);
        transaction.set(newFractalRef, newFractalData);

        transaction.update(artistRef, {
            totalPortfolioValue: V_total_new,
            totalEditions: F_total_new,
            availableEditions: available_F_new,
            fractalPrice: P_new,
            priceHistory: arrayUnion({ date: new Date().toISOString(), price: P_new }),
            totalPortfolioValueHistory: arrayUnion({ date: new Date().toISOString(), value: V_total_new })
        });
    }).catch(error => {
      console.error("Add artwork transaction failed: ", error);
      toast({ variant: "destructive", title: "Database Error", description: handleAuthError(error) });
      throw error;
    });
  };

  const requestManualArtworkCreation = async (artworkData: ArtworkFormValues, reason: string) => {
    if (!db || !user || !artistProfile) throw new Error("User or artist profile not authenticated.");

    const newFractalId = doc(firestoreCollection(db, 'fractals')).id;
    let imageUrls: string[] = [];
    let heroImageUrl = '';

    try {
        imageUrls = await Promise.all(
            artworkData.images.map(async (file: File) => {
                const storageRef = ref(storage, `artworks/${user.uid}/${newFractalId}/${uuidv4()}_${file.name}`);
                await uploadBytes(storageRef, file);
                return getDownloadURL(storageRef);
            })
        );
        heroImageUrl = imageUrls[artworkData.heroImageIndex > -1 ? artworkData.heroImageIndex : 0];
    } catch (error) {
        throw new Error(handleAuthError(error));
    }

    const { length, breadth, height, unit } = artworkData;
    const artworkSize = { length, breadth, unit, ...(height && { height }) };
    const fractalDataPayload: Omit<Fractal, 'status'> & { status: 'pending_review' } = {
        id: newFractalId,
        artistId: artistProfile.id,
        title: artworkData.title,
        description: reason,
        materials: artworkData.materials,
        artworkSize,
        images: imageUrls,
        heroImage: heroImageUrl,
        width: 600,
        height: 400,
        aiHint: 'custom artwork',
        subjectSignificance: artworkData.subjectSignificance || "",
        personalSignificance: artworkData.personalSignificance || "",
        timeEffort: artworkData.timeEffort || "",
        biographicalContext: artworkData.biographicalContext || "",
        commissionPatronage: artworkData.commissionPatronage || "",
        status: 'pending_review' as const,
        price: 0,
        priceHistory: [],
    };
    
    const fractalRef = doc(db, "fractals", newFractalId);
    try {
        await setDoc(fractalRef, fractalDataPayload);
    } catch (error) {
       throw new Error(handleAuthError(error));
    }
  };

  const requestManualReevaluation = async (artworkId: string, reason: string) => {
    if (!db || !user || !artistProfile) throw new Error("User or artist profile not authenticated.");
    const fractalRef = doc(db, "fractals", artworkId);
    try {
      await updateDoc(fractalRef, {
        status: 'pending_review',
        description: reason,
      });

    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  };

  const submitManualValuationAsAdmin = async (artworkId: string, minPrice: number, maxPrice: number, grade: string) => {
    if (!isAdmin) throw new Error("Unauthorized");
    if (!db) throw new Error("Database not available");

    await runTransaction(db, async (transaction) => {
        const fractalRef = doc(db, "fractals", artworkId);
        const fractalSnap = await transaction.get(fractalRef);
        if (!fractalSnap.exists() || fractalSnap.data().status !== 'pending_review') {
            throw new Error("Artwork not found or not pending review.");
        }
        const artworkData = fractalSnap.data() as Fractal;

        const artistRef = doc(db, "artists", artworkData.artistId);
        const artistSnap = await transaction.get(artistRef);
        if (!artistSnap.exists()) throw new Error("Artist profile does not exist.");

        const artistFractalsQuery = query(firestoreCollection(db, "fractals"), where("artistId", "==", artworkData.artistId), where("status", "==", "active"));
        const existingActiveFractalsSnap = await getDocs(artistFractalsQuery);
        const existingActiveFractals = existingActiveFractalsSnap.docs.map(doc => doc.data() as Fractal);

        const finalPrice = Math.round((minPrice + maxPrice) / 2);
        
        const artworkUpdate: Partial<Fractal> = {
            status: 'active',
            price: finalPrice,
            artistMinEstimate: minPrice,
            artistMaxEstimate: maxPrice,
            crestoxGrade: grade || undefined,
            priceHistory: arrayUnion({ date: new Date().toISOString(), price: finalPrice }) as any,
        };
        
        const newActiveFractal = { ...artworkData, ...artworkUpdate } as Fractal;
        const allActiveFractals = [...existingActiveFractals, newActiveFractal];

        const V_new = allActiveFractals.reduce((sum, f) => sum + (f.price || 0), 0);
        const F_new = allActiveFractals.reduce((sum, f) => sum + (f.editions || 0), 0);
        const P_new = F_new > 0 ? V_new / F_new : 0;
        
        transaction.update(fractalRef, artworkUpdate);
        transaction.update(artistRef, {
            totalPortfolioValue: V_new,
            fractalPrice: P_new,
            totalEditions: F_new,
            priceHistory: arrayUnion({ date: new Date().toISOString(), price: P_new }),
            totalPortfolioValueHistory: arrayUnion({ date: new Date().toISOString(), value: V_new })
        });
        
    });
  }


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
      
      await runTransaction(db, async (transaction) => {
          const artistRef = doc(db, "artists", artistProfile.id);
          const fractalRef = doc(db, "fractals", artworkId);
          const artistSnap = await transaction.get(artistRef);
          if (!artistSnap.exists()) throw new Error("Artist not found.");

          const artistFractalsQuery = query(firestoreCollection(db, "fractals"), where("artistId", "==", artistProfile.id));
          const artistFractalsSnap = await getDocs(artistFractalsQuery);
          const allExistingFractals = artistFractalsSnap.docs.map(doc => ({id: doc.id, ...doc.data()} as Fractal));
          const oldFractalData = allExistingFractals.find(f => f.id === artworkId);
          if (!oldFractalData) throw new Error("Original artwork data not found.");

          
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
              crestoxPriceRange: evaluation.crestoxPriceRange,
              editions: (oldFractalData.editions || 0) + f_portfolio_new,
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
          const P_final = F_final > 0 ? V_final / F_final : 0;
          const available_F_final = (artistSnap.data().availableEditions || 0) + f_portfolio_new;

          transaction.update(artistRef, {
              totalPortfolioValue: V_final,
              totalEditions: F_final,
              availableEditions: available_F_final,
              fractalPrice: P_final,
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
    
    await runTransaction(db, async (transaction) => {
        // --- 1. GATHER ALL DOCUMENT REFERENCES ---
        const buyerRef = doc(db, "users", user.uid);
        const artistRef = doc(db, "artists", artistId);
        
        const resellerRefs = new Map<string, DocumentReference>();
        const listingRefs = new Map<string, DocumentReference>();
        
        for (const item of orderBreakdown) {
            if (item.source === 'RESELLER') {
                if (item.resellerId) resellerRefs.set(item.resellerId, doc(db, "users", item.resellerId));
                if (item.listingId) listingRefs.set(item.listingId, doc(db, "resaleListings", item.listingId));
            }
        }

        // --- 2. EXECUTE ALL READS FIRST ---
        const [
            buyerSnap,
            artistSnap,
            artistFractalsSnap,
            ...otherSnaps
        ] = await Promise.all([
            transaction.get(buyerRef),
            transaction.get(artistRef),
            getDocs(artistFractalsQuery), // This is a non-transactional read, which is fine
            ...Array.from(resellerRefs.values()).map(ref => transaction.get(ref)),
            ...Array.from(listingRefs.values()).map(ref => transaction.get(ref)),
        ]);
        
        const resellerSnaps = new Map<string, DocumentSnapshot>();
        const listingSnaps = new Map<string, DocumentSnapshot>();

        let snapIndex = 0;
        for (const id of resellerRefs.keys()) {
            resellerSnaps.set(id, otherSnaps[snapIndex++]);
        }
        for (const id of listingRefs.keys()) {
            listingSnaps.set(id, otherSnaps[snapIndex++]);
        }

        // --- 3. VALIDATE DATA AND PERFORM CALCULATIONS ---
        if (!buyerSnap.exists()) throw new Error("Buyer user document not found.");
        if (!artistSnap.exists()) throw new Error("Artist document not found.");
        
        const allArtistFractals = artistFractalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fractal));
        const buyerData = buyerSnap.data() as User;
        const artistData = artistSnap.data() as Artist;
        
        if (buyerData.walletBalance < totalPayable) {
            throw new Error("Insufficient funds. Your balance may have changed.");
        }

        const F_total = artistData.totalEditions || 0;
        const holdingLimit = F_total > 0 ? Math.floor(F_total * 0.1) : 0;
        const currentUserHoldings = buyerData.holdingsByArtist?.[artistId] || 0;
        const purchaseQuantity = orderBreakdown.reduce((sum, item) => sum + item.quantity, 0);

        if (holdingLimit > 0 && currentUserHoldings + purchaseQuantity > holdingLimit) {
            throw new Error(`This purchase would exceed the ${holdingLimit} fractal limit (10%) for this artist.`);
        }

        const quantityFromArtist = orderBreakdown
            .filter(item => item.source === 'ARTIST')
            .reduce((sum, item) => sum + item.quantity, 0);
        
        if (quantityFromArtist > 0 && artistData.availableEditions < quantityFromArtist) {
            throw new Error("Not enough fractals available from the artist.");
        }

        // --- 4. EXECUTE ALL WRITES LAST ---
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
                const listingSnap = listingSnaps.get(item.listingId)!;

                if (!sellerSnap.exists()) throw new Error("Seller not found");
                if (!listingSnap.exists()) throw new Error(`Listing ${item.listingId} not found.`);
                
                const sellerData = sellerSnap.data() as User;
                const listingData = listingSnap.data() as ResaleListing;
                
                const proceeds = (item.quantity * item.price) * 0.98;
                const sellerHoldingsCount = sellerData.holdingsByArtist?.[artistId] || 0;
                
                transaction.update(sellerRef, { 
                    walletBalance: sellerData.walletBalance + proceeds,
                    [`holdingsByArtist.${artistId}`]: Math.max(0, sellerHoldingsCount - item.quantity)
                });
                
                const newQuantity = listingData.quantity - item.quantity;
                transaction.update(listingSnap.ref, {
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
        
        const artistUpdate: Record<string, any> = {};
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

  const updateFractalPriceAsAdmin = async (fractalId: string, newPrice: number) => {
    if (!isAdmin) throw new Error("Unauthorized");
    const fractalRef = doc(db, "fractals", fractalId);
    await updateDoc(fractalRef, {
        price: newPrice,
        priceHistory: arrayUnion({ date: new Date().toISOString(), price: newPrice }),
    });
    toast({ title: "Price Updated" });
  };

  const flagArtwork = async (fractalId: string, flag: boolean, reason: string) => {
      if (!isAdmin) throw new Error("Unauthorized");
      if (!db) throw new Error("Database not available.");
      
      const fractalRef = doc(db, "fractals", fractalId);
      const fractalSnap = await getDoc(fractalRef);
      if (!fractalSnap.exists()) throw new Error("Artwork not found");

      const fractalData = fractalSnap.data() as Fractal;
      const artistData = artists.find(a => a.id === fractalData.artistId);
      if (!artistData?.userId) throw new Error("Could not find artist's user account.");


      await updateDoc(fractalRef, { isFlagged: flag });

      const notificationRef = doc(firestoreCollection(db, `users/${artistData.userId}/notifications`));
      const notification: Omit<Notification, 'id'> = {
          message: reason,
          timestamp: new Date().toISOString(),
          read: false,
          type: flag ? 'artwork_flagged' : 'content_unflagged',
          relatedContent: {
              title: `Artwork: ${fractalData.title}`,
              url: `/fractal/${fractalId}`,
          }
      };
      await setDoc(notificationRef, notification);

      toast({ title: flag ? "Artwork Flagged" : "Artwork Unflagged" });
  };

  const flagArtistContent = async (artistId: string, imageUrl: string, flag: boolean, reason: string) => {
      if (!isAdmin) throw new Error("Unauthorized");
      if (!db) throw new Error("Database not available.");

      const artistRef = doc(db, "artists", artistId);
      await updateDoc(artistRef, {
          flaggedImageUrls: flag ? arrayUnion(imageUrl) : arrayRemove(imageUrl),
      });

      const artistData = (await getDoc(artistRef)).data() as Artist;
      if (!artistData.userId) throw new Error("Artist has no associated user account.");
      
      const notificationRef = doc(firestoreCollection(db, `users/${artistData.userId}/notifications`));
       const notification: Omit<Notification, 'id'> = {
          message: reason,
          timestamp: new Date().toISOString(),
          read: false,
          type: flag ? 'content_flagged' : 'content_unflagged',
          relatedContent: {
              title: `An image in your profile was ${flag ? 'flagged' : 'unflagged'}`,
              url: `/artist/${artistId}`,
          }
      };
      await setDoc(notificationRef, notification);

      toast({ title: flag ? "Image Flagged" : "Image Unflagged" });
  };
  
  const deleteArtistAchievement = async (artistId: string, type: 'award' | 'exhibition', item: Award | Exhibition) => {
    if (!isAdmin || !db) throw new Error("Unauthorized");
    const artistRef = doc(db, "artists", artistId);
    const field = type === 'award' ? 'awards' : 'exhibitions';
    try {
        await updateDoc(artistRef, {
            [field]: arrayRemove(item)
        });
        toast({ title: "Achievement Deleted", description: "The item has been removed from the artist's profile." });
    } catch(e: any) {
        throw new Error(handleAuthError(e));
    }
  };

  const updateArtworkStatus = async (fractalId: string, status: 'pending_review' | 'active' | 'private') => {
    if (!isAdmin || !db) throw new Error("Unauthorized");
    const fractalRef = doc(db, 'fractals', fractalId);
    try {
        await updateDoc(fractalRef, { status });
        toast({title: "Artwork Status Updated"});
    } catch(e: any) {
        throw new Error(handleAuthError(e));
    }
  };

  const markNotificationsAsRead = async () => {
    if (!db || !user || notifications.length === 0) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    
    const batch = writeBatch(db);
    unread.forEach(n => {
        const notifRef = doc(db, 'users', user.uid, 'notifications', n.id);
        batch.update(notifRef, { read: true });
    });
    
    try {
        await batch.commit();
    } catch (error) {
        console.error("Error marking notifications as read:", error);
    }
  };

  const deleteArtwork = async (fractalId: string, artistId: string) => {
    if (!isAdmin || !db) throw new Error("Unauthorized to delete artwork.");

    await runTransaction(db, async (transaction) => {
        const fractalRef = doc(db, "fractals", fractalId);
        const artistRef = doc(db, "artists", artistId);

        const fractalSnap = await transaction.get(fractalRef);
        if (!fractalSnap.exists()) throw new Error("Artwork not found.");
        const deletedFractal = fractalSnap.data() as Fractal;

        const artistSnap = await transaction.get(artistRef);
        if (!artistSnap.exists()) throw new Error("Artist not found.");
        const artistData = artistSnap.data() as Artist;
        
        const V_total_new = artistData.totalPortfolioValue - (deletedFractal.price || 0);
        const F_total_new = artistData.totalEditions - (deletedFractal.editions || 0);
        const P_new = F_total_new > 0 ? V_total_new / F_total_new : 0;
        const available_F_new = artistData.availableEditions - (deletedFractal.editionsAvailable || 0);
        
        transaction.update(artistRef, {
            totalPortfolioValue: V_total_new,
            totalEditions: F_total_new,
            fractalPrice: P_new,
            availableEditions: available_F_new,
            totalPortfolioValueHistory: arrayUnion({ date: new Date().toISOString(), value: V_total_new }),
            priceHistory: arrayUnion({ date: new Date().toISOString(), price: P_new }),
        });

        transaction.delete(fractalRef);
    });
  };

  const contextValue: AuthContextType = {
    user,
    artistProfile,
    allUsers,
    isLoggedIn: !!user,
    isLoading,
    isCollectionLoading,
    isArtist: !!artistProfile,
    isAdmin,
    artists,
    fractals,
    collection,
    resaleListings,
    watchlist: user?.watchlist ?? [],
    notifications,
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
    requestManualArtworkCreation,
    requestManualReevaluation,
    submitManualValuationAsAdmin,
    updateAndReevaluateArtwork,
    updateArtworkDetails,
    reevaluateArtworkForGrading,
    getCollectorsForArtist,
    updateFractalPriceAsAdmin,
    flagArtwork,
    flagArtistContent,
    markNotificationsAsRead,
    deleteArtistAchievement,
    updateArtworkStatus,
    deleteArtwork,
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

    
