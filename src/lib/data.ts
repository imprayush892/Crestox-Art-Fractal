
import { z } from 'zod';
import type { ValuationBreakdownItem } from '@/ai/flows/evaluate-artwork-flow';

// --- Static, Permanent Mock Data ---

// Helper function to build the full, correct public URL for Firebase Storage images.
// This function correctly encodes filenames to handle spaces and special characters.
const getFirebaseImageUrl = (artistFolder: string, artworkTitle: string) => {
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'crestox-giok1.firebasestorage.app';
    const filename = `${artworkTitle}.png`;
    // Correctly constructs the URL, encoding the file path for safety.
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/MockArtWork%2F${encodeURIComponent(artistFolder)}%2F${encodeURIComponent(filename)}?alt=media`;
};

// Based on the user-provided structure.
const staticArtists = [
    { id: 'mock-artist-1', folder: 'Artist One', name: 'Priya Patel' },
    { id: 'mock-artist-2', folder: 'Artist Two', name: 'Rohan Mehta' },
    { id: 'mock-artist-3', folder: 'Artist Three', name: 'Aarav Shah' },
    { id: 'mock-artist-4', folder: 'Artist Four', name: 'Isha Joshi' },
    { id: 'mock-artist-5', folder: 'Artist Five', name: 'Kian Desai' },
    { id: 'mock-artist-6', folder: 'Artist Six', name: 'Mira Trivedi' },
    { id: 'mock-artist-7', folder: 'Artist Seven', name: 'Arjun Dave' },
    { id: 'mock-artist-8', folder: 'Artist Eight', name: 'Diya Sharma' },
];

const staticArtworks = [
    // Artist One
    { artistId: 'mock-artist-1', folder: 'Artist One', title: 'Royal Procession Miniature' },
    { artistId: 'mock-artist-1', folder: 'Artist One', title: 'Krishna Radha Miniature' },
    { artistId: 'mock-artist-1', folder: 'Artist One', title: 'Royal Court Miniature' },
    { artistId: 'mock-artist-1', folder: 'Artist One', title: 'Moonlit Palace Miniature' },
    { artistId: 'mock-artist-1', folder: 'Artist One', title: 'Cheriyal Village Festival' },

    // Artist Two
    { artistId: 'mock-artist-2', folder: 'Artist Two', title: 'Dance Movement Abstract' },
    { artistId: 'mock-artist-2', folder: 'Artist Two', title: 'Temple Geometry Abstract' },
    { artistId: 'mock-artist-2', folder: 'Artist Two', title: 'Lotus Meditation Abstract' },
    { artistId: 'mock-artist-2', folder: 'Artist Two', title: 'Textile Pattern Abstract' },

    // Artist Three
    { artistId: 'mock-artist-3', folder: 'Artist Three', title: 'Madhubani Village Life' },
    { artistId: 'mock-artist-3', folder: 'Artist Three', title: 'Gond Forest Spirits' },
    { artistId: 'mock-artist-3', folder: 'Artist Three', title: 'Warli Harvest Dance' },
    { artistId: 'mock-artist-3', folder: 'Artist Three', title: 'Tribal Geometry Abstract' },

    // Artist Four
    { artistId: 'mock-artist-4', folder: 'Artist Four', title: 'Urban Mughal Abstract' },
    { artistId: 'mock-artist-4', folder: 'Artist Four', title: 'Bauhaus Indian Architecture' },

    // Artist Five
    { artistId: 'mock-artist-5', folder: 'Artist Five', title: 'Kalamkari Epic Tale' },
    { artistId: 'mock-artist-5', folder: 'Artist Five', title: 'Pattachitra Krishna Leela' },
    { artistId: 'mock-artist-5', folder: 'Artist Five', title: 'Phad Heroic Legend' },

    // Artist Six
    { artistId: 'mock-artist-6', folder: 'Artist Six', title: 'Urban Holi Moment' },
    { artistId: 'mock-artist-6', folder: 'Artist Six', title: 'Tribal Elder Portrait' },
    { artistId: 'mock-artist-6', folder: 'Artist Six', title: 'Varanasi Dawn Panorama' },
    { artistId: 'mock-artist-6', folder: 'Artist Six', title: 'Ellora Nataraja Relief' },
    { artistId: 'mock-artist-6', folder: 'Artist Six', title: 'Hoysala Procession Frieze' },
    
    // Artist Seven
    { artistId: 'mock-artist-7', folder: 'Artist Seven', title: 'Bollywood Heritage Collage' },
    { artistId: 'mock-artist-7', folder: 'Artist Seven', title: 'Architectural Heritage Collage' },
    { artistId: 'mock-artist-7', folder: 'Artist Seven', title: 'Performing Arts Collage' },
    { artistId: 'mock-artist-7', folder: 'Artist Seven', title: 'Spice Heritage Collage' },
    { artistId: 'mock-artist-7', folder: 'Artist Seven', title: 'Adornment Heritage Collage' },
    { artistId: 'mock-artist-7', folder: 'Artist Seven', title: 'Spiritual Landscape Collage' },
    { artistId: 'mock-artist-7', folder: 'Artist Seven', title: 'Festival Heritage Collage' },
    
    // Artist Eight
    { artistId: 'mock-artist-8', folder: 'Artist Eight', title: 'Cubist Dance Mudras' },
    { artistId: 'mock-artist-8', folder: 'Artist Eight', title: 'Constructivist Textile Patterns' },
    { artistId: 'mock-artist-8', folder: 'Artist Eight', title: 'De Stijl Kolam Patterns' },
    { artistId: 'mock-artist-8', folder: 'Artist Eight', title: 'Suprematist Indian Geometry' },
];


// --- Generate Data Structures from Static Source ---

const generatedFractals = staticArtworks.map((artwork, index) => {
    // THIS IS THE FIX: The URL is now generated from the artwork's specific title.
    const imageUrl = getFirebaseImageUrl(artwork.folder, artwork.title);
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
        images: [imageUrl],
        heroImage: imageUrl,
        artistId: artwork.artistId,
        description: 'A captivating piece from the artist\'s collection, showcasing a unique blend of color and form.',
        materials: 'Digital Render on Archival Paper',
        artworkSize: { length: 1080, breadth: 1080, unit: 'px' as const },
        aiHint: 'traditional indian art',
        width: 1080,
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
    const avatarUrl = getFirebaseImageUrl(artist.folder, 'artist-avatar');

    return {
        id: artist.id,
        name: artist.name,
        avatar: avatarUrl,
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
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpeg", "image/png", "image/webp"];

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

    

    