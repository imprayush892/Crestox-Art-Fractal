
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ArrowUpRight, BarChart, DollarSign, TrendingUp, Wallet, Eye, Store, Package, Loader2, Download } from 'lucide-react';
import type { OwnedFractal, Artist, Fractal, ResaleListing } from '@/lib/data';
import { ArtistHoldingsDialog } from './artist-holdings-dialog';
import { SellDialog } from './sell-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';
import { ArtistCard } from './artist-card';
import { HoldingCertificateDialog } from './holding-certificate-dialog';
import { Skeleton } from './ui/skeleton';
import { motion } from 'framer-motion';

const iconVariants = {
  hidden: { scale: 0.5, opacity: 0, rotate: -30 },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.1,
    },
  },
};

const HoldingCardSkeleton = () => (
    <Card className="flex flex-col">
        <CardHeader className="flex-row items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24 mt-2" />
            </div>
        </CardHeader>
        <CardContent className="grid gap-4 flex-grow">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-4 w-2/4" />
                <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-4 w-2/4" />
                <Skeleton className="h-4 w-1/4" />
            </div>
        </CardContent>
        <CardFooter className="flex-col items-start w-full">
            <Skeleton className="h-4 w-full mb-4" />
            <div className="flex justify-between items-center w-full gap-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
            </div>
            <Skeleton className="h-4 w-1/3 mt-4" />
        </CardFooter>
    </Card>
);


