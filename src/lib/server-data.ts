
// This file is marked as `server-only` to ensure it's never bundled on the client.
import 'server-only';

import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { artists as mockArtists, fractals as mockFractals, type Artist, type Fractal } from '@/lib/data';

// Helper function to safely get data from a collection.
async function getDataFromCollection<T>(collectionName: string, fallbackData: T[]): Promise<T[]> {
  // If db is null, it means Firebase is not configured or failed to initialize.
  if (!db) {
    console.log("Firebase not configured. Using mock data.");
    return fallbackData;
  }

  try {
    const snapshot = await getDocs(collection(db, collectionName));
    if (snapshot.empty) {
      console.log(`${collectionName} collection is empty in Firestore. Using mock data.`);
      return fallbackData;
    }
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
  } catch (error) {
    console.error(`Error fetching ${collectionName} from Firestore. Falling back to mock data.`, error);
    return fallbackData;
  }
}

export async function getInitialArtists(): Promise<Artist[]> {
  return getDataFromCollection<Artist>('artists', mockArtists);
}

export async function getInitialFractals(): Promise<Fractal[]> {
  return getDataFromCollection<Fractal>('fractals', mockFractals);
}
