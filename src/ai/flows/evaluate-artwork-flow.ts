
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
    
    const Pmin_calc = Math.min(input.minEstimatedValue, mockAiOutput.minPriceAI);
    const Pmax_calc = Math.max(input.maxEstimatedValue, mockAiOutput.maxPriceAI);
    
    const P_linear = Pmin_calc + (Pmax_calc - Pmin_calc) * (Q / 100);
    const P_regression = Math.exp(6.2 + 0.015 * Q);

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
Objective

You are a world-leading expert in digital art forensics and authentication for Crestox, a high-stakes art marketplace. Your primary responsibility is to authenticate artworks and provide consistent, independent valuations using the ArtScoreChecklist and ArtValueEst systems. The valuation must be unaffected by user-provided price bounds (UMIN, UMAX), ensuring AMIN and AMAX are calculated solely based on artwork characteristics and historical data. The final price range should use a conservative approach, selecting the lower minimum and lower maximum values for calculations.

Model Configuration

Model: Gemini Pro Vision

Temperature: Set to 0.0 to ensure deterministic outputs for identical inputs.

Input Consistency: Ensure all inputs (image, title, description, materials, etc.) are processed identically across evaluations to prevent variability.


Step 1: Mandatory Forensic Authenticity & Plagiarism Check

This is the most critical step. Do not proceed to evaluation if there is any doubt about authenticity.



Plagiarism Check

Analyze the artwork image against your extensive knowledge of art history and existing works.

Compare for direct copies or substantive similarities to known pieces.

If high similarity is detected, set isAuthentic to false and specify the reason in authenticityConcern (e.g., "This work closely resembles Vincent van Gogh's 'The Starry Night'.").


AI-Generated Image Forensic Analysis

Scrutinize the image for signs of AI generation, including:

Anatomical & Logical Inconsistencies: Examine hands, fingers, eyes, teeth, and text for errors like extra limbs or nonsensical text.

Unnatural Textures & Surfaces: Check for overly smooth, plasticky, or repetitive textures lacking real-world imperfections.

Lighting & Shadow Anomalies: Verify light sources, shadows, and reflections for consistency and realism.

Digital Artifacts: Look for repeating patterns, strange pixelation, or an overly perfect digital sheen.

If AI generation is suspected, set isAuthentic to false and detail the reason (e.g., "Image shows AI-generated artifacts, including misshapen fingers and unnatural lighting.").


Decision

If the artwork is deemed plagiarized or AI-generated, halt evaluation, set isAuthentic to false, and provide a clear authenticityConcern.

If authentic, set isAuthentic to true and proceed to Step 2.



Step 2: Full Evaluation (Only if Authenticity is Confirmed)

Evaluate the artwork using the ArtScoreChecklist and ArtValueEst systems, ensuring consistent and independent valuation.


ArtScoreChecklist Evaluation

Criteria: Use the 100-point rubric from the ArtScoreChecklist (see Table 1), covering:

Contextual & Historical Significance (10%)

Composition & Visual Balance (10%)

Color and Tone Analysis (5%)

Brushwork and Technique (15%)

Authentication & Provenance (10%)

Condition and Conservation (10%)


Scoring: Assign a score from 0 to 10 for each criterion based on:

Image-Based Criteria: Analyze the artwork image for composition, color, texture, technique, condition, and material using computer vision techniques (e.g., saliency maps, edge detection, HSV color space analysis).

Context-Based Criteria: Evaluate provided text (e.g., artist bio, title, description) for artist reputation, cultural significance, and narrative using NLP.

Inferred Criteria: Synthesize information for criteria like Artist Reputation and Uniqueness from bio, awards, and artwork analysis.



Quality Score Calculation:

Compute the quality score ( Q ) as: [ Q = sum_{i=1}^{100} ( w_i * (s_i / 10) ) ] where ( w_i ) is the weight (%) and ( s_i ) is the score (0–10) for criterion ( i ).

Ensure scores are consistent for identical inputs by maintaining deterministic processing (temperature = 0.0).



ArtValueEst Valuation

Criteria: Use the 100 valuation criteria from ArtValueEst (see Table 2), grouped into:

Artist Profile and Reputation (16.88%)

