'use server';

/**
 * @fileOverview A fractal artwork suggestion AI agent.
 *
 * - generateArtworkSuggestions - A function that handles the fractal artwork suggestion process.
 * - GenerateArtworkSuggestionsInput - The input type for the generateArtworkSuggestions function.
 * - GenerateArtworkSuggestionsOutput - The return type for the generateArtworkSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateArtworkSuggestionsInputSchema = z.object({
  viewingHistory: z
    .array(z.string())
    .describe('The list of fractal artwork IDs the collector has viewed.'),
  savedCollections: z
    .array(z.string())
    .describe('The list of fractal artwork IDs the collector has saved.'),
});
type GenerateArtworkSuggestionsInput = z.infer<
  typeof GenerateArtworkSuggestionsInputSchema
>;

const GenerateArtworkSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe(
      'The list of suggested fractal artwork IDs based on the collector viewing history and saved collections.'
    ),
});
type GenerateArtworkSuggestionsOutput = z.infer<
  typeof GenerateArtworkSuggestionsOutputSchema
>;

export async function generateArtworkSuggestions(
  input: GenerateArtworkSuggestionsInput
): Promise<GenerateArtworkSuggestionsOutput> {
  return generateArtworkSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateArtworkSuggestionsPrompt',
  input: {schema: GenerateArtworkSuggestionsInputSchema},
  output: {schema: GenerateArtworkSuggestionsOutputSchema},
  prompt: `You are an expert art curator specializing in fractal artwork.

You will use the collector's viewing history and saved collections to suggest new fractals they might like.

Provide a list of fractal artwork IDs in the suggestions field.

Viewing History: {{{viewingHistory}}}
Saved Collections: {{{savedCollections}}}`,
});

const generateArtworkSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateArtworkSuggestionsFlow',
    inputSchema: GenerateArtworkSuggestionsInputSchema,
    outputSchema: GenerateArtworkSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
