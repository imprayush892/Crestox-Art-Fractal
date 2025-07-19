
import { z } from 'zod';
import type { ValuationBreakdownItem } from '@/ai/flows/evaluate-artwork-flow';

// --- Static, Correct Data ---

const staticArtists = [
    { id: 'artist-1', name: 'Anik Singha' },
    { id: 'artist-2', name: 'Arindam Bhowmick' },
    { id: 'artist-3', name: 'Bipul Roy' },
    { id: 'artist-4', name: 'Mrinmoy Mridha' },
    { id: 'artist-5', name: 'Rabi Dey' },
    { id: 'artist-6', name: 'Shubham DUTTA' },
    { id: 'artist-7', name: 'Shuvranshu Mondal' },
    { id: 'artist-8', name: 'Supratim Naskar' },
];

const staticArtworks = [
    // Anik Singha
    { artistId: 'artist-1', filename: 'Anik Singha - 1.jpg' },
    { artistId: 'artist-1', filename: 'Anik Singha - 2.jpg' },
    { artistId: 'artist-1', filename: 'Anik Singha - 3.jpg' },
    { artistId: 'artist-1', filename: 'Anik Singha - 4.jpg' },
    // Arindam Bhowmick
    { artistId: 'artist-2', filename: 'Arindam Bhowmick - 1.jpg' },
    { artistId: 'artist-2', filename: 'Arindam Bhowmick - 2.jpg' },
    { artistId: 'artist-2', filename: 'Arindam Bhowmick - 3.jpg' },
    // Bipul Roy
    { artistId: 'artist-3', filename: 'Bipul Roy - 1.jpg' },
    { artistId: 'artist-3', filename: 'Bipul Roy - 2.jpg' },
    { artistId: 'artist-3', filename: 'Bipul Roy - 3.jpg' },
    { artistId: 'artist-3', filename: 'Bipul Roy - 4.jpg' },
    // Mrinmoy Mridha
    { artistId: 'artist-4', filename: 'Mrinmoy Mridha - 1.jpg' },
    { artistId: 'artist-4', filename: 'Mrinmoy Mridha - 2.jpg' },
    { artistId: 'artist-4', filename: 'Mrinmoy Mridha - 3.jpg' },
    // Rabi Dey
    { artistId: 'artist-5', filename: 'Rabi Dey - 1.jpg' },
    { artistId: 'artist-5', filename: 'Rabi Dey - 2.jpg' },
    { artistId: 'artist-5', filename: 'Rabi Dey - 3.jpg' },
    // Shubham DUTTA
    { artistId: 'artist-6', filename: 'Shubham DUTTA - 1.jpg' },
    { artistId: 'artist-6', filename: 'Shubham DUTTA - 2.jpg' },
    // Shuvranshu Mondal
    { artistId: 'artist-7', filename: 'Shuvranshu Mondal - 1.jpg' },
    { artistId: 'artist-7', filename: 'Shuvranshu Mondal - 2.jpg' },
    { artistId: 'artist-7', filename: 'Shuvranshu Mondal - 3.jpg' },
    { artistId: 'artist-7', filename: 'Shuvranshu Mondal - 4.jpg' },
    { artistId: 'artist-7', filename: 'Shuvranshu Mondal - 5.jpg' },
    // Supratim Naskar
    { artistId: 'artist-8', filename: 'Supratim Naskar - 1.jpg' },
    { artistId: 'artist-8', filename: 'Supratim Naskar - 2.jpg' },
    { artistId: 'artist-8', filename: 'Supratim Naskar - 3.jpg' },
];

const getPublicUrl = (path: string) => {
    const storageBucket = "crestox-giok1.appspot.com";
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
};

// --- Generated Data from Static Source ---

const generatedFractals = staticArtworks.map((artwork, index) => {
    const price = Math.floor(Math.random() * (150 - 5 + 1) + 5) * 10;
    const aiScore = Math.floor(Math.random() * (95 - 30 + 1) + 30);
    let crestoxGrade = 'A-';
    if (aiScore > 80) crestoxGrade = 'AAA';
    else if (aiScore > 60) crestoxGrade = 'AA';
    else if (aiScore > 40) crestoxGrade = 'A+';
    else if (aiScore > 20) crestoxGrade = 'A';

    const editions = Math.floor(Math.random() * 19 + 1) * 5;
    const imageUrl = getPublicUrl(`artworks/${artwork.filename}`);

    return {
        id: `fractal-${index + 1}`,
        title: artwork.filename.replace('.jpg', '').replace(/ - \d+$/, ''),
        images: [imageUrl],
        heroImage: imageUrl,
        artistId: artwork.artistId,
        description: 'This is a beautiful piece of art from the collection.',
        materials: 'Digital Print on Canvas',
        artworkSize: { length: 800, breadth: 600, unit: 'px' as const },
        aiHint: 'fine art painting',
        width: 800,
        height: 600,
        price,
        priceHistory: [{ date: new Date().toISOString(), price: price }],
        status: 'active' as const,
        editions,
        editionsAvailable: editions,
        aiScore,
        crestoxGrade,
    };
});

