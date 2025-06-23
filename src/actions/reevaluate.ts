
'use server';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Artist, Fractal, AIScorecardBreakdown } from '@/lib/data';
import { evaluateArtwork } from '@/ai/flows/evaluate-artwork-flow';

export interface ReevaluationResult {
    finalScore: number;
    grade: 'AAA' | 'AA' | 'A+' | 'A' | 'A-';
    breakdown: AIScorecardBreakdown[];
    crestoxPriceRange: [number, number];
}

export async function reevaluateArtworkForGrading(artworkId: string): Promise<ReevaluationResult> {
    if (!db) {
        throw new Error("Firebase is not connected. Re-evaluation is not possible.");
    }
    
    const fractalRef = doc(db, 'fractals', artworkId);
    const fractalDoc = await getDoc(fractalRef);

    if (!fractalDoc.exists()) {
        throw new Error("Artwork not found.");
    }
    const fractalData = fractalDoc.data() as Fractal;

    const artistRef = doc(db, 'artists', fractalData.artistId);
    const artistDoc = await getDoc(artistRef);

    if (!artistDoc.exists()) {
        throw new Error("Artist not found.");
    }
    const artistData = artistDoc.data() as Artist;
    
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
