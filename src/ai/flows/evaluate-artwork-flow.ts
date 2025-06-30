
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
 * This constant contains the full 100-point quality evaluation rubric.
 * The final score (Q) from this is used in the ArtValueEst pricing model.
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

/**
 * ArtValueEstCriteria
 * This constant contains the criteria for monetary valuation. It is not currently
 * used to generate a scorecard but is here for future system expansion.
 */
const ArtValueEstCriteria = [
    { id: 1, criterion: "Artist Reputation & Demand", category: "Artist Profile and Reputation", weight: 2.64 },
    { id: 2, criterion: "Career Stage", category: "Artist Profile and Reputation", weight: 2.11 },
    { id: 3, criterion: "Awards and Honors", category: "Artist Profile and Reputation", weight: 1.06 },
    { id: 4, criterion: "Education & Training", category: "Artist Profile and Reputation", weight: 0.53 },
    { id: 5, criterion: "Gallery Representation", category: "Artist Profile and Reputation", weight: 1.58 },
    { id: 6, criterion: "Published Catalogues/Monographs", category: "Artist Profile and Reputation", weight: 1.06 },
    { id: 7, criterion: "Signature Style / Innovation", category: "Artist Profile and Reputation", weight: 1.58 },
    { id: 8, criterion: "Volume of Works", category: "Artist Profile and Reputation", weight: 0.53 },
    { id: 9, criterion: "Collaborations & Public Works", category: "Artist Profile and Reputation", weight: 1.06 },
    { id: 10, criterion: "Artist Age / Active Period", category: "Artist Profile and Reputation", weight: 0.53 },
    { id: 11, criterion: "Auction/Resale History of Artist", category: "Artist Profile and Reputation", weight: 1.58 },
    { id: 12, criterion: "Collector Base & Followers", category: "Artist Profile and Reputation", weight: 1.06 },
    { id: 13, criterion: "Geographic/Cultural Origin", category: "Artist Profile and Reputation", weight: 0.53 },
    { id: 14, criterion: "External Endorsements", category: "Artist Profile and Reputation", weight: 0.53 },
    { id: 15, criterion: "Body of Work Popularity", category: "Artist Profile and Reputation", weight: 0.53 },
    { id: 16, criterion: "Provenance Records", category: "Artwork Authenticity and Provenance", weight: 3.25 },
    { id: 17, criterion: "Certificate of Authenticity", category: "Artwork Authenticity and Provenance", weight: 1.95 },
    { id: 18, criterion: "Catalogue Raisonné Entry", category: "Artwork Authenticity and Provenance", weight: 1.30 },
    { id: 19, criterion: "Ownership Verification", category: "Artwork Authenticity and Provenance", weight: 1.30 },
    { id: 20, criterion: "Stolen/Disputed History", category: "Artwork Authenticity and Provenance", weight: 1.30 },
    { id: 21, criterion: "Blockchain/Digital Provenance", category: "Artwork Authenticity and Provenance", weight: 0.65 },
    { id: 22, criterion: "Trademark/Copyright Clearance", category: "Artwork Authenticity and Provenance", weight: 0.65 },
    { id: 23, criterion: "Authenticity Seals/Tags", category: "Artwork Authenticity and Provenance", weight: 0.65 },
    { id: 24, criterion: "Scientific/Forensic Analysis", category: "Artwork Authenticity and Provenance", weight: 0.65 },
    { id: 25, criterion: "Signature or Inscription", category: "Artwork Authenticity and Provenance", weight: 0.65 },
    { id: 26, criterion: "Condition Report/Restoration Records", category: "Artwork Authenticity and Provenance", weight: 1.30 },
    { id: 27, criterion: "Insurance/Appraisal Documentation", category: "Artwork Authenticity and Provenance", weight: 1.30 },
    { id: 28, criterion: "Medium & Materials", category: "Materials, Technique, and Craftsmanship", weight: 1.67 },
    { id: 29, criterion: "Technical Skill & Complexity", category: "Materials, Technique, and Craftsmanship", weight: 1.11 },
    { id: 30, criterion: "Innovation in Technique", category: "Materials, Technique, and Craftsmanship", weight: 0.55 },
    { id: 31, criterion: "Size/Scale", category: "Materials, Technique, and Craftsmanship", weight: 1.11 },
    { id: 32, criterion: "Edition Size", category: "Materials, Technique, and Craftsmanship", weight: 1.11 },
    { id: 33, criterion: "Surface/Support Quality", category: "Materials, Technique, and Craftsmanship", weight: 0.55 },
    { id: 34, criterion: "Frame/Presentation", category: "Materials, Technique, and Craftsmanship", weight: 0.55 },
    { id: 35, criterion: "Medium Scarcity", category: "Materials, Technique, and Craftsmanship", weight: 0.55 },
    { id: 36, criterion: "Color Quality", category: "Materials, Technique, and Craftsmanship", weight: 0.55 },
    { id: 37, criterion: "Multimedia/Interactive Features", category: "Materials, Technique, and Craftsmanship", weight: 0.55 },
    { id: 38, criterion: "Condition of Materials", category: "Materials, Technique, and Craftsmanship", weight: 1.11 },
    { id: 39, criterion: "Technique Rarity", category: "Materials, Technique, and Craftsmanship", weight: 0.55 },
    { id: 40, criterion: "Time Invested", category: "Materials, Technique, and Craftsmanship", weight: 0.55 },
    { id: 41, criterion: "Work Complexity", category: "Materials, Technique, and Craftsmanship", weight: 0.55 },
    { id: 42, criterion: "Uniqueness of Format", category: "Materials, Technique, and Craftsmanship", weight: 0.55 },
    { id: 43, criterion: "Subject Matter", category: "Aesthetic and Artistic Content", weight: 1.11 },
    { id: 44, criterion: "Cultural Significance", category: "Aesthetic and Artistic Content", weight: 1.67 },
    { id: 45, criterion: "Emotional/Visual Impact", category: "Aesthetic and Artistic Content", weight: 1.11 },
    { id: 46, criterion: "Symbolism & Depth", category: "Aesthetic and Artistic Content", weight: 0.55 },
    { id: 47, criterion: "Stylistic Rarity", category: "Aesthetic and Artistic Content", weight: 1.11 },
    { id: 48, criterion: "Artistic Innovation", category: "Aesthetic and Artistic Content", weight: 0.55 },
    { id: 49, criterion: "Visual Harmony", category: "Aesthetic and Artistic Content", weight: 0.55 },
    { id: 50, criterion: "Historical Context", category: "Aesthetic and Artistic Content", weight: 1.11 },
    { id: 51, criterion: "Scale in Narrative", category: "Aesthetic and Artistic Content", weight: 0.55 },
    { id: 52, criterion: "Figurative vs. Abstract", category: "Aesthetic and Artistic Content", weight: 0.55 },
    { id: 53, criterion: "Iconography", category: "Aesthetic and Artistic Content", weight: 0.55 },
    { id: 54, criterion: "Color Usage", category: "Aesthetic and Artistic Content", weight: 0.55 },
    { id: 55, criterion: "Subject Popularity", category: "Aesthetic and Artistic Content", weight: 0.55 },
    { id: 56, criterion: "Design Elements", category: "Aesthetic and Artistic Content", weight: 0.55 },
    { id: 57, criterion: "Authentic Narrative", category: "Aesthetic and Artistic Content", weight: 0.55 },
    { id: 58, criterion: "Physical Condition", category: "Condition and Conservation", weight: 2.94 },
    { id: 59, criterion: "Restoration Quality", category: "Condition and Conservation", weight: 1.76 },
    { id: 60, criterion: "Aging / Patina", category: "Condition and Conservation", weight: 0.59 },
    { id: 61, criterion: "Environmental Durability", category: "Condition and Conservation", weight: 0.59 },
    { id: 62, criterion: "Conservation History", category: "Condition and Conservation", weight: 0.59 },
    { id: 63, criterion: "Signed vs. Unsigned State", category: "Condition and Conservation", weight: 1.18 },
    { id: 64, criterion: "Presentation State", category: "Condition and Conservation", weight: 0.59 },
    { id: 65, criterion: "Framing / Mounting", category: "Condition and Conservation", weight: 0.59 },
    { id: 66, criterion: "Completeness", category: "Condition and Conservation", weight: 0.59 },
    { id: 67, criterion: "Original Components", category: "Condition and Conservation", weight: 0.59 },
    { id: 68, criterion: "Comparable Sales", category: "Market Performance and Sales History", weight: 2.00 },
    { id: 69, criterion: "Auction House / Gallery Prestige", category: "Market Performance and Sales History", weight: 1.34 },
    { id: 70, criterion: "Current Market Trends", category: "Market Performance and Sales History", weight: 1.34 },
    { id: 72, criterion: "Liquidity & Demand", category: "Market Performance and Sales History", weight: 0.67 },
    { id: 73, criterion: "Collector Base", category: "Market Performance and Sales History", weight: 0.67 },
    { id: 77, criterion: "Rarity of the Artwork", category: "Market Performance and Sales History", weight: 1.34 },
    { id: 78, criterion: "Buyer & Seller Reputation", category: "Market Performance and Sales History", weight: 0.67 },
    { id: 79, criterion: "Location of Sale", category: "Market Performance and Sales History", weight: 0.67 },
    { id: 80, criterion: "Seasonality", category: "Market Performance and Sales History", weight: 0.67 },
    { id: 82, criterion: "Display History", category: "Market Performance and Sales History", weight: 0.67 },
    { id: 71, criterion: "Economic Conditions (71+75 combined)", category: "Economic and Investment Considerations", weight: 1.49 },
    { id: 74, criterion: "Tax & Customs", category: "Economic and Investment Considerations", weight: 0.75 },
    { id: 76, criterion: "Investment Performance", category: "Economic and Investment Considerations", weight: 1.50 },
    { id: 81, criterion: "Commission & Fees", category: "Economic and Investment Considerations", weight: 0.75 },
    { id: 83, criterion: "Cultural Heritage", category: "Cultural Significance and Social Impact", weight: 2.07 },
    { id: 84, criterion: "Historical Era", category: "Cultural Significance and Social Impact", weight: 1.38 },
    { id: 85, criterion: "Social Impact", category: "Cultural Significance and Social Impact", weight: 0.69 },
    { id: 86, criterion: "Diversity & Representation", category: "Cultural Significance and Social Impact", weight: 0.69 },
    { id: 87, criterion: "Celebrity Subjects", category: "Cultural Significance and Social Impact", weight: 0.69 },
    { id: 88, criterion: "Community Engagement", category: "Cultural Significance and Social Impact", weight: 0.69 },
    { id: 89, criterion: "Artistic Freedom", category: "Cultural Significance and Social Impact", weight: 0.69 },
    { id: 90, criterion: "Popularity Among Young Collectors", category: "Cultural Significance and Social Impact", weight: 0.69 },
    { id: 91, criterion: "Philanthropic Tie-ins", category: "Cultural Significance and Social Impact", weight: 0.69 },
    { id: 92, criterion: "Pop-Culture Relevance", category: "Cultural Significance and Social Impact", weight: 0.69 },
    { id: 93, criterion: "Publicity & Media", category: "Cultural Significance and Social Impact", weight: 0.69 },
    { id: 94, criterion: "Creation Method – Human vs. AI", category: "AI Involvement and Digital Aspects", weight: 3.32 },
    { id: 95, criterion: "Degree of AI Assistance", category: "AI Involvement and Digital Aspects", weight: 1.33 },
    { id: 96, criterion: "Transparency of AI Use", category: "AI Involvement and Digital Aspects", weight: 0.66 },
    { id: 97, criterion: "Training Data Ethics", category: "AI Involvement and Digital Aspects", weight: 0.66 },
    { id: 98, criterion: "Innovation with AI", category: "AI Involvement and Digital Aspects", weight: 0.66 },
    { id: 99, criterion: "Digital Certificate / Hash", category: "AI Involvement and Digital Aspects", weight: 0.66 },
    { id: 100, criterion: "Originality / Plagiarism Risk/Originality Ethics", category: "Originality and Ethical Considerations", weight: 3.29 },
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
  scores: z.array(AiCriterionScoreSchema).optional().describe('An array of scores for each ArtScoreChecklist criterion. ONLY provide if isAuthentic is true.'),
  valuationScores: z.array(AiCriterionScoreSchema).optional().describe('An array of scores for each ArtValueEst criterion. ONLY provide if isAuthentic is true.'),
  minPriceAI: z.number().optional().describe("The AI's estimated minimum market price in INR (AMIN). ONLY provide if isAuthentic is true."),
  maxPriceAI: z.number().optional().describe("The AI's estimated maximum market price in INR (AMAX). ONLY provide if isAuthentic is true."),
});