export function CollectionClient() {
  const { 
    isLoggedIn, 
    isLoading,
    collection, 
    artists, 
    fractals,
    user,
    resaleListings,
    watchlist,
    cancelListing,
    isCollectionLoading,
  } = useAuth();
  const router = useRouter();
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [artistToSell, setArtistToSell] = useState<Artist | null>(null);
  const [certificateArtist, setCertificateArtist] = useState<Artist | null>(null);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/collection');
    }
  }, [isLoading, isLoggedIn, router]);

  const artistMap = useMemo(() => new Map(artists.map(a => [a.id, a])), [artists]);
  const fractalsByArtist = useMemo(() => {
      return fractals.reduce((acc, fractal) => {
          (acc[fractal.artistId] = acc[fractal.artistId] || []).push(fractal);
          return acc;
      }, {} as Record<string, Fractal[]>)
  }, [fractals]);

  const portfolioStats = useMemo(() => {
    const holdings = collection.filter(f => f.status === 'owned');
    
    // Total spent includes 18% GST on purchase price
    const totalSpent = holdings.reduce((sum, f) => sum + (f.purchasePrice * 1.18), 0);
    
    const currentValue = holdings.reduce((sum, f) => {
      const artist = artistMap.get(f.artistId);
      return sum + (artist?.fractalPrice || 0);
    }, 0);

    const gainLoss = currentValue - totalSpent;
    const gainLossPercent = totalSpent > 0 ? (gainLoss / totalSpent) * 100 : 0;

    return {
      totalSpent,
      currentValue,
      gainLoss,
      gainLossPercent
    };
  }, [collection, artistMap]);


  const collectionByArtist = useMemo(() => {
    return collection.reduce((acc, fractal) => {
      (acc[fractal.artistId] = acc[fractal.artistId] || []).push(fractal);
      return acc;
    }, {} as Record<string, OwnedFractal[]>);
  }, [collection]);

  const sortedArtistHoldings = useMemo(() => {
      const artistHoldings: { artist: Artist; ownedCount: number; listedCount: number }[] = [];
      const processedArtists = new Set<string>();

      collection.forEach(fractal => {
        if (!processedArtists.has(fractal.artistId)) {
          const artist = artistMap.get(fractal.artistId);
          if (artist) {
            const allFractalsForArtist = collectionByArtist[fractal.artistId] || [];
            const ownedCount = allFractalsForArtist.filter(f => f.status === 'owned').length;
            const listedCount = allFractalsForArtist.filter(f => f.status === 'listed').length;
            if (ownedCount > 0 || listedCount > 0) {
              artistHoldings.push({ artist, ownedCount, listedCount });
            }
          }
          processedArtists.add(fractal.artistId);
        }
      });
      
      return artistHoldings.sort((a,b) => a.artist.name.localeCompare(b.artist.name));

  }, [collection, collectionByArtist, artistMap]);
  
  const userActiveListings = useMemo(() => {
    if (!user) return [];
    return resaleListings.filter(l => l.resellerId === user.uid && l.status === 'active');
  }, [resaleListings, user]);

  const watchedArtists = useMemo(() => {
      if (!watchlist) return [];
      return artists.filter(a => watchlist.includes(a.id));
  }, [artists, watchlist]);

  const handleCardClick = (artist: Artist) => {
    setSelectedArtist(artist);
  };
  
  const handleCloseDialog = () => {
      setSelectedArtist(null);
  };
  
  const ownedFractalsForSelectedArtist = selectedArtist ? collection.filter(f => f.artistId === selectedArtist!.id) : [];

  const handleSellClick = (e: React.MouseEvent, artist: Artist) => {
    e.stopPropagation();
    setArtistToSell(artist);
  }

  const handleCloseSellDialog = () => {
    setArtistToSell(null);
  }
  
  const ownedFractalsForSellDialog = artistToSell ? collection.filter(f => f.artistId === artistToSell!.id && f.status === 'owned') : [];

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
  
  const handleCancelListing = async (listingId: string) => {
    setIsCancelling(listingId);
    await cancelListing(listingId);
    setIsCancelling(null);
  }

  if (isLoading) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading Your Collection...</p>
            </div>
        </div>
    );
  }

  if (!isLoggedIn) {
      return null;
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">My Collection</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Track your fractal portfolio, manage holdings, and discover new art.
        </p>
      </div>

      {collection.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.8 }}>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{portfolioStats.currentValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Current market value of holdings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.8 }}>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{portfolioStats.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Includes all fees and taxes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gain / Loss</CardTitle>
              <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.8 }}>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolioStats.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{portfolioStats.gainLoss.toLocaleString('default', { signDisplay: 'always' })}
              </div>
              <p className={`text-xs ${portfolioStats.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioStats.gainLossPercent.toFixed(2)}% all time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="holdings" className="mt-8">
            <div className="w-full overflow-x-auto pb-2 -mx-1">
                <TabsList className="gap-1 w-max px-1">
                    <TabsTrigger value="holdings">
                        <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mr-2">
                            <Package className="h-4 w-4" />
                        </motion.div>
                        My Holdings
                    </TabsTrigger>
                    <TabsTrigger value="listed">
                        <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mr-2">
                            <Store className="h-4 w-4" />
                        </motion.div>
                        Listed for Sale
                    </TabsTrigger>
                    <TabsTrigger value="watchlist">
                        <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mr-2">
                            <Eye className="h-4 w-4" />
                        </motion.div>
                        Watchlist
                    </TabsTrigger>
                </TabsList>
            </div>
            
            <TabsContent value="holdings" className="mt-6">
                {isCollectionLoading ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <HoldingCardSkeleton />
                        <HoldingCardSkeleton />
                        <HoldingCardSkeleton />
                    </div>
                ) : sortedArtistHoldings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedArtistHoldings.map(({ artist, ownedCount, listedCount }) => {
                        const allFractalsForArtist = collectionByArtist[artist.id] || [];
                        const ownedByArtist = allFractalsForArtist.filter(f => f.status === 'owned');

                        const totalSpent = ownedByArtist.reduce((sum, f) => sum + (f.purchasePrice * 1.18), 0);
                        const currentValue = ownedByArtist.reduce((sum) => sum + artist.fractalPrice, 0);
                        const gainLoss = currentValue - totalSpent;

                        return (
                            <Card 
                                key={artist.id} 
                                className="flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                            >
                                <CardHeader className="flex-row items-center gap-4 cursor-pointer" onClick={() => handleCardClick(artist)}>
                                    <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.8 }}>
                                      <Wallet className="w-8 h-8 text-primary"/>
                                    </motion.div>
                                    <div>
                                        <CardTitle className="font-headline text-2xl">{artist.name}</CardTitle>
                                        <CardDescription>{ownedCount} in Holdings, {listedCount} on Sale</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-4 flex-grow cursor-pointer" onClick={() => handleCardClick(artist)}>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <span className="text-sm text-muted-foreground">Total Spent (incl. GST)</span>
                                        <span className="font-semibold">₹{totalSpent.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <span className="text-sm text-muted-foreground">Current Value</span>
                                        <span className="font-semibold">₹{currentValue.toLocaleString()}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex-col items-start w-full">
                                    <div className={`w-full text-sm font-semibold flex items-center justify-between ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            <span>Gain/Loss:</span>
                                            <span>₹{gainLoss.toLocaleString('default', { signDisplay: 'always' })}</span>
                                        </div>
                                        <div className="flex justify-between items-center w-full mt-4 gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setCertificateArtist(artist)} className="flex-1">
                                                <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mr-1"><Download className="h-3 w-3" /></motion.div> Certificate
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={(e) => handleSellClick(e, artist)} disabled={ownedCount === 0} className="flex-1">
                                                <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mr-1"><DollarSign className="h-3 w-3" /></motion.div> Sell
                                            </Button>
                                        </div>
                                    <Link href={`/artist/${artist.id}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-4">
                                        View Artist Portfolio <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}><ArrowUpRight className="h-3 w-3" /></motion.div>
                                    </Link>
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
                    <div className="w-full overflow-x-auto">
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
                                            <TableCell>₹{listing.minPrice.toFixed(2)} - ₹{listing.initialPrice.toFixed(2)}</TableCell>
                                            <TableCell className="font-semibold">₹{currentPrice.toFixed(2)}</TableCell>
                                            <TableCell>{formatDistanceToNow(endDate, { addSuffix: true })}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleCancelListing(listing.id)} disabled={isCancelling === listing.id}>
                                                  {isCancelling === listing.id && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                  Cancel
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
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
      <HoldingCertificateDialog
          isOpen={!!certificateArtist}
          onClose={() => setCertificateArtist(null)}
          artist={certificateArtist}
          ownedFractals={certificateArtist ? collectionByArtist[certificateArtist.id] : []}
          allArtistFractals={certificateArtist ? fractalsByArtist[certificateArtist.id] : []}
      />
    </>
  );
}
