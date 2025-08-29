
// This file is marked as `server-only` to ensure it's never bundled on the client.
import 'server-only';

import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { artists as mockArtists, fractals as mockFractals, type Artist, type Fractal } from '@/lib/data';

function sanitizeArtist(artist: Artist, allFractals: Fractal[]): Artist {
  const artistFractals = allFractals.filter(f => f.artistId === artist.id && f.status === 'active');
  const totalPortfolioValue = artistFractals.reduce((sum, f) => sum + f.price, 0);
  const totalEditions = artistFractals.reduce((sum, f) => sum + (f.editions || 0), 0);
  const fractalPrice = totalEditions > 0 ? totalPortfolioValue / totalEditions : 0;
  
  return {
    ...artist,
    totalPortfolioValue,
    totalEditions: Number(artist.totalEditions || 0),
    availableEditions: Number(artist.availableEditions || 0),
    fractalPrice,
  };
}

// Helper function to safely get data from a collection. It returns an empty array on failure.
async function getDataFromCollection<T>(collectionName: string): Promise<T[]> {
  if (!db) {
    console.warn(`Firebase not configured. Cannot fetch ${collectionName}. Returning static mock data.`);
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
  const allFractals = await getInitialFractals();
  
  // Start with the static mock data as the base
  const combined = [...mockArtists];
  const existingMockIds = new Set(mockArtists.map(a => a.id));

  // Add artists from the database, but only if they don't have a mock ID
  for (const dbArtist of artistsFromDb) {
    if (!existingMockIds.has(dbArtist.id)) {
      combined.push(dbArtist);
    }
  }

  return combined.map(artist => sanitizeArtist(artist, allFractals));
}

export async function getInitialFractals(): Promise<Fractal[]> {
  const fractalsFromDb = await getDataFromCollection<Fractal>('fractals');
  
  // Start with the static mock data as the base
  const combined = [...mockFractals];
  const existingMockIds = new Set(mockFractals.map(f => f.id));

  // Add fractals from the database, but only if they don't have a mock ID
  for (const dbFractal of fractalsFromDb) {
    if (!existingMockIds.has(dbFractal.id)) {
      combined.push(dbFractal);
    }
  }

  return combined;
}
