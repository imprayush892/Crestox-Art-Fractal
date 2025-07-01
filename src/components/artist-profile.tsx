
'use client';

import type { Artist, Fractal } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FractalCard } from '@/components/fractal-card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { CheckCircle, Layers, ShoppingCart, Star, MapPin, Link as LinkIcon, Palette, Award, Building2, Twitter, Instagram, Linkedin, Edit, Share2, Users, TrendingUp, GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo } from 'react';
import { InvestmentDialog } from './investment-dialog';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { ArtistCollectorsList } from './artist-collectors-list';

interface ArtistProfileProps {
    artist: Artist;
    artistFractals: Fractal[];
}

const formatLargeNumber = (value: number): string => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
};


export function ArtistProfile({ artist, artistFractals }: ArtistProfileProps) {
  const { 
    isLoggedIn, 
    artistProfile, 
    collection,
    watchlist, 
    addToWatchlist, 
    removeFromWatchlist 
  } = useAuth();
  const router = useRouter();
  const [isCollecting, setIsCollecting] = useState(false);
  const { toast } = useToast();

  const isOwnProfile = artistProfile?.id === artist.id;
  
  const { ownedCount, listedCount } = useMemo(() => {
    if (!collection) return { ownedCount: 0, listedCount: 0 };
    const artistCollection = collection.filter(f => f.artistId === artist.id);
    return {
        ownedCount: artistCollection.filter(f => f.status === 'owned').length,
        listedCount: artistCollection.filter(f => f.status === 'listed').length,
    };
  }, [collection, artist.id]);

  const isWatched = watchlist.includes(artist.id);

  const isCollectible = useMemo(() => {
    if (isOwnProfile) return false;
    // Artworks can be collected if the artist has no art yet OR if they have art AND a message.
    return artistFractals.length === 0 || !!artist.artistMessage;
  }, [artist, artistFractals, isOwnProfile]);

  const handleCollectClick = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/artist/${artist.id}`);
      return;
    }
    setIsCollecting(true);
  };
  
  const handleWatchClick = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/artist/${artist.id}`);
      return;
    }
    if (isWatched) {
      removeFromWatchlist(artist.id);
    } else {
      addToWatchlist(artist.id);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Check out ${artist.name} on Crestox`,
      text: `Discover amazing fractal art by ${artist.name}.`,
      url: window.location.href,
    };
    
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Artist profile URL copied to clipboard.",
      });
    }
  };

  const fractalPriceHistory = artist.priceHistory.map(p => ({ date: p.date, value: p.price }));
  const totalValueHistory = artist.totalPortfolioValueHistory.map(p => ({ date: p.date, value: p.value }));

  const portfolioSnapshotData = useMemo(() => {
    const grades = ['AAA', 'AA', 'A+', 'A', 'A-'];
    const snapshot = artistFractals.reduce((acc, fractal) => {
        if (fractal.crestoxGrade) {
            acc[fractal.crestoxGrade] = (acc[fractal.crestoxGrade] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return grades.map(grade => ({
        grade,
        count: snapshot[grade] || 0,
    })).filter(item => item.count > 0);
  }, [artistFractals]);


  return (
    <>
      <InvestmentDialog
        artist={artist}
        isOpen={isCollecting}
        onClose={() => setIsCollecting(false)}
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
        <div className="lg:col-span-3 flex flex-col items-center md:items-start">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-primary shadow-lg">
              <AvatarImage src={artist.avatar} alt={artist.name} data-ai-hint="artist avatar"/>
              <AvatarFallback className="text-4xl">{artist.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="pt-4 text-center md:text-left">
              <h1 className="font-headline text-4xl md:text-5xl font-bold">{artist.name}</h1>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-2 text-muted-foreground">
                {artist.location && (
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{artist.location}</span>
                    </div>
                )}
                {artist.university && (
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        <span>{artist.university}</span>
                    </div>
                )}
                {artist.style && (
                    <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        <span>{artist.style}</span>
                    </div>
                )}
                {artist.website && (
                    <a href={artist.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary hover:underline">
                        <LinkIcon className="w-4 h-4" />
                        <span>Portfolio</span>
                    </a>
                )}
                 {artist.twitter && <a href={artist.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Twitter className="w-5 h-5"/></a>}
                 {artist.instagram && <a href={artist.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Instagram className="w-5 h-5"/></a>}
                 {artist.linkedin && <a href={artist.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Linkedin className="w-5 h-5"/></a>}
              </div>
              <p className="mt-4 max-w-2xl text-lg text-foreground/80">{artist.bio}</p>
            </div>
        </div>

        <div className="lg:col-span-2">
           {isOwnProfile ? (
             <Card className="sticky top-24">
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-headline text-2xl">Your Public Profile</CardTitle>
                      <CardDescription>This is how collectors see your profile.</CardDescription>
                    </div>
                    <Button variant="outline" size="icon" className="text-primary border-primary hover:bg-primary/10 hover:text-primary" onClick={handleShare}>
                        <Share2 className="w-5 h-5" />
                        <span className="sr-only">Share Profile</span>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Button size="lg" className="w-full" asChild>
                        <Link href="/portfolio">
                            <Edit className="mr-2 h-5 w-5" />
                            Go to Dashboard
                        </Link>
                    </Button>
                </CardContent>
            </Card>
           ) : (
            <Card className="sticky top-24">
                  <CardHeader className="flex-row items-center justify-between">
                      <div>
                        <CardTitle className="font-headline text-2xl">Collect Fractals</CardTitle>
                        <CardDescription>Purchase fractals from the collection.</CardDescription>
                      </div>
                      <Button variant="outline" size="icon" className="text-primary border-primary hover:bg-primary/10 hover:text-primary" onClick={handleShare}>
                          <Share2 className="w-5 h-5" />
                          <span className="sr-only">Share Profile</span>
                      </Button>
                  </CardHeader>
                  <CardContent>
                      <div className="flex justify-between items-center mb-4">
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Layers className="w-4 h-4" />
                              <span>{artist.availableEditions.toLocaleString()} of {artist.totalEditions.toLocaleString()} available</span>
                          </div>
                          <div className="text-3xl font-bold text-primary">
                              ₹{artist.fractalPrice.toLocaleString()}
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="lg" className="w-full" onClick={handleCollectClick} disabled={!isCollectible}>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Collect Now
                        </Button>
                         <Button size="lg" variant="outline" onClick={handleWatchClick} aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}>
                            <Star className={`w-5 h-5 transition-colors ${isWatched ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                       {!isCollectible && (
                          <p className="text-xs text-center text-destructive mt-2">
                              This artist's fractals are not available for collection until they provide a message to their collectors.
                          </p>
                      )}
                      {(ownedCount > 0 || listedCount > 0) && (
                          <div className="mt-4 text-center text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>You have {ownedCount} in holdings{listedCount > 0 ? ` and ${listedCount} on sale` : ''} from this artist.</span>
                          </div>
                      )}
                  </CardContent>
              </Card>
           )}
        </div>
      </div>
      
      <Tabs defaultValue="artworks" className="mb-12">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="artworks"><Palette className="mr-2" />Artworks</TabsTrigger>
          <TabsTrigger value="analytics"><TrendingUp className="mr-2" />Analytics</TabsTrigger>
          <TabsTrigger value="collectors"><Users className="mr-2" />Collectors</TabsTrigger>
          <TabsTrigger value="achievements"><Award className="mr-2" />Achievements</TabsTrigger>
        </TabsList>
        <TabsContent value="artworks" className="mt-6">
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8">
                {artistFractals.map((fractal) => (
                    <div key={fractal.id} className="break-inside-avoid">
                      <FractalCard fractal={fractal} artist={artist} />
                    </div>
                ))}
            </div>
            {artistFractals.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    This artist has not listed any artworks yet.
                </div>
            )}
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Portfolio Snapshot</CardTitle>
                        <CardDescription>Breakdown of graded artworks in this collection.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                    {portfolioSnapshotData.length > 0 ? (
                            <ChartContainer config={{ count: { label: "Artworks", color: "hsl(var(--primary))" } }} className="h-full min-h-[250px] w-full">
                                <BarChart data={portfolioSnapshotData} accessibilityLayer>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="grade" tickLine={false} tickMargin={10} axisLine={false} stroke="#888888" fontSize={12} />
                                    <YAxis allowDecimals={false} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        content={<ChartTooltipContent indicator="dot" />}
                                    />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <div className="col-span-full text-center py-8 h-full min-h-[250px] flex items-center justify-center">
                                <p className="text-muted-foreground">No graded artworks in this portfolio yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <Tabs defaultValue="fractal-value" className="flex flex-col flex-grow">
                        <CardHeader className="p-4 sm:p-6">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="fractal-value">Fractal Value</TabsTrigger>
                                <TabsTrigger value="total-valuation">Total Valuation</TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <CardContent className="p-0 flex-grow flex">
                            <TabsContent value="fractal-value" className="mt-0 w-full flex flex-col">
                                <div className="px-4 sm:px-6 mb-4 min-h-[48px] flex items-center">
                                    <CardDescription className="text-sm">
                                        Historical value of one fractal from {artist.name}'s portfolio.
                                    </CardDescription>
                                </div>
                                <div className="p-4 pt-0 sm:p-6 sm:pt-0 flex-grow">
                                    <ChartContainer 
                                        config={{ value: { label: "Value", color: "hsl(var(--primary))" } }} 
                                        className="h-full min-h-[250px] w-full"
                                    >
                                        <LineChart data={fractalPriceHistory} margin={{left: 12}}>
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
                                                tickFormatter={(value) => `₹${formatLargeNumber(value as number)}`}
                                            />
                                            <Tooltip
                                                cursor={{
                                                    stroke: 'hsl(var(--border))',
                                                    strokeWidth: 2,
                                                    strokeDasharray: '3 3',
                                                }}
                                                content={<ChartTooltipContent
                                                    formatter={(value) => `₹${(value as number).toLocaleString()}`}
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
                            <TabsContent value="total-valuation" className="mt-0 w-full flex flex-col">
                                <div className="px-4 sm:px-6 mb-4 min-h-[48px] flex items-center">
                                    <CardDescription className="text-sm">
                                        Historical total valuation of {artist.name}'s entire collection.
                                    </CardDescription>
                                </div>
                                <div className="p-4 pt-0 sm:p-6 sm:pt-0 flex-grow">
                                    <ChartContainer 
                                        config={{ value: { label: "Value", color: "hsl(var(--accent-foreground))" } }} 
                                        className="h-full min-h-[250px] w-full"
                                    >
                                        <LineChart data={totalValueHistory} margin={{left: 12}}>
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
                                                tickFormatter={(value) => `₹${formatLargeNumber(value as number)}`}
                                            />
                                            <Tooltip
                                                cursor={{
                                                    stroke: 'hsl(var(--border))',
                                                    strokeWidth: 2,
                                                    strokeDasharray: '3 3',
                                                }}
                                                content={<ChartTooltipContent
                                                    formatter={(value) => `₹${(value as number).toLocaleString()}`}
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
        </TabsContent>
         <TabsContent value="collectors" className="mt-6">
            <ArtistCollectorsList artistId={artist.id} />
        </TabsContent>
        <TabsContent value="achievements" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2">
                            <Award /> Awards
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {artist.awards.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                {artist.awards.map((award, i) => <li key={i}>{award}</li>)}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground">No awards listed.</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2">
                            <Building2 /> Exhibitions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {artist.exhibitions.length > 0 ? (
                             <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                {artist.exhibitions.map((ex, i) => <li key={i}>{ex}</li>)}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground">No exhibitions listed.</p>}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
