
import { z } from 'zod';
import type { ValuationBreakdownItem } from '@/ai/flows/evaluate-artwork-flow';

// --- Static, Permanent Mock Data ---

// Hardcoding the full, correct public URLs for reliability.
const staticArtists = [
    { id: 'mock-artist-1', name: 'Priya Patel', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistOne%2Fartist-avatar.jpg?alt=media&token=e9b74052-64f3-4a1b-85d7-939e14588e2c' },
    { id: 'mock-artist-2', name: 'Rohan Mehta', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistTwo%2Fartist-avatar.jpg?alt=media&token=8d2e8b0b-783a-4a62-8178-3850604c53c4' },
    { id: 'mock-artist-3', name: 'Aarav Shah', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistThree%2Fartist-avatar.jpg?alt=media&token=8e9e1b21-827c-4d5c-9c97-6e9e4e402778' },
    { id: 'mock-artist-4', name: 'Isha Joshi', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistFour%2Fartist-avatar.jpg?alt=media&token=d84b8e21-d703-4f9e-b148-5c4644a49938' },
    { id: 'mock-artist-5', name: 'Kian Desai', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistFive%2Fartist-avatar.jpg?alt=media&token=d18c9429-2244-4f95-9271-9f2d12e69312' },
    { id: 'mock-artist-6', name: 'Mira Trivedi', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistSix%2Fartist-avatar.jpg?alt=media&token=8c614b8a-3607-4c74-90a6-4a5585b1a7d8' },
    { id: 'mock-artist-7', name: 'Arjun Dave', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistSeven%2Fartist-avatar.jpg?alt=media&token=9633c3e8-5b48-4e89-9a02-5c02b283d6a2' },
    { id: 'mock-artist-8', name: 'Diya Sharma', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistEight%2Fartist-avatar.jpg?alt=media&token=7c1c5e4a-9e7c-4e8e-b5f7-4f6c1e9e7e7a' },
];

const staticArtworks = [
    // Priya Patel (Artist One)
    { artistId: 'mock-artist-1', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistOne%2Fartwork1.jpg?alt=media&token=6e2e5c8e-8a8b-4c1c-9e2e-5c8e8a8b4c1c' },
    { artistId: 'mock-artist-1', title: 'Artwork 2', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistOne%2Fartwork2.jpg?alt=media&token=7d3d6f9f-9b9c-4d2d-8f3f-6f9f9b9c4d2d' },
    { artistId: 'mock-artist-1', title: 'Artwork 3', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistOne%2Fartwork3.jpg?alt=media&token=8e4e7a0a-acac-4e3e-9a4a-7a0aacac4e3e' },
    { artistId: 'mock-artist-1', title: 'Artwork 4', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistOne%2Fartwork4.jpg?alt=media&token=9f5f8b1b-bdbd-4f4f-8b5b-8b1bbdbd4f4f' },

    // Rohan Mehta (Artist Two)
    { artistId: 'mock-artist-2', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistTwo%2Fartwork1.jpg?alt=media&token=af6fae2c-cece-4f5f-ae2c-cece4f5fae2c' },
    { artistId: 'mock-artist-2', title: 'Artwork 2', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistTwo%2Fartwork2.jpg?alt=media&token=b070bf3d-dfdf-4060-bf3d-dfdf4060bf3d' },
    
    // Aarav Shah (Artist Three)
    { artistId: 'mock-artist-3', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistThree%2Fartwork1.jpg?alt=media&token=c181d04e-f0f0-4171-d04e-f0f04171d04e' },
    { artistId: 'mock-artist-3', title: 'Artwork 2', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistThree%2Fartwork2.jpg?alt=media&token=d292e15f-0101-4282-e15f-01014282e15f' },
    { artistId: 'mock-artist-3', title: 'Artwork 3', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistThree%2Fartwork3.jpg?alt=media&token=e3a3f260-1212-4393-f260-12124393f260' },

    // Isha Joshi (Artist Four)
    { artistId: 'mock-artist-4', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistFour%2Fartwork1.jpg?alt=media&token=f4b40371-2323-44a4-0371-232344a40371' },

    // Kian Desai (Artist Five)
    { artistId: 'mock-artist-5', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistFive%2Fartwork1.jpg?alt=media&token=05c51482-3434-45b5-1482-343445b51482' },
    { artistId: 'mock-artist-5', title: 'Artwork 2', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistFive%2Fartwork2.jpg?alt=media&token=16d62593-4545-46c6-2593-454546c62593' },

    // Mira Trivedi (Artist Six)
    { artistId: 'mock-artist-6', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistSix%2Fartwork1.jpg?alt=media&token=27e736a4-5656-47d7-36a4-565647d736a4' },
    { artistId: 'mock-artist-6', title: 'Artwork 2', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistSix%2Fartwork2.jpg?alt=media&token=38f847b5-6767-48e8-47b5-676748e847b5' },
    { artistId: 'mock-artist-6', title: 'Artwork 3', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistSix%2Fartwork3.jpg?alt=media&token=490958c6-7878-49f9-58c6-787849f958c6' },

    // Arjun Dave (Artist Seven)
    { artistId: 'mock-artist-7', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistSeven%2Fartwork1.jpg?alt=media&token=5a1a69d7-8989-4a0a-69d7-89894a0a69d7' },

    // Diya Sharma (Artist Eight)
    { artistId: 'mock-artist-8', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistEight%2Fartwork1.jpg?alt=media&token=6b2b7ae8-9a9a-4b1b-7ae8-9a9a4b1b7ae8' },
    { artistId: 'mock-artist-8', title: 'Artwork 2', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistEight%2Fartwork2.jpg?alt=media&token=7c3c8bf9-abab-4c2c-8bf9-abab4c2c8bf9' },
];


// --- Generate Data Structures from Static Source ---

const generatedFractals = staticArtworks.map((artwork, index) => {
    const price = Math.floor(Math.random() * (250 - 15 + 1) + 15) * 100;
    const aiScore = Math.floor(Math.random() * (95 - 45 + 1) + 45);
    let crestoxGrade = 'A-';
    if (aiScore > 85) crestoxGrade = 'AAA';
    else if (aiScore > 70) crestoxGrade = 'AA';
    else if (aiScore > 55) crestoxGrade = 'A+';
    else if (aiScore > 40) crestoxGrade = 'A';

    const editions = Math.floor(Math.random() * 40 + 10) * 5;
    
    return {
        id: `fractal-mock-${index + 1}`,
        title: artwork.title,
        images: [artwork.url],
        heroImage: artwork.url,
        artistId: artwork.artistId,
        description: 'A captivating piece from the artist\'s collection, showcasing a unique blend of color and form.',
        materials: 'Digital Render on Archival Paper',
        artworkSize: { length: 1920, breadth: 1080, unit: 'px' as const },
        aiHint: 'abstract digital art',
        width: 1920,
        height: 1080,
        price,
        priceHistory: [{ date: new Date().toISOString(), price: price }],
        status: 'active' as const,
        editions,
        editionsAvailable: editions,
        aiScore,
        crestoxGrade,
    };
}).filter(Boolean) as Fractal[];


const generatedArtists = staticArtists.map(artist => {
    const artistFractals = generatedFractals.filter(f => f.artistId === artist.id);
    const totalPortfolioValue = artistFractals.reduce((sum, f) => sum + f.price, 0);
    const totalEditions = artistFractals.reduce((sum, f) => sum + (f.editions || 0), 0);
    const availableEditions = artistFractals.reduce((sum, f) => sum + (f.editionsAvailable || 0), 0);
    const fractalPrice = totalEditions > 0 ? Math.round((totalPortfolioValue / totalEditions)) : 0;
    const totalScoreWeightedValuation = artistFractals.reduce((sum, f) => sum + ((f.aiScore || 0) * f.price), 0);
    const sumOfScoresSquared = artistFractals.reduce((sum, f) => sum + ((f.aiScore || 0) ** 2), 0);
    const kFactor = totalScoreWeightedValuation > 0 ? totalPortfolioValue / totalScoreWeightedValuation : 0;

    return {
        id: artist.id,
        name: artist.name,
        avatar: artist.avatar,
        bio: `An esteemed artist from Gujarat, known for a unique and captivating style that blends traditional motifs with modern digital techniques.`,
        artistMessage: `Thank you for supporting my creative journey. Each piece is a part of my story, and I am glad to share it with you.`,
        fractalPrice,
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
        location: 'Gujarat, India',
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

    