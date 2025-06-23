
'use server';

import type { Artist, Fractal, AIScorecardBreakdown } from '@/lib/data';
import { evaluateArtwork } from '@/ai/flows/evaluate-artwork-flow';

export interface ReevaluationResult {
    finalScore: number;
    grade: 'AAA' | 'AA' | 'A+' | 'A' | 'A-';
    breakdown: AIScorecardBreakdown[];
    crestoxPriceRange: [number, number];
}

export async function reevaluateArtworkForGrading(fractalData: Fractal, artistData: Artist): Promise<ReevaluationResult> {
    
    if (!fractalData) {
        throw new Error("Artwork data was not provided for re-evaluation.");
    }
    if (!artistData) {
        throw new Error("Artist data was not provided for re-evaluation.");
    }
    
    const evaluationInput = {
        photoDataUri: fractalData.image,
        title: fractalData.title,
        description: fractalData.description,
        materials: fractalData.materials,
        artworkSize: fractalData.artworkSize,
        minEstimatedValue: fractalData.artistMinEstimate || 0,
        maxEstimatedValue: fractalData.artistMaxEstimate || 1,
        artistBio: artistData.bio,
        awardsAndExhibitions: artistData.awardsAndExhibitions,
    };

    const result = await evaluateArtwork(evaluationInput);

    return result;
}