const valuationBreakdownItemSchema = z.object({
    id: z.number(),
    criterion: z.string(),
    category: z.string(),
    score: z.number(),
    weight: z.number(),
    weightedScore: z.number(),
});
export type ValuationBreakdownItem = z.infer<typeof valuationBreakdownItemSchema>;

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
        valuationBreakdown: z.array(valuationBreakdownItemSchema),
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
        })),
        valuationScores: ArtValueEstCriteria.map(item => ({
            id: item.id,
            score: Math.floor(Math.random() * 6) + 4
        })),
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

    const valuationBreakdown: ValuationBreakdownItem[] = [];
    const valuationScoresMap = new Map(mockAiOutput.valuationScores.map(item => [item.id, item.score]));
    ArtValueEstCriteria.forEach(item => {
        const score = valuationScoresMap.get(item.id) || 0;
        valuationBreakdown.push({
            id: item.id,
            criterion: item.criterion,
            category: item.category,
            score: score,
            weight: item.weight,
            weightedScore: (score / 10) * item.weight,
        });
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
    const P_regression = Math.exp(6.2 + 0.015 * Q);

    const P_avg = (P_linear + P_regression) / 2;
    const crestoxPriceRange: [number, number] = [Math.round(P_avg * 0.9), Math.round(P_avg * 1.1)];

    return { 
        status: 'success',
        evaluation: { finalScore: Math.round(finalScore), grade, breakdown, valuationBreakdown, crestoxPriceRange }
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
You are a world-leading expert in digital art forensics and authentication for Crestox. Your task is to provide a consistent, independent valuation. Your valuation MUST NOT be affected by user-provided price bounds.

**Step 1: Mandatory Forensic Authenticity & Plagiarism Check**
This is the most critical step.
- **Plagiarism Check:** Compare the image against your knowledge of art history. If it's a copy, set \`isAuthentic\` to \`false\` and explain in \`authenticityConcern\`.
- **AI-Generated Image Analysis:** Scrutinize for AI artifacts (hands, text, textures, lighting). If AI-generated, set \`isAuthentic\` to \`false\` and explain the issue.
- **Decision:** If not authentic, stop here. If authentic, proceed to Step 2.

**Step 2: Full Evaluation (ONLY if Authenticity is confirmed)**
You must complete three tasks:
1.  **ArtScoreChecklist Scoring:** Provide a score (0-10) for EVERY criterion (IDs 1-100) from the ArtScoreChecklist below. Return this in the \`scores\` field.
2.  **ArtValueEst Scoring:** Provide a score (0-10) for EVERY criterion (IDs 1-100) from the ArtValueEst rubric. Return this in the \`valuationScores\` field.
3.  **Independent Valuation (INR):** Provide your expert, independent market valuation range (\`minPriceAI\` and \`maxPriceAI\`) in INR. This MUST be based solely on your analysis of the artwork and context, ignoring any user-provided estimates.

---
**Table 1: ArtScoreChecklist Rubric (for Quality Score - 'scores' field)**
${ArtScoreChecklist.map(item => `| ${item.id} | ${item.criterion} | ${item.weight}% |`).join('\n')}

---
**Table 2: ArtValueEst Rubric (for Valuation - 'valuationScores' field)**
${ArtValueEstCriteria.map(item => `| ${item.id} | ${item.criterion} | ${item.category} |`).join('\n')}

---
**CONTEXT FOR EVALUATION**
**Artwork Information:**
- Title: {{{title}}}
- Description: {{{description}}}
- Materials Used: {{{materials}}}
- Artwork Size: {{{artworkSize}}}
- Subject/Cultural Significance: {{{subjectSignificance}}}
- Personal/Emotional Significance: {{{personalSignificance}}}
- Time Spent / Effort: {{{timeEffort}}}
- Biographical/Contextual Relevance: {{{biographicalContext}}}
- Commission/Patronage: {{{commissionPatronage}}}
**Artist Information:**
- Artist Bio: {{{artistBio}}}
- Artist Awards: {{{artistAwards}}}
- Artist Exhibitions: {{{artistExhibitions}}}

---
**ARTWORK TO ANALYZE**
{{media url=photoDataUri}}

---
Begin your analysis. First, authenticity. If authentic, provide both scorecards and your independent price range.
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

    if (!output.scores || !output.valuationScores || output.minPriceAI === undefined || output.maxPriceAI === undefined) {
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
    
    const valuationBreakdown: ValuationBreakdownItem[] = [];
    const valuationScoresMap = new Map(output.valuationScores.map(item => [item.id, item.score]));
    ArtValueEstCriteria.forEach(item => {
        const score = valuationScoresMap.get(item.id) || 0; // Default to 0 if not found
        valuationBreakdown.push({
            id: item.id,
            criterion: item.criterion,
            category: item.category,
            score: score,
            weight: item.weight,
            weightedScore: (score / 10) * item.weight,
        });
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
        evaluation: { finalScore: Math.round(finalScore), grade, breakdown, valuationBreakdown, crestoxPriceRange }
    };
  }
);
