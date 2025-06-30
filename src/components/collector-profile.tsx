'use client';

import { useMemo } from 'react';
import type { PublicHolding, PublicUser, ResaleListing } from '@/lib/data';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { ArrowUpRight, DollarSign, Package } from 'lucide-react';

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
    const totalListings = listings.reduce((sum, l) => sum + l.quantity, 0);

    const listingsByArtist = useMemo(() => {
        return listings.reduce((acc, listing) => {
            (acc[listing.artistId] = acc[listing.artistId] || []).push(listing);
            return acc;
        }, {} as Record<string, ResaleListing[]>);
    }, [listings]);

    const holdingsByArtist = useMemo(() => {
        return holdings.reduce((acc, holding) => {
            (acc[holding.artistId] = acc[holding.artistId] || 0);
            acc[holding.artistId]++;
            return acc;
        }, {} as Record<string, number>);
    }, [holdings]);


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
                        <CardTitle>Fractals for Sale</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{totalListings.toLocaleString()}</p>
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
            
            <div className="space-y-8">
                <h2 className="font-headline text-3xl font-bold">Fractals For Sale</h2>
                {Object.keys(listingsByArtist).length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Object.entries(listingsByArtist).map(([artistId, artistListings]) => {
                            const artist = artistMap.get(artistId);
                            if (!artist) return null;

                            const fractalsHeldForArtist = holdingsByArtist[artistId] || 0;
                            const fractalsForSaleForArtist = artistListings.reduce((sum, l) => sum + l.quantity, 0);

                            return (
                                <Card key={artistId}>
                                    <CardHeader>
                                        <CardTitle className="font-headline">{artist.name}</CardTitle>
                                        <div className="text-sm text-muted-foreground flex items-center gap-4 pt-1">
                                            <div className="flex items-center gap-1.5">
                                                <Package className="h-4 w-4"/>
                                                <span>{fractalsHeldForArtist} Held</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <DollarSign className="h-4 w-4"/>
                                                <span>{fractalsForSaleForArtist} For Sale</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Qty</TableHead>
                                                    <TableHead>Price Range</TableHead>
                                                    <TableHead className="text-right">Current Price</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {artistListings.map(listing => {
                                                    const currentPrice = calculateCurrentResalePrice(listing);
                                                    return (
                                                        <TableRow key={listing.id}>
                                                            <TableCell>{listing.quantity}</TableCell>
                                                            <TableCell>₹{listing.minPrice.toFixed(2)} - ₹{listing.initialPrice.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right font-semibold">₹{currentPrice.toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                         <Link href={`/artist/${artist.id}`} className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-4">
                                            View Artist Portfolio <ArrowUpRight className="h-3 w-3" />
                                        </Link>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                     <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                        This collector has no items currently for sale.
                    </div>
                )}
            </div>
        </>
    );
}
