
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import type { CollectorInfo, PublicUser } from '@/lib/data';
import { CollectorCard } from './collector-card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';


interface ArtistCollectorsListProps {
    artistId: string;
}

interface CollectorStats {
    onSaleCount: number;
    cheapestPrice?: number;
}

export function ArtistCollectorsList({ artistId }: ArtistCollectorsListProps) {
    const { getCollectorsForArtist, allUsers, resaleListings } = useAuth();
    const [collectors, setCollectors] = useState<CollectorInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const usersMap = useMemo(() => new Map(allUsers.map(u => [u.id, u])), [allUsers]);

    useEffect(() => {
        const fetchCollectors = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getCollectorsForArtist(artistId);
                setCollectors(data);
            } catch (err) {
                console.error("Failed to fetch collectors:", err);
                const errorMessage = (err as Error).message || "An unknown error occurred.";
                
                if (errorMessage.toLowerCase().includes("permission-denied") || errorMessage.toLowerCase().includes("requires an index")) {
                     setError("Could not load collectors. This is likely due to a missing database index. Please open the browser's developer console (F12), look for a Firestore error message, and click the link to create the required index in your Firebase console.");
                } else {
                    setError("An error occurred while fetching the list of collectors.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (artistId && allUsers.length > 0) {
          fetchCollectors();
        } else if (!allUsers.length && !isLoading) {
          // If allUsers hasn't loaded, wait. If it's loaded and empty, proceed.
          setIsLoading(false);
        }

    }, [artistId, getCollectorsForArtist, allUsers, isLoading]);

    const collectorsWithStats = useMemo(() => {
        return collectors.map(collector => {
            const user = usersMap.get(collector.userId);
            if (!user) return null;

            const collectorListings = resaleListings.filter(
                l => l.resellerId === collector.userId && l.artistId === artistId && l.status === 'active'
            );

            const stats: CollectorStats = { onSaleCount: 0 };
            
            if (collectorListings.length > 0) {
                stats.onSaleCount = collectorListings.reduce((sum, l) => sum + l.quantity, 0);
                
                const prices = collectorListings.map(l => l.minPrice);
                stats.cheapestPrice = Math.min(...prices);
            }

            return { user, stats, ownedCount: collector.ownedCount };
        }).filter(Boolean) as { user: PublicUser, stats: CollectorStats, ownedCount: number }[];
    }, [collectors, usersMap, resaleListings, artistId]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (collectorsWithStats.length === 0) {
        return (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                Be the first to collect a fractal from this artist!
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collectorsWithStats.map(item => (
                <CollectorCard 
                    key={item.user.id}
                    collector={item.user}
                    stats={item.stats}
                    ownedCount={item.ownedCount}
                />
            ))}
        </div>
    );
}
