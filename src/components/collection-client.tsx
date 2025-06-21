'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ArrowUpRight, BarChart, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import type { OwnedFractal } from '@/context/auth-context';
import type { Artist } from '@/lib/data';
import { ArtistHoldingsDialog } from './artist-holdings-dialog';

export function CollectionClient() {
  const { isLoggedIn, collection, artists } = useAuth();
  const router = useRouter();
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/collection');
    }
  }, [isLoggedIn, router]);

  const artistMap = useMemo(() => new Map(artists.map(a => [a.id, a])), [artists]);

  const portfolioStats = useMemo(() => {
    if (collection.length === 0) {
      return { totalInvestment: 0, currentValue: 0, gainLoss: 0, percentageChange: 0 };
    }

    const totalInvestment = collection.reduce((sum, fractal) => sum + fractal.purchasePrice, 0);
    const currentValue = collection.reduce((sum, fractal) => {
      const artist = artistMap.get(fractal.artistId);
      return sum + (artist?.fractalPrice || fractal.purchasePrice);
    }, 0);
    const gainLoss = currentValue - totalInvestment;
    const percentageChange = totalInvestment > 0 ? (gainLoss / totalInvestment) * 100 : 0;

    return { totalInvestment, currentValue, gainLoss, percentageChange };
  }, [collection, artistMap]);

  const collectionByArtist = useMemo(() => {
    return collection.reduce((acc, fractal) => {
        (acc[fractal.artistId] = acc[fractal.artistId] || []).push(fractal);
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


  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">My Collection</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          STAY ON TOP OF ALL YOUR FRACTAL ACTIVITES
        </p>
      </div>
      
      {collection.length > 0 ? (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Portfolio Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${portfolioStats.currentValue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Based on current market prices
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${portfolioStats.totalInvestment.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                           The total amount you've invested
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gain / Loss</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${portfolioStats.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                           ${portfolioStats.gainLoss.toLocaleString(undefined, { signDisplay: 'always' })}
                        </div>
                        <p className={`text-xs ${portfolioStats.gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                           {portfolioStats.percentageChange.toFixed(2)}% all time
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedArtistIds.map(artistId => {
                  const fractalsByArtist = collectionByArtist[artistId];
                  const artist = artistMap.get(artistId);
                  if (!artist) return null;

                  const totalInvestment = fractalsByArtist.reduce((sum, f) => sum + f.purchasePrice, 0);
                  const currentValue = fractalsByArtist.length * artist.fractalPrice;
                  const gainLoss = currentValue - totalInvestment;

                  return (
                    <Card 
                        key={artistId} 
                        className="flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                        onClick={() => handleCardClick(artistId)}
                    >
                        <CardHeader className="flex-row items-center gap-4">
                            <Wallet className="w-8 h-8 text-primary"/>
                            <div>
                                <CardTitle className="font-headline text-2xl">{artist.name}</CardTitle>
                                <CardDescription>{fractalsByArtist.length} Fractal{fractalsByArtist.length > 1 ? 's' : ''} Owned</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-4 flex-grow">
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
                            <Link href={`/artist/${artist.id}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 mt-4 text-primary hover:underline text-xs">
                                View Artist Portfolio <ArrowUpRight className="h-3 w-3" />
                            </Link>
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
        </>
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
