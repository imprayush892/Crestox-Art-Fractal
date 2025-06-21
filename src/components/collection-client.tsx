'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ArrowDown, ArrowUp, ArrowUpRight, BarChart, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export function CollectionClient() {
  const { isLoggedIn, collection, artists } = useAuth();
  const router = useRouter();

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


  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">My Portfolio</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          A dashboard of your fractal investments.
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

            <h2 className="font-headline text-3xl font-bold my-8">Your Fractals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collection.map((fractal) => {
                  const artist = artistMap.get(fractal.artistId);
                  const currentValue = artist?.fractalPrice ?? fractal.purchasePrice;
                  const valueChange = currentValue - fractal.purchasePrice;

                  return (
                    <Card key={fractal.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">{fractal.artistName}</CardTitle>
                            <CardDescription>
                                Serial: <span className="font-mono">{fractal.serialNumber}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 flex-grow">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="text-sm text-muted-foreground">Purchase Price</span>
                                <span className="font-semibold">${fractal.purchasePrice.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="text-sm text-muted-foreground">Current Value</span>
                                <div className="flex items-center gap-2">
                                     {valueChange !== 0 && (
                                        valueChange > 0 ? <ArrowUp className="h-4 w-4 text-green-500"/> : <ArrowDown className="h-4 w-4 text-red-500"/>
                                     )}
                                    <span className="font-semibold">${currentValue.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col items-start text-xs text-muted-foreground">
                            <p>Purchased on {format(new Date(fractal.purchaseDate), "MMMM d, yyyy")}</p>
                            {artist && 
                                <Link href={`/artist/${artist.id}`} className="inline-flex items-center gap-1 mt-2 text-primary hover:underline">
                                    View Artist Portfolio <ArrowUpRight className="h-3 w-3" />
                                </Link>
                            }
                        </CardFooter>
                    </Card>
                  )
                })}
            </div>
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
