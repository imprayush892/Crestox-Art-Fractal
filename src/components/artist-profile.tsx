'use client';

import type { Artist, Fractal } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FractalCard } from '@/components/fractal-card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { CheckCircle, Layers, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { InvestmentDialog } from './investment-dialog';

interface ArtistProfileProps {
    artist: Artist;
    artistFractals: Fractal[];
}

export function ArtistProfile({ artist, artistFractals }: ArtistProfileProps) {
  const { isLoggedIn, holdingsByArtist } = useAuth();
  const router = useRouter();
  const [isInvesting, setIsInvesting] = useState(false);

  const ownedShares = holdingsByArtist.get(artist.id) || 0;

  const handleInvestClick = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/artist/${artist.id}`);
      return;
    }
    setIsInvesting(true);
  };

  const fractalPriceHistory = artist.priceHistory.map(p => ({ date: p.date, value: p.price }));
  const totalValueHistory = artist.totalPortfolioValueHistory.map(p => ({ date: p.date, value: p.value }));

  return (
    <>
      <InvestmentDialog
        artist={artist}
        isOpen={isInvesting}
        onClose={() => setIsInvesting(false)}
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
        <div className="lg:col-span-3 flex flex-col items-center md:items-start">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-primary shadow-lg">
              <AvatarImage src={artist.avatar} alt={artist.name} data-ai-hint="artist avatar"/>
              <AvatarFallback className="text-4xl">{artist.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="pt-4 text-center md:text-left">
              <h1 className="font-headline text-4xl md:text-5xl font-bold">{artist.name}</h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{artist.bio}</p>
            </div>
        </div>

        <div className="lg:col-span-2">
           <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Invest in the Portfolio</CardTitle>
                    <CardDescription>Purchase a "fractal" to own a share of this artist's entire collection.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            <span>{artist.availableEditions.toLocaleString()} of {artist.totalEditions.toLocaleString()} available</span>
                        </div>
                        <div className="text-3xl font-bold text-primary">
                            ${artist.fractalPrice.toLocaleString()}
                        </div>
                    </div>
                    <Button size="lg" className="w-full" onClick={handleInvestClick}>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Invest Now
                    </Button>
                    {ownedShares > 0 && (
                        <div className="mt-4 text-center text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            You own {ownedShares} fractal{ownedShares > 1 ? 's' : ''} of this portfolio.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="font-headline text-3xl font-bold mb-6">Portfolio Analytics</h2>
        <Card>
            <Tabs defaultValue="fractal-value">
                <CardHeader className="p-4 sm:p-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="fractal-value">Fractal Value</TabsTrigger>
                        <TabsTrigger value="total-valuation">Total Valuation</TabsTrigger>
                    </TabsList>
                </CardHeader>
                <CardContent className="p-0">
                    <TabsContent value="fractal-value" className="mt-0">
                       <CardDescription className="px-4 sm:px-6 mb-4 text-sm">
                            Historical value of one fractal share of {artist.name}'s portfolio.
                        </CardDescription>
                        <div className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <ChartContainer 
                                config={{ value: { label: "Value", color: "hsl(var(--primary))" } }} 
                                className="h-[250px] w-full"
                            >
                                <LineChart data={fractalPriceHistory} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => format(new Date(value), "MMM yy")}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => `$${(value as number).toLocaleString()}`}
                                    />
                                    <Tooltip
                                        cursor={{
                                            stroke: 'hsl(var(--border))',
                                            strokeWidth: 2,
                                            strokeDasharray: '3 3',
                                        }}
                                        content={<ChartTooltipContent
                                            formatter={(value) => `$${(value as number).toLocaleString()}`}
                                            indicator="dot"
                                        />}
                                    />
                                    <Line
                                        dataKey="value"
                                        type="monotone"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={true}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </TabsContent>
                    <TabsContent value="total-valuation" className="mt-0">
                        <CardDescription className="px-4 sm:px-6 mb-4 text-sm">
                            Historical total valuation of {artist.name}'s entire collection.
                        </CardDescription>
                        <div className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <ChartContainer 
                                config={{ value: { label: "Value", color: "hsl(var(--accent-foreground))" } }} 
                                className="h-[250px] w-full"
                            >
                                <LineChart data={totalValueHistory} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => format(new Date(value), "MMM yy")}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => `$${(value as number).toLocaleString()}`}
                                    />
                                    <Tooltip
                                        cursor={{
                                            stroke: 'hsl(var(--border))',
                                            strokeWidth: 2,
                                            strokeDasharray: '3 3',
                                        }}
                                        content={<ChartTooltipContent
                                            formatter={(value) => `$${(value as number).toLocaleString()}`}
                                            indicator="dot"
                                        />}
                                    />
                                    <Line
                                        dataKey="value"
                                        type="monotone"
                                        stroke="hsl(var(--accent-foreground))"
                                        strokeWidth={2}
                                        dot={true}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </TabsContent>
                </CardContent>
            </Tabs>
        </Card>
      </div>

      <div>
        <h2 className="font-headline text-3xl font-bold mb-8 border-b pb-4">Artworks by {artist.name}</h2>
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8">
            {artistFractals.map((fractal) => (
                <div key={fractal.id} className="break-inside-avoid">
                  <FractalCard fractal={fractal} artist={artist} />
                </div>
            ))}
        </div>
      </div>
    </>
  );
}
