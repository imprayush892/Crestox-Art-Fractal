
'use server';
/**
 * @fileOverview An artwork evaluation AI agent.
 *
 * - evaluateArtwork - A function that handles the artwork evaluation process.
 */

import {ai, isAiConfigured} from '@/ai/genkit';
import {z} from 'zod';
import { type AIScorecardBreakdown } from '@/lib/data';

/**
 * ArtScoreChecklist
 * This constant contains the full 100-point evaluation rubric for artworks.
 * It is a critical part of the platform's evaluation system and should not be
 * modified without explicit instruction.
 */
const ArtScoreChecklist = [
    {"id": 1, "criterion": "Artist Reputation/Notability", "type": "AI", "weight": 10},
    {"id": 2, "criterion": "Awards & Exhibitions", "type": "AI", "weight": 4},
    {"id": 3, "criterion": "Subject/Cultural Significance", "type": "AI", "weight": 3},
    {"id": 4, "criterion": "Personal/Emotional Significance", "type": "AI", "weight": 2},
    {"id": 5, "criterion": "Time Spent / Effort", "type": "AI", "weight": 3},
    {"id": 6, "criterion": "Artist’s Intent/Theme", "type": "AI", "weight": 2},
    {"id": 7, "criterion": "Uniqueness/Originality", "type": "AI", "weight": 2},
    {"id": 8, "criterion": "Biographical/Contextual Relevance", "type": "AI", "weight": 1},
    {"id": 9, "criterion": "Commission/Patronage", "type": "AI", "weight": 1},
    {"id": 10, "criterion": "Title/Statement Significance", "type": "AI", "weight": 1},
    {"id": 11, "criterion": "Rule-of-Thirds Alignment", "type": "AI", "weight": 1},
    {"id": 12, "criterion": "Symmetry/Visual Balance", "type": "AI", "weight": 1},
    {"id": 13, "criterion": "Focal Point Clarity", "type": "AI", "weight": 1},
    {"id": 14, "criterion": "Leading Lines", "type": "AI", "weight": 1},
    {"id": 15, "criterion": "Depth/Perspective Cues", "type": "AI", "weight": 1},
    {"id": 16, "criterion": "Visual Complexity / Detail", "type": "AI", "weight": 1},
    {"id": 17, "criterion": "Negative Space Utilization", "type": "AI", "weight": 1},
    {"id": 18, "criterion": "Subject Scale / Proportion", "type": "AI", "weight": 1},
    {"id": 19, "criterion": "Pattern/Shape Repetition", "type": "AI", "weight": 1},
    {"id": 20, "criterion": "Unique Viewpoint / Angle", "type": "AI", "weight": 1},
    {"id": 21, "criterion": "Color Harmony", "type": "AI", "weight": 0.5},
    {"id": 22, "criterion": "Dominant Hue Proportion", "type": "AI", "weight": 0.5},
    {"id": 23, "criterion": "Color Saturation", "type": "AI", "weight": 0.5},
    {"id": 24, "criterion": "Luminance Contrast", "type": "AI", "weight": 0.5},
    {"id": 25, "criterion": "Brightness Distribution", "type": "AI", "weight": 0.5},
    {"id": 26, "criterion": "Warm/Cool Color Balance", "type": "AI", "weight": 0.5},
    {"id": 27, "criterion": "Color Variety", "type": "AI", "weight": 0.5},
    {"id": 28, "criterion": "Hue Distribution Uniformity", "type": "AI", "weight": 0.5},
    {"id": 29, "criterion": "Tone Distribution", "type": "AI", "weight": 0.5},
    {"id": 30, "criterion": "Exposure Quality", "type": "AI", "weight": 0.5},
    {"id": 31, "criterion": "Brushstroke Texture (Surface Topography)", "type": "AI", "weight": 1},
    {"id": 32, "criterion": "Stroke Direction Consistency", "type": "AI", "weight": 1},
    {"id": 33, "criterion": "Edge Neatness / Line Precision", "type": "AI", "weight": 1},
    {"id": 34, "criterion": "Gradient Smoothness", "type": "AI", "weight": 1},
    {"id": 35, "criterion": "Stroke Thickness Uniformity", "type": "AI", "weight": 1},
    {"id": 36, "criterion": "Fine Detail Clarity", "type": "AI", "weight": 1},
    {"id": 37, "criterion": "Smudge/Blur Detection", "type": "AI", "weight": 1},
    {"id": 38, "criterion": "Paint Drip/Run Detection", "type": "AI", "weight": 1},
    {"id": 39, "criterion": "Overpaint/Correction Marks", "type": "AI", "weight": 1},
    {"id": 40, "criterion": "Surface Relief / Impasto Presence", "type": "AI", "weight": 1},
    {"id": 41, "criterion": "Impasto Uniformity", "type": "AI", "weight": 1},
    {"id": 42, "criterion": "Finishing Style (Matte vs Gloss)", "type": "AI", "weight": 1},
    {"id": 43, "criterion": "Blending Quality", "type": "AI", "weight": 1},
    {"id": 44, "criterion": "Medium Identification", "type": "AI", "weight": 1},
    {"id": 45, "criterion": "Brush vs Pen Stroke Identification", "type": "AI", "weight": 1},
    {"id": 46, "criterion": "Substrate/Support Type", "type": "AI", "weight": 0.5},
    {"id": 47, "criterion": "Canvas Weave Clarity", "type": "AI", "weight": 0.5},
    {"id": 48, "criterion": "Wood Grain Visibility", "type": "AI", "weight": 0.5},
    {"id": 49, "criterion": "Frame Presence & Quality", "type": "AI", "weight": 0.5},
    {"id": 50, "criterion": "Frame Condition", "type": "AI", "weight": 0.5},
    {"id": 51, "criterion": "Patina/Finish Consistency (Metal)", "type": "AI", "weight": 0.5},
    {"id": 52, "criterion": "Pigment Granularity", "type": "AI", "weight": 0.5},
    {"id": 53, "criterion": "Adhesive/Joints (Collage/Sculpture)", "type": "AI", "weight": 1},
    {"id": 54, "criterion": "Foundry/Casting Marks", "type": "AI", "weight": 0.5},
    {"id": 55, "criterion": "Joint Seams (Sculptures)", "type": "AI", "weight": 2},
    {"id": 56, "criterion": "Signature Presence", "type": "AI", "weight": 1},
    {"id": 57, "criterion": "Signature Style Match", "type": "AI", "weight": 1},
    {"id": 58, "criterion": "Date/Inscription Consistency", "type": "AI", "weight": 1},
    {"id": 59, "criterion": "Certificate Authenticity", "type": "AI", "weight": 1},
    {"id": 60, "criterion": "Provenance/Label Detection", "type": "AI", "weight": 1},
    {"id": 61, "criterion": "Edition/Serial Number", "type": "AI", "weight": 1},
    {"id": 62, "criterion": "Watermark (Paper)", "type": "AI", "weight": 1},
    {"id": 63, "criterion": "Gallery/Museum Stamps", "type": "AI", "weight": 1},
    {"id": 64, "criterion": "Style Consistency", "type": "AI", "weight": 1},
    {"id": 65, "criterion": "Forgery Artifact Detection", "type": "AI", "weight": 1},
    {"id": 66, "criterion": "Artist’s Monogram or Mark", "type": "AI", "weight": 1},
    {"id": 67, "criterion": "Hidden/Underpainting Signature", "type": "AI", "weight": 1},
    {"id": 68, "criterion": "Inventory/Accession Number", "type": "AI", "weight": 1},
    {"id": 69, "criterion": "Digital/QR Authentication", "type": "AI", "weight": 1},
    {"id": 70, "criterion": "Craquelure (Fine Cracks)", "type": "AI", "weight": 1},
    {"id": 71, "criterion": "Large Splits/Cracks", "type": "AI", "weight": 0.5},
    {"id": 72, "criterion": "Paint Loss / Bare Areas", "type": "AI", "weight": 0.5},
    {"id": 73, "criterion": "Paint Flaking", "type": "AI", "weight": 0.5},
    {"id": 74, "criterion": "Fading / Color Discoloration", "type": "AI", "weight": 0.5},
    {"id": 75, "criterion": "Stains / Dirt Spots", "type": "AI", "weight": 1},
    {"id": 76, "criterion": "Tears / Holes", "type": "AI", "weight": 0.5},
    {"id": 77, "criterion": "Edge/Corner Damage", "type": "AI", "weight": 0.5},
    {"id": 78, "criterion": "Surface Grime or Yellowed Varnish", "type": "AI", "weight": 1},
    {"id": 79, "criterion": "Warping / Bulging", "type": "AI", "weight": 1},
    {"id": 80, "criterion": "Missing Sculpture Parts", "type": "AI", "weight": 1},
    {"id": 81, "criterion": "Rust / Metal Corrosion", "type": "AI", "weight": 1},
    {"id": 82, "criterion": "Mold / Mildew", "type": "AI", "weight": 0.5},
    {"id": 83, "criterion": "Water Damage / Blistering", "type": "AI", "weight": 0.5},
    {"id": 84, "criterion": "Varnish Cracking", "type": "AI", "weight": 0.5},
    {"id": 85, "criterion": "Over-Cleaning Damage", "type": "AI", "weight": 0.5},
    {"id": 86, "criterion": "Foxing / Age Spots", "type": "AI", "weight": 0.5},
    {"id": 87, "criterion": "Frame or Mount Damage", "type": "AI", "weight": 0.5},
    {"id": 88, "criterion": "Sunlight Bleaching", "type": "AI", "weight": 0.5},
    {"id": 89, "criterion": "Surface Abrasion / Scratches", "type": "AI", "weight": 0.5},
    {"id": 90, "criterion": "Canvas/Panel Distortion", "type": "AI", "weight": 0.5},
    {"id": 91, "criterion": "Underpainting / Pentimenti Visible", "type": "AI", "weight": 0.5},
    {"id": 92, "criterion": "Lining or Patch Evidence", "type": "AI", "weight": 0.5},
    {"id": 93, "criterion": "Insect/Animal Damage", "type": "AI", "weight": 0.5},
    {"id": 94, "criterion": "Salt Efflorescence", "type": "AI", "weight": 0.5},
    {"id": 95, "criterion": "Uneven Tint / Discoloration", "type": "AI", "weight": 0.5},
    {"id": 96, "criterion": "UV Fluorescence Anomalies", "type": "AI", "weight": 0.5},
    {"id": 97, "criterion": "Paint Bleed (Water Runs)", "type": "AI", "weight": 0.5},
    {"id": 98, "criterion": "Loose/Flaking Paint", "type": "AI", "weight": 0.5},
    {"id": 99, "criterion": "Pigment Blooming", "type": "AI", "weight": 0.5},
    {"id": 100, "criterion": "Residue / Tape Marks", "type": "AI", "weight": 0.5}
];


