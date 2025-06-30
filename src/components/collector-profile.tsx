
'use client';

import { useMemo } from 'react';
import type { PublicHolding, PublicUser, ResaleListing } from '@/lib/data';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Button } from './ui/button';

interface CollectorProfileProps {
    collector: PublicUser;
    holdings: PublicHolding[];
    listings: ResaleListing[];
}

export function CollectorProfile({ collector, holdings, listings }: CollectorProfileProps) {
    const { artists } = useAuth();
    const artistMap = useMemo(() => new Map(artists.map(a => [a.id, a])), [artists]);
    
    const calculateCurrentResalePrice = (listing: ResaleListing) => {
        const now = Date.now();
        const startTime = new Date(listing.listingTimestamp).getTime();
        const elapsedSeconds = (now - startTime) / 1000;
        
        if (elapsedSeconds >= listing.periodSeconds) {
            return listing.minPrice;
        }
        
        const price = listing.initialPrice - (listing.initialPrice - listing.minPrice) * (elapsedSeconds / listing.periodSeconds);
        return Math.round(price * 100) / 100;
    };
    
    const totalHoldings = holdings.length;

    return (
        <>
            <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary shadow-lg">
                    <AvatarImage src={collector.avatar} alt={collector.name} data-ai-hint="artist avatar" />
                    <AvatarFallback className="text-4xl">{collector.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                    <h1 className="font-headline text-4xl md:text-5xl font-bold">{collector.name}</h1>
                    <p className="mt-2 text-lg text-muted-foreground">Art Collector</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Fractals Held</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{totalHoldings.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Items for Sale</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{listings.length}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Unique Artists Collected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{new Set(holdings.map(h => h.artistId)).size}</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Currently For Sale</CardTitle>
                    <CardDescription>Fractals this collector has listed on the secondary market.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Artist</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Price Range</TableHead>
                                <TableHead>Current Price</TableHead>
                                <TableHead>Ends In</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {listings.length > 0 ? (
                                listings.map(listing => {
                                    const artist = artistMap.get(listing.artistId);
                                    if (!artist) return null;
                                    const currentPrice = calculateCurrentResalePrice(listing);
                                    const endDate = new Date(new Date(listing.listingTimestamp).getTime() + listing.periodSeconds * 1000);

                                    return (
                                        <TableRow key={listing.id}>
                                            <TableCell>
                                                <Button variant="link" asChild className="p-0 h-auto">
                                                    <Link href={`/artist/${artist.id}`} className="font-medium">{artist.name}</Link>
                                                </Button>
                                            </TableCell>
                                            <TableCell>{listing.quantity}</TableCell>
                                            <TableCell>₹{listing.minPrice.toFixed(2)} - ₹{listing.initialPrice.toFixed(2)}</TableCell>
                                            <TableCell className="font-semibold">₹{currentPrice.toFixed(2)}</TableCell>
                                            <TableCell>{formatDistanceToNow(endDate, { addSuffix: true })}</TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">This collector has no items for sale.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
