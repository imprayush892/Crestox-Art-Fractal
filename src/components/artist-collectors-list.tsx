
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import type { CollectorInfo, PublicUser } from '@/lib/data';
import { CollectorCard } from './collector-card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

interface ArtistCollectorsListProps {
    artistId: string;
}

interface CollectorStats {
    onSaleCount: number;
    cheapestPrice?: number;
}

export function ArtistCollectorsList({ artistId }: ArtistCollectorsListProps) {
    const { getCollectorsForArtist, allUsers, resaleListings, isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const [collectors, setCollectors] = useState<CollectorInfo[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const usersMap = useMemo(() => new Map(allUsers.map(u => [u.id, u])), [allUsers]);

    useEffect(() => {
        if (isAuthLoading) return; // Wait until auth state is confirmed

        if (!artistId || !isLoggedIn) {
            setIsFetching(false);
            return;
        }

        const fetchCollectors = async () => {
            setIsFetching(true);
            setError(null);
            try {
                const data = await getCollectorsForArtist(artistId);
                setCollectors(data);
            } catch (err) {
                console.error("Failed to fetch collectors:", err);
                const errorMessage = (err as Error).message || "An unknown error occurred.";
                const lowerCaseMessage = errorMessage.toLowerCase();

                // Firestore often masks a "missing index" error with a "permission-denied" error for collectionGroup queries.
                // We'll give the user the most likely solution.
                if (lowerCaseMessage.includes("permission-denied") || lowerCaseMessage.includes("insufficient permissions") || lowerCaseMessage.includes("requires an index")) {
                     setError("Could not load collectors. This is likely due to a missing database index. Please open the browser's developer console (F12), find the detailed Firebase error message (it will be red), and click the link inside it to create the required index in your Firebase console.");
                } else if (lowerCaseMessage.includes("not authenticated")) {
                    setError("You must be logged in to view collectors.");
                } else {
                    setError(`An error occurred while fetching the list of collectors: ${errorMessage}`);
                }
            } finally {
                setIsFetching(false);
            }
        };

        fetchCollectors();
    }, [artistId, getCollectorsForArtist, isLoggedIn, isAuthLoading]);

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

    if (isAuthLoading || (isLoggedIn && isFetching)) {
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
    
    if (!isLoggedIn) {
         return (
            <Card className="text-center p-8">
                <CardHeader>
                    <div className="mx-auto bg-muted rounded-full h-16 w-16 flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle>View the Collector Community</CardTitle>
                    <CardDescription>
                        Log in or create an account to see who has collected work from this artist.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center gap-4">
                        <Button asChild>
                            <Link href="/login">Log In</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/signup">Sign Up</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
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