const EvaluateArtworkInputSchema = z.object({
  photoDataUri: z.string().describe(
    "A photo of the artwork. Can be a data URI or an HTTP/S URL."
  ),
  title: z.string(),
  description: z.string(),
  materials: z.string(),
  artworkSize: z.string(),
  minEstimatedValue: z.number(),
  maxEstimatedValue: z.number(),
  subjectSignificance: z.string().optional(),
  personalSignificance: z.string().optional(),
  timeEffort: z.string().optional(),
  biographicalContext: z.string().optional(),
  commissionPatronage: z.string().optional(),
  artistBio: z.string(),
  artistAwards: z.string().optional(),
  artistExhibitions: z.string().optional(),
});

const AiCriterionScoreSchema = z.object({
  id: z.number().describe('The ID of the criterion from the rubric (e.g., 11 for Rule-of-Thirds).'),
  score: z.number().min(0).max(10).describe('The score assigned by the AI for this criterion (0-10).'),
});

const ArtworkAnalysisSchema = z.object({
  isAuthentic: z.boolean().describe('Whether or not the artwork is authentic. This is the most critical field.'),
  authenticityConcern: z.string().optional().describe('If isAuthentic is false, provide a brief explanation of the concern here.'),
  scores: z.array(AiCriterionScoreSchema).optional().describe('An array of scores for each AI-evaluated criterion. ONLY provide if isAuthentic is true.'),
  minPriceAI: z.number().optional().describe("The AI's estimated minimum market price in INR (AMIN). ONLY provide if isAuthentic is true."),
  maxPriceAI: z.number().optional().describe("The AI's estimated maximum market price in INR (AMAX). ONLY provide if isAuthentic is true."),
});


