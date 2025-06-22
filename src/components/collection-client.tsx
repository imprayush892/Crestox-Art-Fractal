
'use client';

import { useAuth, type ResaleListing } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ArrowUpRight, BarChart, DollarSign, TrendingUp, Wallet, Eye, Store, Package } from 'lucide-react';
import type { OwnedFractal } from '@/context/auth-context';
import type { Artist } from '@/lib/data';
import { ArtistHoldingsDialog } from './artist-holdings-dialog';
import { SellDialog } from './sell-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';
import { ArtistCard } from './artist-card';

export function CollectionClient() {
  const { 
    isLoggedIn, 
    collection, 
    artists, 
    user,
    resaleListings,
    watchlist,
    cancelListing,
  } = useAuth();
  const router = useRouter();
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [artistToSell, setArtistToSell] = useState<Artist | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/collection');
    }
  }, [isLoggedIn, router]);

  const artistMap = useMemo(() => new Map(artists.map(a => [a.id, a])), [artists]);

  const portfolioStats = useMemo(() => {
    const holdings = collection.filter(f => f.status !== 'listed');
    
    const totalInvestment = holdings.reduce((sum, f) => sum + f.purchasePrice, 0);
    
    const currentValue = holdings.reduce((sum, f) => {
      const artist = artistMap.get(f.artistId);
      return sum + (artist?.fractalPrice || 0);
    }, 0);

    const gainLoss = currentValue - totalInvestment;
    const gainLossPercent = totalInvestment > 0 ? (gainLoss / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      currentValue,
      gainLoss,
      gainLossPercent
    };
  }, [collection, artistMap]);


  const collectionByArtist = useMemo(() => {
    return collection.reduce((acc, fractal) => {
      if (fractal.status !== 'listed') {
        (acc[fractal.artistId] = acc[fractal.artistId] || []).push(fractal);
      }
      return acc;
    }, {} as Record<string, OwnedFractal[]>);
  }, [collection]);

  const sortedArtistIds = useMemo(() => {
      return Object.keys(collectionByArtist).sort((a, b) => {
          const artistA = artistMap.get(a)?.name || '';
          const artistB = artistMap.get(b)?.name || '';
          return artistA.localeCompare(artistB);
      });
  }, [collectionByArtist, artistMap]);
  
  const userActiveListings = useMemo(() => {
    if (!user) return [];
    return resaleListings.filter(l => l.resellerId === user.uid && l.status === 'active');
  }, [resaleListings, user]);

  const watchedArtists = useMemo(() => {
      return artists.filter(a => watchlist.includes(a.id));
  }, [artists, watchlist]);

  const handleCardClick = (artistId: string) => {
    const artist = artistMap.get(artistId);
    if (artist) {
        setSelectedArtist(artist);
    }
  };
  
  const handleCloseDialog = () => {
      setSelectedArtist(null);
  };
  
  const ownedFractalsForSelectedArtist = selectedArtist ? collectionByArtist[selectedArtist.id] || [] : [];

  const handleSellClick = (e: React.MouseEvent, artist: Artist) => {
    e.stopPropagation();
    setArtistToSell(artist);
  }

  const handleCloseSellDialog = () => {
    setArtistToSell(null);
  }
  
  const ownedFractalsForSellDialog = artistToSell ? collection.filter(f => f.artistId === artistToSell!.id) : [];

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

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">My Collection</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Stay on top of all your fractal activities.
        </p>
      </div>

      {collection.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolioStats.currentValue.toLocaleString('en-US', {maximumFractionDigits: 0})}</div>
              <p className="text-xs text-muted-foreground">Based on current market prices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolioStats.totalInvestment.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1})}</div>
              <p className="text-xs text-muted-foreground">The total amount you've invested</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gain / Loss</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolioStats.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${portfolioStats.gainLoss.toLocaleString('en-US', { signDisplay: 'always', minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </div>
              <p className={`text-xs ${portfolioStats.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioStats.gainLossPercent.toFixed(2)}% all time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="holdings" className="mt-8">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
                <TabsTrigger value="holdings"><Package className="mr-2 h-4 w-4" /> My Holdings</TabsTrigger>
                <TabsTrigger value="listed"><Store className="mr-2 h-4 w-4" />Listed for Sale</TabsTrigger>
                <TabsTrigger value="watchlist"><Eye className="mr-2 h-4 w-4" />Watchlist</TabsTrigger>
            </TabsList>
            
            <TabsContent value="holdings" className="mt-6">
                {Object.keys(collectionByArtist).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedArtistIds.map(artistId => {
                        const fractalsByArtist = collectionByArtist[artistId];
                        if (fractalsByArtist.length === 0) return null;
                        const artist = artistMap.get(artistId);
                        if (!artist) return null;

                        const totalInvestment = fractalsByArtist.reduce((sum, f) => sum + f.purchasePrice, 0);
                        const currentValue = fractalsByArtist.reduce((sum) => sum + artist.fractalPrice, 0);
                        const gainLoss = currentValue - totalInvestment;

                        return (
                            <Card 
                                key={artistId} 
                                className="flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                            >
                                <CardHeader className="flex-row items-center gap-4 cursor-pointer" onClick={() => handleCardClick(artistId)}>
                                    <Wallet className="w-8 h-8 text-primary"/>
                                    <div>
                                        <CardTitle className="font-headline text-2xl">{artist.name}</CardTitle>
                                        <CardDescription>{fractalsByArtist.length} Fractal{fractalsByArtist.length > 1 ? 's' : ''} Owned</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-4 flex-grow cursor-pointer" onClick={() => handleCardClick(artistId)}>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <span className="text-sm text-muted-foreground">Total Invested</span>
                                        <span className="font-semibold">${totalInvestment.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <span className="text-sm text-muted-foreground">Current Value</span>
                                        <span className="font-semibold">${currentValue.toLocaleString()}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex-col items-start w-full">
                                <div className={`w-full text-sm font-semibold flex items-center justify-between ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        <span>Gain/Loss:</span>
                                        <span>${gainLoss.toLocaleString(undefined, { signDisplay: 'always' })}</span>
                                    </div>
                                    <div className="flex justify-between items-center w-full mt-4">
                                        <Link href={`/artist/${artist.id}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                                            View Artist Portfolio <ArrowUpRight className="h-3 w-3" />
                                        </Link>
                                        <Button size="sm" variant="outline" onClick={(e) => handleSellClick(e, artist)}>
                                            <DollarSign className="mr-1 h-3 w-3" /> Sell
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        )
                    })}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <h2 className="text-xl font-semibold">Your portfolio is empty.</h2>
                        <p className="mt-2 text-muted-foreground">Start exploring artists to begin your collection.</p>
                        <Button asChild className="mt-6">
                            <Link href="/artists">Meet the Artists</Link>
                        </Button>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="listed" className="mt-6">
                {userActiveListings.length > 0 ? (
                   <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Artist</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Price Range</TableHead>
                                <TableHead>Current Price</TableHead>
                                <TableHead>Ends In</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userActiveListings.map(listing => {
                                const artist = artistMap.get(listing.artistId);
                                const currentPrice = calculateCurrentResalePrice(listing);
                                const endDate = new Date(new Date(listing.listingTimestamp).getTime() + listing.periodSeconds * 1000);

                                return (
                                    <TableRow key={listing.id}>
                                        <TableCell className="font-medium">{artist?.name || 'Unknown Artist'}</TableCell>
                                        <TableCell>{listing.quantity}</TableCell>
                                        <TableCell>${listing.minPrice.toFixed(2)} - ${listing.initialPrice.toFixed(2)}</TableCell>
                                        <TableCell className="font-semibold">${currentPrice.toFixed(2)}</TableCell>
                                        <TableCell>{formatDistanceToNow(endDate, { addSuffix: true })}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => cancelListing(listing.id)}>Cancel</Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                    </Card>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <h2 className="text-xl font-semibold">You have no items listed for sale.</h2>
                        <p className="mt-2 text-muted-foreground">Sell fractals from your holdings to list them here.</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="watchlist" className="mt-6">
                {watchedArtists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {watchedArtists.map(artist => (
                            <ArtistCard key={artist.id} artist={artist} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <h2 className="text-xl font-semibold">Your watchlist is empty.</h2>
                        <p className="mt-2 text-muted-foreground">Add artists to your watchlist to track them here.</p>
                        <Button asChild className="mt-6">
                           <Link href="/artists">Meet the Artists</Link>
                        </Button>
                    </div>
                )}
            </TabsContent>
        </Tabs>


       <ArtistHoldingsDialog 
          isOpen={!!selectedArtist}
          onClose={handleCloseDialog}
          artist={selectedArtist}
          ownedFractals={ownedFractalsForSelectedArtist}
      />
      <SellDialog
          isOpen={!!artistToSell}
          onClose={handleCloseSellDialog}
          artist={artistToSell}
          ownedFractals={ownedFractalsForSellDialog}
      />
    </>
  );
}