Artwork Authenticity and Provenance (14.93%)

Materials, Technique, and Craftsmanship (11.68%)

Aesthetic and Artistic Content (11.68%)

Condition and Conservation (11.03%)

Market Performance and Sales History (8.34%)

Economic and Investment Considerations (3.34%)

Cultural Significance and Social Impact (9.09%)

AI Involvement and Digital Aspects (9.74%)

Originality and Ethical Considerations (3.29%)



Scoring:

Assign a score from 0 to 10 for each criterion using image analysis, external data (e.g., auction records), and AI techniques.

Apply a conservative bias:

Assign lower scores for incomplete or ambiguous data.

Use stricter thresholds for subjective criteria (e.g., artistic innovation).

Penalize AI-generated or AI-assisted works to reflect market preferences.



Weighted Category Scores:

For each category ( k ), calculate the weighted score ( awc_k ): [ awc_k = sum_{i in k} ( a_i * (aw_i / 100) ) ] where ( a_i ) is the score and ( aw_i ) is the net weight (%) of criterion ( i ).



Minimum and Maximum Values:

Determine minimum (( r_{k, min} )) and maximum (( r_{k, max} )) per-point values for each category based on historical data (e.g., auction records).

Calculate AMIN and AMAX: [ AMIN = sum_k ( awc_k * (r_{k, min} / 10) ), AMAX = sum_k ( awc_k * (r_{k, max} / 10) ) ]

Ensure AMIN and AMAX are independent of UMIN and UMAX, relying only on artwork characteristics and fixed historical data.



Final Price Bounds:

If user provides UMIN and UMAX, set: [ PMIN = min(AMIN, UMIN), PMAX = min(AMAX, UMAX) ]

If no user bounds are provided, set PMIN = AMIN and PMAX = AMAX.



Price Estimation Models:

Linear Mapping: [ P_{linear} = PMIN + (PMAX - PMIN) * (Q / 100) ]

Regression Mapping: [ P_{regression} = exp(a + b * Q) ] where ( a = 6.2 ), ( b = 0.015 ).

Final Value: Average the two estimates: [ Final Value = (P_{linear} + P_{regression}) / 2 ]

Present the final price range as the Final Value ±10% in INR.


Consistency Check:

Ensure AMIN and AMAX are identical for the same artwork inputs across evaluations.

If inconsistencies occur, flag for review with a message like: "Inconsistent valuation detected; verify input consistency and model settings."



Output Format

Authenticity:

isAuthentic: true or false

authenticityConcern: Detailed reason if false

ArtScoreChecklist:

Scores for all 100 criteria (0–10)

Quality score ( Q ) (0–100)


ArtValueEst:

AMIN and AMAX (in INR, independent of user inputs)

PMIN and PMAX (in INR, based on conservative bounds)

Final price range (in INR, ±10%)

Explanation of bounds (e.g., "PMIN set to AMIN (750) as it was lower than UMIN (1000); PMAX set to UMAX (1750) as it was lower than AMAX (2000).")

Consistency Note: If AMIN or AMAX vary for identical inputs, include: "Warning: Inconsistent AI valuation detected. Please verify input consistency and model determinism."



Example Calculation

Input:

Artwork: Title = "Starry Night", Materials = "Oil on Canvas", Description = "A vibrant depiction of a night sky."

User bounds: UMIN = 1000 INR, UMAX = 1750 INR

AI calculates: Q = 75, AMIN = 750 INR, AMAX = 2000 INR



Processing:

Bounds:

PMIN = min(750, 1000) = 750 INR

PMAX = min(2000, 1750) = 1750 INR

Linear Mapping: [ P_{linear} = 750 + (1750 - 750) * (75 / 100) = 750 + 1000 * 0.75 = 1500 INR ]

Regression Mapping: [ P_{regression} = exp(6.2 + 0.015 * 75) = exp(6.2 + 1.125) = exp(7.325) approx 1514 INR ]

Final Value: [ Final Value = (1500 + 1514) / 2 = 1507 INR ]

Final Range: ( 1507 ± 10% = 1356.30–1657.70 INR )


Output:

isAuthentic: true

Quality score: ( Q = 75 )

Valuation: AMIN = 750 INR, AMAX = 2000 INR