const generatedArtists = staticArtists.map(artist => {
    const artistFractals = generatedFractals.filter(f => f.artistId === artist.id);
    const totalPortfolioValue = artistFractals.reduce((sum, f) => sum + f.price, 0);
    const totalEditions = artistFractals.reduce((sum, f) => sum + (f.editions || 0), 0);
    const availableEditions = artistFractals.reduce((sum, f) => sum + (f.editionsAvailable || 0), 0);
    const fractalPrice = totalEditions > 0 ? Math.round((totalPortfolioValue / totalEditions) * 100) / 100 : 0;
    const totalScoreWeightedValuation = artistFractals.reduce((sum, f) => sum + ((f.aiScore || 0) * f.price), 0);
    const sumOfScoresSquared = artistFractals.reduce((sum, f) => sum + ((f.aiScore || 0) ** 2), 0);
    const kFactor = totalScoreWeightedValuation > 0 ? totalPortfolioValue / totalScoreWeightedValuation : 0;

    return {
        id: artist.id,
        name: artist.name,
        avatar: getPublicUrl(`artists/${artist.name}.jpg`),
        bio: `An esteemed artist known for a unique and captivating style.`,
        artistMessage: `Thank you for supporting my creative journey.`,
        fractalPrice: fractalPrice,
        priceHistory: [{ date: new Date().toISOString(), price: fractalPrice }],
        totalPortfolioValue,
        totalPortfolioValueHistory: [{ date: new Date().toISOString(), value: totalPortfolioValue }],
        totalEditions,
        availableEditions,
        kFactor,
        totalScoreWeightedValuation,
        sumOfScoresSquared,
        awards: [],
        exhibitions: [],
    };
});


// --- Exports ---

export const artists: Artist[] = generatedArtists;
export const fractals: Fractal[] = generatedFractals;


// --- Zod Schemas and Other Interfaces (Unchanged) ---

export interface AIScorecardBreakdown {
  id: number;
  criterion: string;
  score: number;
  weight: number;
  weightedScore: number;
}

export interface ArtworkSize {
  length: number;
  breadth: number;
  height?: number;
  unit: 'in' | 'cm' | 'ft' | 'px';
}

export interface Award {
  value: string;
  image?: string;
}

export interface Exhibition {
  value: string;
  images?: string[];
}

export interface PreviouslySoldArtwork {
  name: string;
  artworkImage: string;
  proofOfSaleImage: string;
  saleValue: number;
}

export interface Notification {
  id:string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  type: 'artwork_flagged' | 'content_flagged' | 'artwork_unflagged' | 'content_unflagged' | 'manual_valuation_request' | 'manual_valuation_completed';
  relatedContent: {
    title: string; // e.g., Artwork title or "Your award image"
    url: string; // e.g., link to fractal detail page or artist page
  };
}

export interface AdminNotification {
  id: string;
  message: string;
  timestamp: string; // ISO string
  status: 'pending' | 'resolved';
  type: 'manual_valuation_request';
  relatedContent: {
    title: string;
    url: string;
  };
}

export interface Artist {
  id: string;
  userId?: string;
  name: string;
  avatar: string;
  bio: string;
  artistMessage?: string;
  location?: string;
  university?: string;
  website?: string;
  style?: string;
  awards: Award[];
  exhibitions: Exhibition[];
  previouslySoldArtworks?: PreviouslySoldArtwork[];
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  fractalPrice: number;
  priceHistory: { date: string; price: number }[];
  totalPortfolioValue: number;
  totalPortfolioValueHistory: { date: string; value: number }[];
  totalEditions: number;
  availableEditions: number;
  kFactor: number;
  totalScoreWeightedValuation: number;
  sumOfScoresSquared: number;
  flaggedImageUrls?: string[];
}

export interface Fractal {
  id: string;
  title: string;
  images: string[];
  heroImage: string;
  artistId: string;
  description: string;
  materials: string;
  artworkSize: ArtworkSize;
  aiHint: string;
  width: number;
  height: number;
  price: number; // This is Vi
  priceHistory: { date: string; price: number }[];
  status: 'active' | 'pending_review' | 'private';
  editions?: number;
  editionsAvailable?: number;
  aiScore?: number; // This is Si
  crestoxGrade?: string;
  aiScorecard?: AIScorecardBreakdown[];
  valuationBreakdown?: ValuationBreakdownItem[];
  crestoxPriceRange?: [number, number];
  artistMinEstimate?: number;
  artistMaxEstimate?: number;
  subjectSignificance?: string;
  personalSignificance?: string;
  timeEffort?: string;
  biographicalContext?: string;
  commissionPatronage?: string;
  isFlagged?: boolean;
}

// Combined view of a holding for the logged-in user
export interface OwnedFractal {
  id: string;
  fractalId: string;
  artistId: string;
  purchaseDate: string;
  purchasePrice: number;
  serialNumber: string;
  status: 'owned' | 'listed';
}

