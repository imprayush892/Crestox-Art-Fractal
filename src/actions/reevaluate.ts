
'use server';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { artists as mockArtists, fractals as mockFractals, type Artist, type Fractal, type AIScorecardBreakdown } from '@/lib/data';
import { evaluateArtwork } from '@/ai/flows/evaluate-artwork-flow';

export interface ReevaluationResult {
    finalScore: number;
    grade: 'AAA' | 'AA' | 'A+' | 'A' | 'A-';
    breakdown: AIScorecardBreakdown[];
    crestoxPriceRange: [number, number];
}

export async function reevaluateArtworkForGrading(artworkId: string): Promise<ReevaluationResult> {
    
    let fractalData: Fractal | undefined;
    let artistData: Artist | undefined;

    if (!db) {
        console.warn("Firebase not configured. Simulating re-evaluation locally.");
        fractalData = mockFractals.find(f => f.id === artworkId);
        if (fractalData) {
            artistData = mockArtists.find(a => a.id === fractalData!.artistId);
        }
    } else {
        const fractalRef = doc(db, 'fractals', artworkId);
        const fractalDoc = await getDoc(fractalRef);
        if (fractalDoc.exists()) {
            fractalData = fractalDoc.data() as Fractal;
            const artistRef = doc(db, 'artists', fractalData.artistId);
            const artistDoc = await getDoc(artistRef);
            if (artistDoc.exists()) {
                artistData = artistDoc.data() as Artist;
            }
        }
    }

    if (!fractalData) {
        throw new Error("Artwork not found.");
    }
    if (!artistData) {
        throw new Error("Artist not found for the given artwork.");
    }
    
    const evaluationInput = {
        photoDataUri: fractalData.image,
        title: fractalData.title,
        description: fractalData.description,
        materials: fractalData.materials,
        artworkSize: fractalData.artworkSize,
        minEstimatedValue: fractalData.price * 0.8,
        maxEstimatedValue: fractalData.price * 1.2,
        artistBio: artistData.bio,
        awardsAndExhibitions: artistData.awardsAndExhibitions,
    };

    const result = await evaluateArtwork(evaluationInput);

    return result;
}
