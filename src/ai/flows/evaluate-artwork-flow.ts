
'use server';
/**
 * @fileOverview An artwork evaluation AI agent.
 *
 * - evaluateArtwork - A function that handles the artwork evaluation process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { type AIScorecardBreakdown } from '@/lib/data';

const rubric = [
    { id: 1, criterion: 'Artist Reputation/Notability', type: 'AI', weight: 10 },
    { id: 2, criterion: 'Awards & Exhibitions', type: 'AI', weight: 4 },
    { id: 3, criterion: 'Subject/Cultural Significance', type: 'AI', weight: 3 },
    { id: 4, criterion: 'Personal/Emotional Significance', type: 'AI', weight: 2 },
    { id: 5, criterion: 'Time Spent / Effort', type: 'AI', weight: 3 },
    { id: 6, criterion: 'Artist’s Intent/Theme', type: 'AI', weight: 2 },
    { id: 7, criterion: 'Uniqueness/Originality', type: 'AI', weight: 2 },
    { id: 8, criterion: 'Biographical/Contextual Relevance', type: 'AI', weight: 1 },
    { id: 9, criterion: 'Commission/Patronage', type: 'AI', weight: 1 },
    { id: 10, criterion: 'Title/Statement Significance', type: 'AI', weight: 1 },
    { id: 11, criterion: 'Rule-of-Thirds Alignment', type: 'AI', weight: 1 },
    { id: 12, criterion: 'Symmetry/Visual Balance', type: 'AI', weight: 1 },
    { id: 13, criterion: 'Focal Point Clarity', type: 'AI', weight: 1 },
    { id: 14, criterion: 'Leading Lines', type: 'AI', weight: 1 },
    { id: 15, criterion: 'Depth/Perspective Cues', type: 'AI', weight: 1 },
    { id: 16, criterion: 'Visual Complexity / Detail', type: 'AI', weight: 1 },
    { id: 17, criterion: 'Negative Space Utilization', type: 'AI', weight: 1 },
    { id: 18, criterion: 'Subject Scale / Proportion', type: 'AI', weight: 1 },
    { id: 19, criterion: 'Pattern/Shape Repetition', type: 'AI', weight: 1 },
    { id: 20, criterion: 'Unique Viewpoint / Angle', type: 'AI', weight: 1 },
    { id: 21, criterion: 'Color Harmony', type: 'AI', weight: 0.5 },
    { id: 22, criterion: 'Dominant Hue Proportion', type: 'AI', weight: 0.5 },
    { id: 23, criterion: 'Color Saturation', type: 'AI', weight: 0.5 },
    { id: 24, criterion: 'Luminance Contrast', type: 'AI', weight: 0.5 },
    { id: 25, criterion: 'Brightness Distribution', type: 'AI', weight: 0.5 },
    { id: 26, criterion: 'Warm/Cool Color Balance', type: 'AI', weight: 0.5 },
    { id: 27, criterion: 'Color Variety', type: 'AI', weight: 0.5 },
    { id: 28, criterion: 'Hue Distribution Uniformity', type: 'AI', weight: 0.5 },
    { id: 29, criterion: 'Tone Distribution', type: 'AI', weight: 0.5 },
    { id: 30, criterion: 'Exposure Quality', type: 'AI', weight: 0.5 },
    { id: 31, criterion: 'Brushstroke Texture (Surface Topography)', type: 'AI', weight: 1 },
    { id: 32, criterion: 'Stroke Direction Consistency', type: 'AI', weight: 1 },
    { id: 33, criterion: 'Edge Neatness / Line Precision', type: 'AI', weight: 1 },
    { id: 34, criterion: 'Gradient Smoothness', type: 'AI', weight: 1 },
    { id: 35, criterion: 'Stroke Thickness Uniformity', type: 'AI', weight: 1 },
    { id: 36, criterion: 'Fine Detail Clarity', type: 'AI', weight: 1 },
    { id: 37, criterion: 'Smudge/Blur Detection', type: 'AI', weight: 1 },
    { id: 38, criterion: 'Paint Drip/Run Detection', type: 'AI', weight: 1 },
    { id: 39, criterion: 'Overpaint/Correction Marks', type: 'AI', weight: 1 },
    { id: 40, criterion: 'Surface Relief / Impasto Presence', type: 'AI', weight: 1 },
    { id: 41, criterion: 'Impasto Uniformity', type: 'AI', weight: 1 },
    { id: 42, criterion: 'Finishing Style (Matte vs Gloss)', type: 'AI', weight: 1 },
    { id: 43, criterion: 'Blending Quality', type: 'AI', weight: 1 },
    { id: 44, criterion: 'Medium Identification', type: 'AI', weight: 1 },
    { id: 45, criterion: 'Brush vs Pen Stroke Identification', type: 'AI', weight: 1 },
    { id: 46, criterion: 'Substrate/Support Type', type: 'AI', weight: 1 },
    { id: 47, criterion: 'Canvas Weave Clarity', type: 'AI', weight: 0.5 },
    { id: 48, criterion: 'Wood Grain Visibility', type: 'AI', weight: 0.5 },
    { id: 49, criterion: 'Frame Presence & Quality', type: 'AI', weight: 0.5 },
    { id: 50, criterion: 'Frame Condition', type: 'AI', weight: 0.5 },
    { id: 51, criterion: 'Patina/Finish Consistency (Metal)', type: 'AI', weight: 0.5 },
    { id: 52, criterion: 'Pigment Granularity', type: 'AI', weight: 0.5 },
    { id: 53, criterion: 'Adhesive/Joints (Collage/Sculpture)', type: 'AI', weight: 0.5 },
    { id: 54, criterion: 'Foundry/Casting Marks', type: 'AI', weight: 1 },
    { id: 55, criterion: 'Joint Seams (Sculptures)', type: 'AI', weight: 0.5 },
    { id: 56, criterion: 'Signature Presence', type: 'AI', weight: 2 },
    { id: 57, criterion: 'Signature Style Match', type: 'AI', weight: 1 },
    { id: 58, criterion: 'Date/Inscription Consistency', type: 'AI', weight: 1 },
    { id: 59, criterion: 'Certificate Authenticity', type: 'AI', weight: 1 },
    { id: 60, criterion: 'Provenance/Label Detection', type: 'AI', weight: 1 },
    { id: 61, criterion: 'Edition/Serial Number', type: 'AI', weight: 1 },
    { id: 62, criterion: 'Watermark (Paper)', type: 'AI', weight: 1 },
    { id: 63, criterion: 'Gallery/Museum Stamps', type: 'AI', weight: 1 },
    { id: 64, criterion: 'Style Consistency', type: 'AI', weight: 1 },
    { id: 65, criterion: 'Forgery Artifact Detection', type: 'AI', weight: 1 },
    { id: 66, criterion: 'Artist’s Monogram or Mark', type: 'AI', weight: 1 },
    { id: 67, criterion: 'Hidden/Underpainting Signature', type: 'AI', weight: 1 },
    { id: 68, criterion: 'Inventory/Accession Number', type: 'AI', weight: 1 },
    { id: 69, criterion: 'Digital/QR Authentication', type: 'AI', weight: 1 },
    { id: 70, criterion: 'Craquelure (Fine Cracks)', type: 'AI', weight: 1 },
    { id: 71, criterion: 'Large Splits/Cracks', type: 'AI', weight: 1 },
    { id: 72, criterion: 'Paint Loss / Bare Areas', type: 'AI', weight: 1 },
    { id: 73, criterion: 'Paint Flaking', type: 'AI', weight: 0.5 },
    { id: 74, criterion: 'Fading / Color Discoloration', type: 'AI', weight: 0.5 },
    { id: 75, criterion: 'Stains / Dirt Spots', type: 'AI', weight: 0.5 },
    { id: 76, criterion: 'Tears / Holes', type: 'AI', weight: 1 },
    { id: 77, criterion: 'Edge/Corner Damage', type: 'AI', weight: 0.5 },
    { id: 78, criterion: 'Surface Grime or Yellowed Varnish', type: 'AI', weight: 0.5 },
    { id: 79, criterion: 'Warping / Bulging', type: 'AI', weight: 1 },
    { id: 80, criterion: 'Missing Sculpture Parts', type: 'AI', weight: 1 },
    { id: 81, criterion: 'Rust / Metal Corrosion', type: 'AI', weight: 1 },
    { id: 82, criterion: 'Mold / Mildew', type: 'AI', weight: 1 },
    { id: 83, criterion: 'Water Damage / Blistering', type: 'AI', weight: 1 },
    { id: 84, criterion: 'Varnish Cracking', type: 'AI', weight: 0.5 },
    { id: 85, criterion: 'Over-Cleaning Damage', type: 'AI', weight: 0.5 },
    { id: 86, criterion: 'Foxing / Age Spots', type: 'AI', weight: 0.5 },
    { id: 87, criterion: 'Frame or Mount Damage', type: 'AI', weight: 0.5 },
    { id: 88, criterion: 'Sunlight Bleaching', type: 'AI', weight: 0.5 },
    { id: 89, criterion: 'Surface Abrasion / Scratches', type: 'AI', weight: 0.5 },
    { id: 90, criterion: 'Canvas/Panel Distortion', type: 'AI', weight: 0.5 },
    { id: 91, criterion: 'Underpainting / Pentimenti Visible', type: 'AI', weight: 0.5 },
    { id: 92, criterion: 'Lining or Patch Evidence', type: 'AI', weight: 0.5 },
    { id: 93, criterion: 'Insect/Animal Damage', type: 'AI', weight: 0.5 },
    { id: 94, criterion: 'Salt Efflorescence', type: 'AI', weight: 0.5 },
    { id: 95, criterion: 'Uneven Tint / Discoloration', type: 'AI', weight: 0.5 },
    { id: 96, criterion: 'UV Fluorescence Anomalies', type: 'AI', weight: 0.5 },
    { id: 97, criterion: 'Paint Bleed (Water Runs)', type: 'AI', weight: 0.5 },
    { id: 98, criterion: 'Loose/Flaking Paint', type: 'AI', weight: 0.5 },
    { id: 99, criterion: 'Pigment Blooming', type: 'AI', weight: 0.5 },
    { id: 100, criterion: 'Residue / Tape Marks', type: 'AI', weight: 0.5 },
];

const EvaluateArtworkInputSchema = z.object({
  photoDataUri: z.string().describe(
    "A photo of the artwork, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  title: z.string(),
  description: z.string(),
  subjectSignificance: z.string().optional(),
  personalSignificance: z.string().optional(),
  timeEffort: z.string().optional(),
  biographicalContext: z.string().optional(),
  commissionPatronage: z.string().optional(),
  artistBio: z.string(),
  awardsAndExhibitions: z.string().optional(),
});


const AiCriterionScoreSchema = z.object({
  id: z.number().describe('The ID of the criterion from the rubric (e.g., 11 for Rule-of-Thirds).'),
  score: z.number().min(0).max(10).describe('The score assigned by the AI for this criterion (0-10).'),
});

const ArtworkAnalysisSchema = z.object({
    scores: z.array(AiCriterionScoreSchema).describe('An array of scores for each AI-evaluated criterion.'),
});

interface EvaluateArtworkOutput {
    finalScore: number;
    grade: 'AAA' | 'AA' | 'A+' | 'A' | 'A-';
    breakdown: AIScorecardBreakdown[];
}

export async function evaluateArtwork(
  input: z.infer<typeof EvaluateArtworkInputSchema>
): Promise<EvaluateArtworkOutput> {
  return evaluateArtworkFlow(input);
}

const evaluationPrompt = ai.definePrompt({
  name: 'evaluateArtworkPrompt',
  input: {schema: EvaluateArtworkInputSchema},
  output: {schema: ArtworkAnalysisSchema},
  prompt: `You are an expert art evaluator and appraiser with deep knowledge of art history, composition, and materials science. Your task is to analyze the provided artwork image and associated context, then score it based on a comprehensive 100-point rubric.

You must provide a score from 0 to 10 for every single criterion marked with type "AI" in the rubric below.

**Evaluation Instructions:**
1.  **Image-Based Criteria:** For criteria related to composition, color, texture, technique, condition, and material, your primary source is the artwork image.
2.  **Context-Based Criteria:** For criteria related to the artist and the artwork's narrative, you must evaluate the provided text. Score based on the quality, credibility, and relevance of the information in relation to the artwork image. For example, a high score for "Artist's Intent" requires a compelling statement that is clearly reflected in the visual work.
3.  **Inferred Criteria:** For criteria like "Artist Reputation" and "Uniqueness", synthesize information from the artist's bio, awards, and the artwork itself to make an expert judgment.

**Evaluation Rubric:**
(You will score ALL items with Type='AI')
${rubric.map(item => `| ${item.id} | ${item.criterion} | ${item.type} | ${item.weight}% |`).join('\n')}

---
**CONTEXT FOR EVALUATION**

**Artwork Information:**
- Title: {{{title}}}
- Description (Artist's Intent/Theme): {{{description}}}
- Subject/Cultural Significance Statement: {{{subjectSignificance}}}
- Personal/Emotional Significance Statement: {{{personalSignificance}}}
- Time Spent / Effort Statement: {{{timeEffort}}}
- Biographical/Contextual Relevance Statement: {{{biographicalContext}}}
- Commission/Patronage Statement: {{{commissionPatronage}}}

**Artist Information:**
- Artist Bio: {{{artistBio}}}
- Artist Awards & Exhibitions: {{{awardsAndExhibitions}}}

---
**ARTWORK TO ANALYZE**
{{media url=photoDataUri}}

---
Please analyze the artwork and context, then return your scores for all AI criteria.
`,
});

const evaluateArtworkFlow = ai.defineFlow(
  {
    name: 'evaluateArtworkFlow',
    inputSchema: EvaluateArtworkInputSchema,
    outputSchema: z.any(), // Output is manually constructed
  },
  async (input): Promise<EvaluateArtworkOutput> => {
    const { output } = await evaluationPrompt(input);
    if (!output) {
      throw new Error("AI analysis failed to return scores.");
    }
    
    const breakdown: AIScorecardBreakdown[] = [];
    let totalWeightedScore = 0;
    let totalPossibleWeight = 0;

    const aiScores = new Map(output.scores.map(item => [item.id, item.score]));

    rubric.forEach(item => {
        if (item.type === 'AI') {
            const score = aiScores.get(item.id);
            totalPossibleWeight += item.weight;
            if (score !== undefined) {
                // Normalize score to 0-1 and multiply by its weight percentage.
                const weightedScore = (score / 10) * item.weight;
                totalWeightedScore += weightedScore;
                breakdown.push({
                    id: item.id,
                    criterion: item.criterion,
                    score: score,
                    weight: item.weight,
                    weightedScore: weightedScore
                });
            }
        }
    });

    const finalScore = totalPossibleWeight > 0 ? Math.round((totalWeightedScore / totalPossibleWeight) * 100) : 0;

    let grade: 'AAA' | 'AA' | 'A+' | 'A' | 'A-';
    if (finalScore > 80) grade = 'AAA';
    else if (finalScore > 60) grade = 'AA';
    else if (finalScore > 40) grade = 'A+';
    else if (finalScore > 20) grade = 'A';
    else grade = 'A-';
    
    return { finalScore, grade, breakdown };
  }
);
