'use server';

import { generateArtworkSuggestions } from "@/ai/flows/generate-artwork-suggestions";
import { fractals } from "@/lib/data";

export async function getArtworkSuggestions() {
  try {
    const mockViewingHistory = ['fractal-001', 'fractal-003', 'fractal-008'];
    const mockSavedCollections = ['fractal-005'];

    const result = await generateArtworkSuggestions({
      viewingHistory: mockViewingHistory,
      savedCollections: mockSavedCollections,
    });
    
    const newSuggestions = result.suggestions.filter(
        id => !mockViewingHistory.includes(id) && !mockSavedCollections.includes(id)
    );
    
    const suggestedFractals = fractals.filter(f => newSuggestions.includes(f.id));
    
    while (suggestedFractals.length < 4 && fractals.length > suggestedFractals.length) {
        const randomFractal = fractals[Math.floor(Math.random() * fractals.length)];
        if (!suggestedFractals.find(f => f.id === randomFractal.id) && !newSuggestions.includes(randomFractal.id) && !mockViewingHistory.includes(randomFractal.id) && !mockSavedCollections.includes(randomFractal.id)) {
            suggestedFractals.push(randomFractal);
        }
    }

    return { success: true, suggestions: suggestedFractals.slice(0, 4) };

  } catch (error) {
    console.error("Error generating artwork suggestions:", error);
    return { success: false, error: "Failed to generate suggestions. Please try again." };
  }
}
