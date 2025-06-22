'use server';
/**
 * @fileOverview An artwork evaluation AI agent.
 *
 * - evaluateArtwork - A function that handles the artwork evaluation process.
 * - EvaluateArtworkInput - The input type for the evaluateArtwork function.
 * - EvaluateArtworkOutput - The return type for the evaluateArtwork function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateArtworkInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the artwork, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EvaluateArtworkInput = z.infer<typeof EvaluateArtworkInputSchema>;

const EvaluateArtworkOutputSchema = z.object({
  finalScore: z
    .number()
    .describe('The final weighted score of the artwork from 0 to 100.'),
  grade: z
    .enum(['AAA', 'AA', 'A+', 'A', 'A-'])
    .describe('The final grade assigned to the artwork.'),
});
export type EvaluateArtworkOutput = z.infer<typeof EvaluateArtworkOutputSchema>;

export async function evaluateArtwork(
  input: EvaluateArtworkInput
): Promise<EvaluateArtworkOutput> {
  return evaluateArtworkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateArtworkPrompt',
  input: {schema: EvaluateArtworkInputSchema},
  output: {schema: EvaluateArtworkOutputSchema},
  prompt: `You are an expert art evaluator with deep knowledge of art history, composition, and materials science. Your task is to analyze the provided artwork image and score it based on a comprehensive 100-point rubric.

You must only evaluate the criteria marked as "AI". For each AI criterion, provide a score from 0 to 10. You must then calculate the final weighted score by multiplying each criterion's score by its weight and summing the results. Based on the final weighted score, assign a grade.

**Evaluation Rubric:**

| # | Criterion | Type | Weight (%) |
|---|---|---|---:|
| 1 | Artist Reputation/Notability | Manual | 10 |
| 2 | Awards & Exhibitions | Manual | 4 |
| 3 | Subject/Cultural Significance | Manual | 3 |
| 4 | Personal/Emotional Significance | Manual | 2 |
| 5 | Time Spent / Effort | Manual | 3 |
| 6 | Artist’s Intent/Theme | Manual | 2 |
| 7 | Uniqueness/Originality | Manual | 2 |
| 8 | Biographical/Contextual Relevance | Manual | 1 |
| 9 | Commission/Patronage | Manual | 1 |
| 10 | Title/Statement Significance | Manual | 1 |
| 11 | Rule-of-Thirds Alignment | AI | 1 |
| 12 | Symmetry/Visual Balance | AI | 1 |
| 13 | Focal Point Clarity | AI | 1 |
| 14 | Leading Lines | AI | 1 |
| 15 | Depth/Perspective Cues | AI | 1 |
| 16 | Visual Complexity / Detail | AI | 1 |
| 17 | Negative Space Utilization | AI | 1 |
| 18 | Subject Scale / Proportion | AI | 1 |
| 19 | Pattern/Shape Repetition | AI | 1 |
| 20 | Unique Viewpoint / Angle | AI | 1 |
| 21 | Color Harmony | AI | 0.5 |
| 22 | Dominant Hue Proportion | AI | 0.5 |
| 23 | Color Saturation | AI | 0.5 |
| 24 | Luminance Contrast | AI | 0.5 |
| 25 | Brightness Distribution | AI | 0.5 |
| 26 | Warm/Cool Color Balance | AI | 0.5 |
| 27 | Color Variety | AI | 0.5 |
| 28 | Hue Distribution Uniformity | AI | 0.5 |
| 29 | Tone Distribution | AI | 0.5 |
| 30 | Exposure Quality | AI | 0.5 |
| 31 | Brushstroke Texture (Surface Topography) | AI | 1 |
| 32 | Stroke Direction Consistency | AI | 1 |
| 33 | Edge Neatness / Line Precision | AI | 1 |
| 34 | Gradient Smoothness | AI | 1 |
| 35 | Stroke Thickness Uniformity | AI | 1 |
| 36 | Fine Detail Clarity | AI | 1 |
| 37 | Smudge/Blur Detection | AI | 1 |
| 38 | Paint Drip/Run Detection | AI | 1 |
| 39 | Overpaint/Correction Marks | AI | 1 |
| 40 | Surface Relief / Impasto Presence | AI | 1 |
| 41 | Impasto Uniformity | AI | 1 |
| 42 | Finishing Style (Matte vs Gloss) | AI | 1 |
| 43 | Blending Quality | AI | 1 |
| 44 | Medium Identification | AI | 1 |
| 45 | Brush vs Pen Stroke Identification | AI | 1 |
| 46 | Substrate/Support Type | AI | 1 |
| 47 | Canvas Weave Clarity | AI | 0.5 |
| 48 | Wood Grain Visibility | AI | 0.5 |
| 49 | Frame Presence & Quality | AI | 0.5 |
| 50 | Frame Condition | AI | 0.5 |
| 51 | Patina/Finish Consistency (Metal) | AI | 0.5 |
| 52 | Pigment Granularity | AI | 0.5 |
| 53 | Adhesive/Joints (Collage/Sculpture) | AI | 0.5 |
| 54 | Foundry/Casting Marks | AI | 1 |
| 55 | Joint Seams (Sculptures) | AI | 0.5 |
| 56 | Signature Presence | AI | 2 |
| 57 | Signature Style Match | AI | 1 |
| 58 | Date/Inscription Consistency | AI | 1 |
| 59 | Certificate Authenticity | AI | 1 |
| 60 | Provenance/Label Detection | AI | 1 |
| 61 | Edition/Serial Number | AI | 1 |
| 62 | Watermark (Paper) | AI | 1 |
| 63 | Gallery/Museum Stamps | AI | 1 |
| 64 | Style Consistency | AI | 1 |
| 65 | Forgery Artifact Detection | AI | 1 |
| 66 | Artist’s Monogram or Mark | AI | 1 |
| 67 | Hidden/Underpainting Signature | AI | 1 |
| 68 | Inventory/Accession Number | AI | 1 |
| 69 | Digital/QR Authentication | AI | 1 |
| 70 | Craquelure (Fine Cracks) | AI | 1 |
| 71 | Large Splits/Cracks | AI | 1 |
| 72 | Paint Loss / Bare Areas | AI | 1 |
| 73 | Paint Flaking | AI | 0.5 |
| 74 | Fading / Color Discoloration | AI | 0.5 |
| 75 | Stains / Dirt Spots | AI | 0.5 |
| 76 | Tears / Holes | AI | 1 |
| 77 | Edge/Corner Damage | AI | 0.5 |
| 78 | Surface Grime or Yellowed Varnish | AI | 0.5 |
| 79 | Warping / Bulging | AI | 1 |
| 80 | Missing Sculpture Parts | AI | 1 |
| 81 | Rust / Metal Corrosion | AI | 1 |
| 82 | Mold / Mildew | AI | 1 |
| 83 | Water Damage / Blistering | AI | 1 |
| 84 | Varnish Cracking | AI | 0.5 |
| 85 | Over-Cleaning Damage | AI | 0.5 |
| 86 | Foxing / Age Spots | AI | 0.5 |
| 87 | Frame or Mount Damage | AI | 0.5 |
| 88 | Sunlight Bleaching | AI | 0.5 |
| 89 | Surface Abrasion / Scratches | AI | 0.5 |
| 90 | Canvas/Panel Distortion | AI | 0.5 |
| 91 | Underpainting / Pentimenti Visible | AI | 0.5 |
| 92 | Lining or Patch Evidence | AI | 0.5 |
| 93 | Insect/Animal Damage | AI | 0.5 |
| 94 | Salt Efflorescence | AI | 0.5 |
| 95 | Uneven Tint / Discoloration | AI | 0.5 |
| 96 | UV Fluorescence Anomalies | AI | 0.5 |
| 97 | Paint Bleed (Water Runs) | AI | 0.5 |
| 98 | Loose/Flaking Paint | AI | 0.5 |
| 99 | Pigment Blooming | AI | 0.5 |
| 100 | Residue / Tape Marks | AI | 0.5 |

**Grading Scale:**
- 81-100: AAA
- 61-80: AA
- 41-60: A+
- 21-40: A
- 0-20: A-

Please analyze the following artwork and provide the final calculated score and grade.

Artwork to analyze: {{media url=photoDataUri}}
`,
});

const evaluateArtworkFlow = ai.defineFlow(
  {
    name: 'evaluateArtworkFlow',
    inputSchema: EvaluateArtworkInputSchema,
    outputSchema: EvaluateArtworkOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