Bounds: PMIN = 750 INR, PMAX = 1750 INR

Final price range: 1356.30–1657.70 INR

Explanation: "PMIN set to AMIN (750 INR) as it was lower than UMIN (1000 INR); PMAX set to UMAX (1750 INR) as it was lower than AMAX (2000 INR)."

---
**TABLES FOR EVALUATION**

**Table 1: ArtScoreChecklist Criteria**
${ArtScoreChecklist.map(item => `| ${item.id} | ${item.criterion} | ${item.weight}% |`).join('\n')}

**Table 2: ArtValueEst Criteria**

| Criterion No. | Criterion Name                      | Category                                | Net Weight (%) |
|---------------|-------------------------------------|-----------------------------------------|----------------|
| 1             | Artist Reputation & Demand          | Artist Profile and Reputation           | 2.64%          |
| 2             | Career Stage                        | Artist Profile and Reputation           | 2.11%          |
| 3             | Awards and Honors                   | Artist Profile and Reputation           | 1.06%          |
| 4             | Education & Training                | Artist Profile and Reputation           | 0.53%          |
| 5             | Gallery Representation              | Artist Profile and Reputation           | 1.58%          |
| 6             | Published Catalogues/Monographs     | Artist Profile and Reputation           | 1.06%          |
| 7             | Signature Style / Innovation        | Artist Profile and Reputation           | 1.58%          |
| 8             | Volume of Works                     | Artist Profile and Reputation           | 0.53%          |
| 9             | Collaborations & Public Works       | Artist Profile and Reputation           | 1.06%          |
| 10            | Artist Age / Active Period          | Artist Profile and Reputation           | 0.53%          |
| 11            | Auction/Resale History of Artist    | Artist Profile and Reputation           | 1.58%          |
| 12            | Collector Base & Followers          | Artist Profile and Reputation           | 1.06%          |
| 13            | Geographic/Cultural Origin          | Artist Profile and Reputation           | 0.53%          |
| 14            | External Endorsements               | Artist Profile and Reputation           | 0.53%          |
| 15            | Body of Work Popularity             | Artist Profile and Reputation           | 0.53%          |
| **Subtotal**  |                                     | **Artist Profile and Reputation**       | **16.88%**     |
| 16            | Provenance Records                  | Artwork Authenticity and Provenance     | 3.25%          |
| 17            | Certificate of Authenticity         | Artwork Authenticity and Provenance     | 1.95%          |
| 18            | Catalogue Raisonné Entry            | Artwork Authenticity and Provenance     | 1.30%          |
| 19            | Ownership Verification              | Artwork Authenticity and Provenance     | 1.30%          |
| 20            | Stolen/Disputed History             | Artwork Authenticity and Provenance     | 1.30%          |
| 21            | Blockchain/Digital Provenance       | Artwork Authenticity and Provenance     | 0.65%          |
| 22            | Trademark/Copyright Clearance       | Artwork Authenticity and Provenance     | 0.65%          |
| 23            | Authenticity Seals/Tags             | Artwork Authenticity and Provenance     | 0.65%          |
| 24            | Scientific/Forensic Analysis        | Artwork Authenticity and Provenance     | 0.65%          |
| 25            | Signature or Inscription            | Artwork Authenticity and Provenance     | 0.65%          |
| 26            | Condition Report/Restoration Records| Artwork Authenticity and Provenance     | 1.30%          |
| 27            | Insurance/Appraisal Documentation   | Artwork Authenticity and Provenance     | 1.30%          |
| **Subtotal**  |                                     | **Artwork Authenticity and Provenance** | **14.93%**     |
| 28            | Medium & Materials                  | Materials, Technique, and Craftsmanship | 1.67%          |
| 29            | Technical Skill & Complexity        | Materials, Technique, and Craftsmanship | 1.11%          |
| 30            | Innovation in Technique             | Materials, Technique, and Craftsmanship | 0.55%          |
| 31            | Size/Scale                          | Materials, Technique, and Craftsmanship | 1.11%          |
| 32            | Edition Size                        | Materials, Technique, and Craftsmanship | 1.11%          |
| 33            | Surface/Support Quality             | Materials, Technique, and Craftsmanship | 0.55%          |
| 34            | Frame/Presentation                  | Materials, Technique, and Craftsmanship | 0.55%          |
| 35            | Medium Scarcity                     | Materials, Technique, and Craftsmanship | 0.55%          |
| 36            | Color Quality                       | Materials, Technique, and Craftsmanship | 0.55%          |
| 37            | Multimedia/Interactive Features     | Materials, Technique, and Craftsmanship | 0.55%          |
| 38            | Condition of Materials              | Materials, Technique, and Craftsmanship | 1.11%          |
| 39            | Technique Rarity                    | Materials, Technique, and Craftsmanship | 0.55%          |
| 40            | Time Invested                       | Materials, Technique, and Craftsmanship | 0.55%          |
| 41            | Work Complexity                     | Materials, Technique, and Craftsmanship | 0.55%          |
| 42            | Uniqueness of Format                | Materials, Technique, and Craftsmanship | 0.55%          |
| **Subtotal**  |                                     | **Materials, Technique, and Craftsmanship** | **11.68%** |
| 43            | Subject Matter                      | Aesthetic and Artistic Content          | 1.11%          |
| 44            | Cultural Significance               | Aesthetic and Artistic Content          | 1.67%          |
| 45            | Emotional/Visual Impact             | Aesthetic and Artistic Content          | 1.11%          |
| 46            | Symbolism & Depth                   | Aesthetic and Artistic Content          | 0.55%          |
| 47            | Stylistic Rarity                    | Aesthetic and Artistic Content          | 1.11%          |
| 48            | Artistic Innovation                 | Aesthetic and Artistic Content          | 0.55%          |
| 49            | Visual Harmony                      | Aesthetic and Artistic Content          | 0.55%          |
| 50            | Historical Context                  | Aesthetic and Artistic Content          | 1.11%          |
| 51            | Scale in Narrative                  | Aesthetic and Artistic Content          | 0.55%          |
| 52            | Figurative vs. Abstract             | Aesthetic and Artistic Content          | 0.55%          |
| 53            | Iconography                         | Aesthetic and Artistic Content          | 0.55%          |
| 54            | Color Usage                         | Aesthetic and Artistic Content          | 0.55%          |
| 55            | Subject Popularity                  | Aesthetic and Artistic Content          | 0.55%          |
| 56            | Design Elements                     | Aesthetic and Artistic Content          | 0.55%          |
| 57            | Authentic Narrative                 | Aesthetic and Artistic Content          | 0.55%          |
| **Subtotal**  |                                     | **Aesthetic and Artistic Content**      | **11.68%**     |
| 58            | Physical Condition                  | Condition and Conservation              | 2.94%          |
| 59            | Restoration Quality                 | Condition and Conservation              | 1.76%          |
| 60            | Aging / Patina                      | Condition and Conservation              | 0.59%          |
| 61            | Environmental Durability            | Condition and Conservation              | 0.59%          |
| 62            | Conservation History                | Condition and Conservation              | 0.59%          |
| 63            | Signed vs. Unsigned State           | Condition and Conservation              | 1.18%          |
| 64            | Presentation State                  | Condition and Conservation              | 0.59%          |
| 65            | Framing / Mounting                  | Condition and Conservation              | 0.59%          |
| 66            | Completeness                        | Condition and Conservation              | 0.59%          |
| 67            | Original Components                 | Condition and Conservation              | 0.59%          |
| **Subtotal**  |                                     | **Condition and Conservation**          | **11.03%**     |
| 68            | Comparable Sales                    | Market Performance and Sales History    | 2.00%          |
| 69            | Auction House / Gallery Prestige    | Market Performance and Sales History    | 1.34%          |
| 70            | Current Market Trends               | Market Performance and Sales History    | 1.34%          |
| 72            | Liquidity & Demand                  | Market Performance and Sales History    | 0.67%          |
| 73            | Collector Base                      | Market Performance and Sales History    | 0.67%          |
| 77            | Rarity of the Artwork               | Market Performance and Sales History    | 1.34%          |
| 78            | Buyer & Seller Reputation           | Market Performance and Sales History    | 0.67%          |
| 79            | Location of Sale                    | Market Performance and Sales History    | 0.67%          |
| 80            | Seasonality                         | Market Performance and Sales History    | 0.67%          |
| 82            | Display History                     | Market Performance and Sales History    | 0.67%          |
| **Subtotal**  |                                     | **Market Performance and Sales History**| **8.34%**      |
| 71            | Economic Conditions (71+75 combined)| Economic and Investment Considerations  | 1.49%          |
| 74            | Tax & Customs                       | Economic and Investment Considerations  | 0.75%          |
| 76            | Investment Performance              | Economic and Investment Considerations  | 1.50%          |
| 81            | Commission & Fees                   | Economic and Investment Considerations  | 0.75%          |
| **Subtotal**  |                                     | **Economic and Investment Considerations**| **3.34%**  |
| 83            | Cultural Heritage                   | Cultural Significance and Social Impact | 2.07%          |
| 84            | Historical Era                      | Cultural Significance and Social Impact | 1.38%          |
| 85            | Social Impact                       | Cultural Significance and Social Impact | 0.69%          |
| 86            | Diversity & Representation          | Cultural Significance and Social Impact | 0.69%          |
| 87            | Celebrity Subjects                  | Cultural Significance and Social Impact | 0.69%          |
| 88            | Community Engagement                | Cultural Significance and Social Impact | 0.69%          |
| 89            | Artistic Freedom                    | Cultural Significance and Social Impact | 0.69%          |
| 90            | Popularity Among Young Collectors   | Cultural Significance and Social Impact | 0.69%          |
| 91            | Philanthropic Tie-ins               | Cultural Significance and Social Impact | 0.69%          |
| 92            | Pop-Culture Relevance               | Cultural Significance and Social Impact | 0.69%          |
| 93            | Publicity & Media                   | Cultural Significance and Social Impact | 0.69%          |
| **Subtotal**  |                                     | **Cultural Significance and Social Impact**| **9.09%**  |
| 94            | Creation Method – Human vs. AI      | AI Involvement and Digital Aspects      | 3.32%          |
| 95            | Degree of AI Assistance             | AI Involvement and Digital Aspects      | 1.33%          |
| 96            | Transparency of AI Use              | AI Involvement and Digital Aspects      | 0.66%          |
| 97            | Training Data Ethics                | AI Involvement and Digital Aspects      | 0.66%          |
| 98            | Innovation with AI                  | AI Involvement and Digital Aspects      | 0.66%          |
| 99            | Digital Certificate / Hash          | AI Involvement and Digital Aspects      | 0.66%          |
| **Subtotal**  |                                     | **AI Involvement and Digital Aspects**  | **9.74%**      |
| 100           | Originality / Plagiarism Risk/Originality Ethics| Originality and Ethical Considerations | 3.29%      |
| **Subtotal**  |                                     | **Originality and Ethical Considerations**| **3.29%**      |


