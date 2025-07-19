
import { z } from 'zod';
import type { ValuationBreakdownItem } from '@/ai/flows/evaluate-artwork-flow';

// --- Static, Permanent Mock Data ---

// Hardcoding the full, correct public URLs for reliability.
const staticArtists = [
    { id: 'mock-artist-1', name: 'Priya Patel', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistOne%2Fartist-avatar.jpg?alt=media' },
    { id: 'mock-artist-2', name: 'Rohan Mehta', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistTwo%2Fartist-avatar.jpg?alt=media' },
    { id: 'mock-artist-3', name: 'Aarav Shah', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistThree%2Fartist-avatar.jpg?alt=media' },
    { id: 'mock-artist-4', name: 'Isha Joshi', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistFour%2Fartist-avatar.jpg?alt=media' },
    { id: 'mock-artist-5', name: 'Kian Desai', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistFive%2Fartist-avatar.jpg?alt=media' },
    { id: 'mock-artist-6', name: 'Mira Trivedi', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistSix%2Fartist-avatar.jpg?alt=media' },
    { id: 'mock-artist-7', name: 'Arjun Dave', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistSeven%2Fartist-avatar.jpg?alt=media' },
    { id: 'mock-artist-8', name: 'Diya Sharma', avatar: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistEight%2Fartist-avatar.jpg?alt=media' },
];

const staticArtworks = [
    // Priya Patel (Artist One)
    { artistId: 'mock-artist-1', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistOne%2Fartwork1.jpg?alt=media' },
    { artistId: 'mock-artist-1', title: 'Artwork 2', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistOne%2Fartwork2.jpg?alt=media' },
    { artistId: 'mock-artist-1', title: 'Artwork 3', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistOne%2Fartwork3.jpg?alt=media' },
    { artistId: 'mock-artist-1', title: 'Artwork 4', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistOne%2Fartwork4.jpg?alt=media' },
    
    // Rohan Mehta (Artist Two)
    { artistId: 'mock-artist-2', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistTwo%2Fartwork1.jpg?alt=media' },
    { artistId: 'mock-artist-2', title: 'Artwork 2', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistTwo%2Fartwork2.jpg?alt=media' },
    
    // Aarav Shah (Artist Three)
    { artistId: 'mock-artist-3', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistThree%2Fartwork1.jpg?alt=media' },
    { artistId: 'mock-artist-3', title: 'Artwork 2', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistThree%2Fartwork2.jpg?alt=media' },
    { artistId: 'mock-artist-3', title: 'Artwork 3', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistThree%2Fartwork3.jpg?alt=media' },
    
    // Isha Joshi (Artist Four)
    { artistId: 'mock-artist-4', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistFour%2Fartwork1.jpg?alt=media' },
    
    // Kian Desai (Artist Five)
    { artistId: 'mock-artist-5', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistFive%2Fartwork1.jpg?alt=media' },
    { artistId: 'mock-artist-5', title: 'Artwork 2', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistFive%2Fartwork2.jpg?alt=media' },
    
    // Mira Trivedi (Artist Six)
    { artistId: 'mock-artist-6', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistSix%2Fartwork1.jpg?alt=media' },
    { artistId: 'mock-artist-6', title: 'Artwork 2', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistSix%2Fartwork2.jpg?alt=media' },
    { artistId: 'mock-artist-6', title: 'Artwork 3', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistSix%2Fartwork3.jpg?alt=media' },
    
    // Arjun Dave (Artist Seven)
    { artistId: 'mock-artist-7', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistSeven%2Fartwork1.jpg?alt=media' },
    
    // Diya Sharma (Artist Eight)
    { artistId: 'mock-artist-8', title: 'Artwork 1', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistEight%2Fartwork1.jpg?alt=media' },
    { artistId: 'mock-artist-8', title: 'Artwork 2', url: 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/MockArtWork%2FArtistEight%2Fartwork2.jpg?alt=media' },
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
