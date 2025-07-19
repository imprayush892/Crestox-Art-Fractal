
// This file is marked as `server-only` to ensure it's never bundled on the client.
import 'server-only';

import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { artists as mockArtists, fractals as mockFractals, type Artist, type Fractal } from '@/lib/data';

function sanitizeArtist(artist: Artist): Artist {
  return {
    ...artist,
    totalEditions: Number(artist.totalEditions || 0),
    availableEditions: Number(artist.availableEditions || 0),
  };
}

// Helper function to safely get data from a collection. It returns an empty array on failure.
async function getDataFromCollection<T>(collectionName: string): Promise<T[]> {
  if (!db) {
    console.warn(`Firebase not configured. Cannot fetch ${collectionName}.`);
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
  } catch (error) {
    console.error(`Error fetching ${collectionName} from Firestore. Returning empty array.`, error);
    return [];
  }
}

export async function getInitialArtists(): Promise<Artist[]> {
  const artistsFromDb = await getDataFromCollection<Artist>('artists');
  
  const combined = [...artistsFromDb];
  const existingIds = new Set(artistsFromDb.map(a => a.id));

  // Merge with mock data, avoiding duplicates
  for (const mockArtist of mockArtists) {
    if (!existingIds.has(mockArtist.id)) {
      combined.push(mockArtist);
    }
  }

  return combined.map(sanitizeArtist);
}

export async function getInitialFractals(): Promise<Fractal[]> {
  const fractalsFromDb = await getDataFromCollection<Fractal>('fractals');
  
  const combined = [...fractalsFromDb];
  const existingIds = new Set(fractalsFromDb.map(f => f.id));

  // Merge with mock data, avoiding duplicates
  for (const mockFractal of mockFractals) {
    if (!existingIds.has(mockFractal.id)) {
      combined.push(mockFractal);
    }
  }

  return combined;
}

    