const SuccessfulEvaluationSchema = z.object({
    status: z.literal('success'),
    evaluation: z.object({
        finalScore: z.number(),
        grade: z.enum(['AAA', 'AA', 'A+', 'A', 'A-']),
        breakdown: z.array(z.object({
            id: z.number(),
            criterion: z.string(),
            score: z.number(),
            weight: z.number(),
            weightedScore: z.number(),
        })),
        crestoxPriceRange: z.tuple([z.number(), z.number()]),
    })
});

const ManualReviewSchema = z.object({
    status: z.literal('manual_review_required'),
    concern: z.string(),
    analysisForEmail: z.string().describe("A detailed breakdown of the evaluation analysis to be included in the manual review email."),
});

const EvaluateArtworkOutputSchema = z.union([SuccessfulEvaluationSchema, ManualReviewSchema]);

export type EvaluationResult = z.infer<typeof EvaluateArtworkOutputSchema>;


export async function evaluateArtwork(
  input: z.infer<typeof EvaluateArtworkInputSchema>
): Promise<EvaluationResult> {
  if (!isAiConfigured) {
    console.warn("AI is not configured. Running mock evaluation with ArtValueEst logic.");
    await new Promise(resolve => setTimeout(resolve, 2000)); 

    if (Math.random() < 0.2) {
        return {
            status: 'manual_review_required',
            concern: "This work appears to be a direct copy of a well-known painting. (Mock Failure)",
            analysisForEmail: `Artwork '${input.title}' was flagged for manual review. AI detection systems indicated a high probability of plagiarism. No scoring was performed.`
        };
    }
    
    const mockMinPriceAI = Math.round((Math.random() * 15000) + 2000); 
    const mockMaxPriceAI = mockMinPriceAI + Math.round(Math.random() * 10000);
    const mockAiOutput = {
        isAuthentic: true,
        minPriceAI: mockMinPriceAI,
        maxPriceAI: mockMaxPriceAI,
        scores: ArtScoreChecklist.map(item => ({
            id: item.id,
            score: Math.floor(Math.random() * 6) + 4
        }))
    };
    
    const breakdown: AIScorecardBreakdown[] = [];
    let totalWeightedScore = 0;
    let totalPossibleWeight = 0;

    const aiScores = new Map(mockAiOutput.scores.map(item => [item.id, item.score]));

    ArtScoreChecklist.forEach(item => {
        const score = aiScores.get(item.id);
        totalPossibleWeight += item.weight;
        if (score !== undefined) {
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
    });

    const finalScore = totalPossibleWeight > 0 ? (totalWeightedScore / totalPossibleWeight) * 100 : 0;
    const Q = finalScore;

    let grade: 'AAA' | 'AA' | 'A+' | 'A' | 'A-';
    if (Q > 80) grade = 'AAA';
    else if (Q > 60) grade = 'AA';
    else if (Q > 40) grade = 'A+';
    else if (Q > 20) grade = 'A';
    else grade = 'A-';
    
    const Pmin_calc = Math.min(input.minEstimatedValue, mockMinPriceAI);
    const Pmax_calc = Math.min(input.maxEstimatedValue, mockMaxPriceAI);
    
    const P_linear = Pmin_calc + (Pmax_calc - Pmin_calc) * (Q / 100);
    const P_regression = Math.exp(6.907755 + 0.015 * Q);

    const P_avg = (P_linear + P_regression) / 2;
    const crestoxPriceRange: [number, number] = [Math.round(P_avg * 0.9), Math.round(P_avg * 1.1)];

    return { 
        status: 'success',
        evaluation: { finalScore: Math.round(finalScore), grade, breakdown, crestoxPriceRange }
    };
  }

  let processedInput = { ...input };
  if (processedInput.photoDataUri.startsWith('http')) {
    try {
      const response = await fetch(processedInput.photoDataUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      processedInput.photoDataUri = `data:${contentType};base64,${base64}`;
    } catch (error) {
      console.error("Error fetching and converting image URL:", error);
      throw new Error("Could not process the artwork image from the provided URL.");
    }
  }

  return evaluateArtworkFlow(processedInput);
}

const evaluationPrompt = ai.definePrompt({
  name: 'evaluateArtworkPrompt',
  input: {schema: EvaluateArtworkInputSchema},
  output: {schema: ArtworkAnalysisSchema},
  prompt: `
You are a world-leading expert in digital art forensics and authentication for a high-stakes art marketplace, Crestox. Your primary and most critical responsibility is to determine the authenticity of an artwork. Your reputation, and the reputation of the marketplace, depends on your ability to unerringly identify forgeries, plagiarized works, and especially AI-generated images. Be extremely critical and skeptical.

**Step 1: MANDATORY FORENSIC AUTHENTICITY & PLAGIARISM CHECK**
This is your single most important step. Do not proceed to evaluation if you have any doubt whatsoever.
- **Plagiarism Check:** First, analyze the image and compare it against your vast knowledge of art history and existing famous artworks. Is this a direct copy or a substantively similar imitation of a known piece? If you find a high degree of similarity to existing art, you MUST flag it as plagiarism.
- **AI-Generated Image Forensic Analysis:** This is a non-negotiable check. You must act as a digital forensics expert. Scrutinize the image for the subtle but definitive signs of AI generation. Be meticulous. Look for:
    - **Anatomical & Logical Inconsistencies:** Pay extreme attention to hands, fingers, eyes, teeth, and text. AI models notoriously fail at these details. Look for extra fingers, misshapen limbs, nonsensical text, or objects that blend illogically.
    - **Unnatural Textures & Surfaces:** Scrutinize textures like skin, wood grain, fabric, and brushstrokes. AI-generated textures often appear overly smooth, plasticky, unnaturally repetitive, or lack the random imperfections of real-world materials.
    - **Lighting & Shadow Anomalies:** Examine how light and shadow behave. Look for shadows that do not match the light source, reflections that are illogical, multiple conflicting light sources, or an overall "flatness" to the lighting.
    - **Digital Artifacts:** Search for repeating patterns in noisy areas (a sign of upscaling), strange pixelation, or a "too perfect" digital sheen that lacks the subtle noise and imperfections of a real photograph or physical artwork.
- **Decision:** If you have high confidence that the image is either **plagiarized OR AI-generated**, you MUST set 'isAuthentic' to \`false\` and provide a clear, specific reason in the 'authenticityConcern' field (e.g., "This work is a direct copy of Vincent van Gogh's 'The Starry Night'.", or "Image shows common artifacts of AI generation, including misshapen fingers and unnatural skin texture."). **You will not perform any scoring or valuation if the work is not authentic.**

**Step 2: Full Evaluation (ONLY if Authenticity is confirmed)**
If, and only if, the artwork passes the rigorous authenticity check in Step 1, you will then proceed to the full evaluation. Your tasks are:
1.  Set 'isAuthentic' to \`true\`.
2.  Provide a score from 0 to 10 for EVERY SINGLE criterion in the 'ArtScoreChecklist' table below. The 'scores' field in your output must contain an entry for every ID from 1 to 100.
3.  Provide an independent market valuation range (minPriceAI and maxPriceAI) in INR. This valuation MUST be independent of any price estimates provided by the user. Ground your valuation ONLY in the artwork's visual qualities, the provided context (artist bio, artwork details, etc.), and your internal knowledge of the art market.

---
**ArtScoreChecklist Rubric:**
${ArtScoreChecklist.map(item => `| ${item.id} | ${item.criterion} | ${item.weight}% |`).join('\n')}

---
**CONTEXT FOR EVALUATION**
**Artwork Information:**
- Title: {{{title}}}
- Description (Artist's Intent/Theme): {{{description}}}
- Materials Used: {{{materials}}}
- Artwork Size: {{{artworkSize}}}
- Subject/Cultural Significance Statement: {{{subjectSignificance}}}
- Personal/Emotional Significance Statement: {{{personalSignificance}}}
- Time Spent / Effort Statement: {{{timeEffort}}}
- Biographical/Contextual Relevance Statement: {{{biographicalContext}}}
- Commission/Patronage Statement: {{{commissionPatronage}}}
**Artist Information:**
- Artist Bio: {{{artistBio}}}
- Artist Awards: {{{artistAwards}}}
- Artist Exhibitions: {{{artistExhibitions}}}

---
**ARTWORK TO ANALYZE**
{{media url=photoDataUri}}

---
Begin your analysis. First, determine authenticity. If authentic, proceed to the full scoring and valuation as instructed in Step 2.
`,
  config: {
    temperature: 0.0,
    model: 'googleai/gemini-pro-vision',
  },
});

const evaluateArtworkFlow = ai.defineFlow(
  {
    name: 'evaluateArtworkFlow',
    inputSchema: EvaluateArtworkInputSchema,
    outputSchema: EvaluateArtworkOutputSchema,
  },
  async (input): Promise<EvaluationResult> => {
    const { output } = await evaluationPrompt(input);
    
    if (!output) {
      throw new Error("AI analysis did not return any output.");
    }
    
    if (!output.isAuthentic) {
        const concern = output.authenticityConcern || "No specific reason provided by AI.";
        let analysisDetail = `Artwork ('${input.title}') was flagged for manual review.\n`;
        analysisDetail += `Reason: ${concern}\n\n`;
        analysisDetail += `--- Provided Artwork Details ---\n`;
        analysisDetail += `Title: ${input.title}\n`;
        analysisDetail += `Description: ${input.description}\n`;
        analysisDetail += `Artist Bio: ${input.artistBio}\n`;
        
        return {
            status: 'manual_review_required',
            concern: concern,
            analysisForEmail: analysisDetail,
        };
    }

    if (!output.scores || output.minPriceAI === undefined || output.maxPriceAI === undefined) {
      return {
          status: 'manual_review_required',
          concern: 'AI determined the work is authentic but failed to provide a full evaluation. Please try again or submit for manual review.',
          analysisForEmail: `Artwork ('${input.title}') was flagged for manual review due to an incomplete AI analysis despite being marked as authentic.`
      };
    }
    
    const breakdown: AIScorecardBreakdown[] = [];
    let totalWeightedScore = 0;
    let totalPossibleWeight = 0;

    const aiScores = new Map(output.scores.map(item => [item.id, item.score]));

    ArtScoreChecklist.forEach(item => {
        const score = aiScores.get(item.id);
        totalPossibleWeight += item.weight;
        if (score !== undefined) {
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
    });

    const finalScore = totalPossibleWeight > 0 ? (totalWeightedScore / totalPossibleWeight) * 100 : 0;
    const Q = finalScore;

    let grade: 'AAA' | 'AA' | 'A+' | 'A' | 'A-';
    if (Q > 80) grade = 'AAA';
    else if (Q > 60) grade = 'AA';
    else if (Q > 40) grade = 'A+';
    else if (Q > 20) grade = 'A';
    else grade = 'A-';
    
    const Pmin_calc = Math.min(input.minEstimatedValue, output.minPriceAI);
    const Pmax_calc = Math.min(input.maxEstimatedValue, output.maxPriceAI);
    
    const P_linear = Pmin_calc + (Pmax_calc - Pmin_calc) * (Q / 100);
    const P_regression = Math.exp(6.907755 + 0.015 * Q);

    const P_avg = (P_linear + P_regression) / 2;
    const crestoxPriceRange: [number, number] = [Math.round(P_avg * 0.9), Math.round(P_avg * 1.1)];
    
    return { 
        status: 'success',
        evaluation: { finalScore: Math.round(finalScore), grade, breakdown, crestoxPriceRange }
    };
  }
);