// Publicly visible holding data
export interface PublicHolding {
  fractalId: string;
  artistId: string;
  purchaseDate: string;
  status: 'owned' | 'listed';
}

// Private holding data, only visible to the owner
export interface PrivateHolding {
  purchasePrice: number;
  serialNumber: string;
}

export interface ResaleListing {
  id: string;
  artistId: string;
  resellerId: string;
  quantity: number;
  initialPrice: number;
  minPrice: number;
  periodSeconds: number;
  listingTimestamp: string; // ISO string
  status: 'active' | 'completed' | 'cancelled';
  holdingIds: string[];
}

export interface OrderBreakdownItem {
  price: number;
  quantity: number;
  source: 'ARTIST' | 'RESELLER';
  listingId?: string;
  resellerId?: string;
}

export interface PublicUser {
  id: string;
  name: string;
  avatar: string;
}

export interface CollectorInfo {
  userId: string;
  ownedCount: number;
}


const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const artworkFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(1000),
  materials: z.string().min(3, "Please specify the materials used."),
  length: z.coerce.number().min(0.1, "Length is required."),
  breadth: z.coerce.number().min(0.1, "Breadth is required."),
  height: z.coerce.number().optional(),
  unit: z.enum(['in', 'cm', 'ft', 'px']),
  minEstimatedValue: z.coerce.number().min(1, "Minimum value must be at least ₹1."),
  maxEstimatedValue: z.coerce.number(),
  editionsToIssue: z.coerce.number().int().min(0, "Cannot issue negative editions.").default(0),
  images: z.array(z.any())
    .min(1, "At least one image is required.")
    .max(3, "You can upload a maximum of 3 images.")
    .refine((files) => files.every((file) => file.size <= MAX_FILE_SIZE), `Max file size is 10MB.`)
    .refine(
      (files) => files.every((file) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  heroImageIndex: z.coerce.number().min(0).max(2).default(0),
  subjectSignificance: z.string().max(500).optional(),
  personalSignificance: z.string().max(500).optional(),
  timeEffort: z.string().max(500).optional(),
  biographicalContext: z.string().max(500).optional(),
  commissionPatronage: z.string().max(500).optional(),
}).refine(data => data.maxEstimatedValue >= data.minEstimatedValue, {
  message: "Maximum value must be greater than or equal to minimum value.",
  path: ["maxEstimatedValue"],
});

export type ArtworkFormValues = z.infer<typeof artworkFormSchema>;


export const editArtworkFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(1000),
  materials: z.string().min(3, "Please specify the materials used."),
  length: z.coerce.number().min(0.1, "Length is required."),
  breadth: z.coerce.number().min(0.1, "Breadth is required."),
  height: z.coerce.number().optional(),
  unit: z.enum(['in', 'cm', 'ft', 'px']),
  minEstimatedValue: z.coerce.number().min(1, "Minimum value must be at least ₹1.").optional(),
  maxEstimatedValue: z.coerce.number().optional(),
  editionsToIssue: z.coerce.number().int().min(0, "Cannot issue negative editions.").default(0),
  subjectSignificance: z.string().max(500).optional(),
  personalSignificance: z.string().max(500).optional(),
  timeEffort: z.string().max(500).optional(),
  biographicalContext: z.string().max(500).optional(),
  commissionPatronage: z.string().max(500).optional(),
  heroImage: z.string().optional(), // Now storing the hero image URL
}).refine(data => {
    if (data.minEstimatedValue !== undefined && data.maxEstimatedValue !== undefined) {
        return data.maxEstimatedValue >= data.minEstimatedValue;
    }
    return true;
}, {
  message: "Maximum value must be greater than or equal to minimum value.",
  path: ["maxEstimatedValue"],
});

export type EditArtworkFormValues = z.infer<typeof editArtworkFormSchema>;

export type CreateArtistProfileData = Omit<Artist, 'id' | 'avatar' | 'awards' | 'exhibitions' | 'previouslySoldArtworks' | 'fractalPrice' | 'priceHistory' | 'totalPortfolioValueHistory' | 'totalEditions' | 'availableEditions' | 'totalPortfolioValue' | 'kFactor' | 'totalScoreWeightedValuation' | 'sumOfScoresSquared'> & { 
  avatar?: File | string | null;
  awards: { value: string; image?: File | string | null }[];
  exhibitions: { value: string; images?: (File | string | null)[] }[];
  previouslySoldArtworks: { name: string; artworkImage: File | string | null; proofOfSaleImage: File | string | null; saleValue: number }[];
};

export type NewArtworkData = {
    title: string;
    description: string;
    materials: string;
    artworkSize: ArtworkSize;
    minEstimatedValue: number;
    maxEstimatedValue: number;
    editionsToIssue: number;
    images: (File | string)[]; 
    heroImageIndex: number; 
    subjectSignificance?: string;
    personalSignificance?: string;
    timeEffort?: string;
    biographicalContext?: string;
    commissionPatronage?: string;
}