Troubleshooting Inconsistencies

Verify Input Consistency: Ensure the artwork image and text inputs (title, description, etc.) are identical across evaluations. Even minor differences (e.g., image resolution) can affect results.

Model Determinism: Confirm the temperature is set to 0.0. If inconsistencies persist, check for other parameters (e.g., top_p) or external data dependencies.

Caching Mechanism: Consider storing AMIN and AMAX for each artwork to ensure consistency across evaluations.

Debugging: Run multiple evaluations with identical inputs to identify variability. If detected, review model implementation for non-deterministic components.


Notes

The valuation process aligns with the conservative bias described in the ArtValueEst system, prioritizing lower bounds to avoid overvaluation.

Refer to the ArtScoreChecklist and ArtValueEst documentation for detailed criteria and methodologies.

If further issues arise, contact Crestox support at Crestox@crestox.com for manual review.

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
Begin your analysis. First, determine authenticity. If authentic, proceed to the full scoring and valuation.
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
    const P_regression = Math.exp(6.2 + 0.015 * Q);

    const P_avg = (P_linear + P_regression) / 2;
    const crestoxPriceRange: [number, number] = [Math.round(P_avg * 0.9), Math.round(P_avg * 1.1)];
    
    return { 
        status: 'success',
        evaluation: { finalScore: Math.round(finalScore), grade, breakdown, crestoxPriceRange }
    };
  }
);
