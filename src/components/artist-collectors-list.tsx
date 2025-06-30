
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import type { CollectorInfo, PublicUser, ResaleListing } from '@/lib/data';
import { CollectorCard } from './collector-card';
import { Skeleton } from './ui/skeleton';

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

    const usersMap = useMemo(() => new Map(allUsers.map(u => [u.id, u])), [allUsers]);

    useEffect(() => {
        const fetchCollectors = async () => {
            setIsLoading(true);
            try {
                const data = await getCollectorsForArtist(artistId);
                setCollectors(data);
            } catch (error) {
                console.error("Failed to fetch collectors:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCollectors();
    }, [artistId, getCollectorsForArtist]);

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
        }).filter(Boolean);
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
    
    if (collectorsWithStats.length === 0) {
        return (
            <div className="text-center py-16 text-muted-foreground">
                Be the first to collect a fractal from this artist!
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collectorsWithStats.map(item => (
                item && <CollectorCard 
                    key={item.user.id}
                    collector={item.user}
                    stats={item.stats}
                    ownedCount={item.ownedCount}
                />
            ))}
        </div>
    );
}
