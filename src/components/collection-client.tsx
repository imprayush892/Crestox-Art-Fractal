
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ArrowUpRight, BarChart, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import type { OwnedFractal, ResaleListing } from '@/context/auth-context';
import type { Artist } from '@/lib/data';
import { ArtistHoldingsDialog } from './artist-holdings-dialog';
import { SellDialog } from './sell-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNowStrict } from 'date-fns';
import { ArtistCard } from './artist-card';
import { useToast } from '@/hooks/use-toast';

function HoldingsView() {
  const { collection, artists } = useAuth();
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [artistToSell, setArtistToSell] = useState<Artist | null>(null);

  const artistMap = useMemo(() => new Map(artists.map(a => [a.id, a])), [artists]);

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

  return (
    <>
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

function ListedForSaleView() {
  const { user, resaleListings, artists, cancelListing } = useAuth();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  const userListings = useMemo(() => {
    if (!user) return [];
    return resaleListings
      .filter(l => l.resellerId === user.uid && l.status === 'active')
      .sort((a,b) => new Date(b.listingTimestamp).getTime() - new Date(a.listingTimestamp).getTime());
  }, [resaleListings, user]);

  const artistMap = useMemo(() => new Map(artists.map(a => [a.id, a])), [artists]);

  const handleCancel = async (listingId: string) => {
    setIsCancelling(listingId);
    try {
      await cancelListing(listingId);
      toast({
        title: "Listing Cancelled",
        description: "Your fractal listing has been successfully cancelled.",
      })
    } catch(e: any) {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: e.message || "Could not cancel listing."
      })
    } finally {
      setIsCancelling(null);
    }
  }

  if (userListings.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">You have no active listings.</h2>
          <p className="mt-2 text-muted-foreground">List fractals from your holdings to see them here.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Active Listings</CardTitle>
        <CardDescription>Fractals you've listed on the secondary market. You can cancel a listing at any time.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artist</TableHead>
              <TableHead className="text-center">Quantity</TableHead>
              <TableHead>Price Range</TableHead>
              <TableHead>Time Remaining</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userListings.map(listing => {
              const artist = artistMap.get(listing.artistId);
              const endTime = new Date(listing.listingTimestamp).getTime() + listing.periodSeconds * 1000;
              const timeRemaining = endTime > Date.now() ? formatDistanceToNowStrict(endTime, { addSuffix: true }) : 'Ended';
              
              return (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium">{artist?.name || 'Unknown Artist'}</TableCell>
                  <TableCell className="text-center">{listing.quantity}</TableCell>
                  <TableCell>${listing.initialPrice} → ${listing.minPrice}</TableCell>
                  <TableCell>{timeRemaining}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleCancel(listing.id)}
                      disabled={isCancelling === listing.id}
                    >
                      {isCancelling === listing.id ? 'Cancelling...' : 'Cancel'}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function WatchlistView() {
  const { watchlist, artists } = useAuth();

  const watchedArtists = useMemo(() => {
    return artists.filter(artist => watchlist.includes(artist.id));
  }, [artists, watchlist]);

  if (watchedArtists.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">Your watchlist is empty.</h2>
          <p className="mt-2 text-muted-foreground">Add artists to your watchlist from their profile page to track them here.</p>
           <Button asChild className="mt-6">
              <Link href="/artists">Meet the Artists</Link>
          </Button>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {watchedArtists.map(artist => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  )
}

export function CollectionClient() {
  const { isLoggedIn, collection } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/collection');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return null;
  }
  
  const availableToSellCount = useMemo(() => collection.filter(f => f.status !== 'listed').length, [collection]);

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">My Collection</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Stay on top of all your fractal activities.
        </p>
      </div>
      
      {collection.length > 0 ? (
        <Tabs defaultValue="holdings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="holdings">My Holdings</TabsTrigger>
            <TabsTrigger value="listed">Listed for Sale</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          </TabsList>
          
          <TabsContent value="holdings">
            <HoldingsView />
          </TabsContent>

          <TabsContent value="listed">
            <ListedForSaleView />
          </TabsContent>
          
          <TabsContent value="watchlist">
             <WatchlistView />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">Your portfolio is empty.</h2>
            <p className="mt-2 text-muted-foreground">Start exploring artists to begin your collection.</p>
             <Button asChild className="mt-6">
                <Link href="/artists">Meet the Artists</Link>
            </Button>
        </div>
      )}
    </>
  );
}
