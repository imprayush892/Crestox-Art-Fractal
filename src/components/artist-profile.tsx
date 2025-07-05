
'use client';

import type { Artist, Fractal, PreviouslySoldArtwork } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FractalCard } from '@/components/fractal-card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { CheckCircle, Layers, ShoppingCart, Star, MapPin, Link as LinkIcon, Palette, Award, Building2, Twitter, Instagram, Linkedin, Edit, Share2, Users, TrendingUp, GraduationCap, DollarSign, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo } from 'react';
import { InvestmentDialog } from './investment-dialog';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { ArtistCollectorsList } from './artist-collectors-list';
import { SafeImage as Image } from '@/components/ui/safe-image';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
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

interface SoldArtworkCardProps {
    artwork: PreviouslySoldArtwork;
}

function SoldArtworkCard({ artwork }: SoldArtworkCardProps) {
    const images = [artwork.artworkImage, artwork.proofOfSaleImage];
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = () => {
        const isFirst = currentIndex === 0;
        const newIndex = isFirst ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLast = currentIndex === images.length - 1;
        const newIndex = isLast ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    return (
        <Card className="overflow-hidden">
            <div className="relative group bg-muted/20">
                <Image
                    width={500}
                    height={500}
                    src={images[currentIndex]} 
                    alt={artwork.name} 
                    className="w-full h-auto transition-opacity duration-300"
                    data-ai-hint={currentIndex === 0 ? "artwork" : "document proof"}
                    key={`${artwork.name}-${currentIndex}`}
                />

                <Button onClick={goToPrevious} size="icon" variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.div variants={iconVariants} initial="hidden" animate="visible"><ChevronLeft /></motion.div>
                </Button>
                <Button onClick={goToNext} size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.div variants={iconVariants} initial="hidden" animate="visible"><ChevronRight /></motion.div>
                </Button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                        <button 
                            key={index} 
                            onClick={() => setCurrentIndex(index)} 
                            className={cn(
                                "w-2.5 h-2.5 rounded-full transition-colors", 
                                currentIndex === index ? "bg-white" : "bg-white/50 hover:bg-white/75"
                            )}
                            aria-label={`View image ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
            <div className="p-4">
                <p className="font-semibold">{artwork.name}</p>
                <p className="text-sm text-muted-foreground">Sold for <span className="font-medium text-primary">₹{artwork.saleValue.toLocaleString()}</span></p>
            </div>
        </Card>
    );
}

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

  const availablePercentage = artist.totalEditions > 0 ? (artist.availableEditions / artist.totalEditions) * 100 : 0;

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
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
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
                        <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}><MapPin className="w-4 h-4" /></motion.div>
                        <span>{artist.location}</span>
                    </div>
                )}
                {artist.university && (
                    <div className="flex items-center gap-2">
                        <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}><GraduationCap className="w-4 h-4" /></motion.div>
                        <span>{artist.university}</span>
                    </div>
                )}
                {artist.website && (
                    <a href={artist.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary hover:underline">
                        <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}><LinkIcon className="w-4 h-4" /></motion.div>
                        <span>Portfolio</span>
                    </a>
                )}
                 {artist.twitter && <a href={artist.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}><Twitter className="w-5 h-5"/></motion.div></a>}
                 {artist.instagram && <a href={artist.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}><Instagram className="w-5 h-5"/></motion.div></a>}
                 {artist.linkedin && <a href={artist.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}><Linkedin className="w-5 h-5"/></motion.div></a>}
              </div>
              {artist.style && (
                <div className="mt-4 flex justify-center md:justify-start items-center gap-2 text-muted-foreground">
                    <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}><Palette className="w-4 h-4" /></motion.div>
                    <span className="text-sm">{artist.style}</span>
                </div>
              )}
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
                        <motion.div variants={iconVariants} initial="hidden" animate="visible"><Share2 className="w-5 h-5" /></motion.div>
                        <span className="sr-only">Share Profile</span>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Button size="lg" className="w-full" asChild>
                        <Link href="/portfolio">
                            <motion.div variants={iconVariants} initial="hidden" animate="visible" className="mr-2"><Edit className="h-5 w-5" /></motion.div>
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
                          <motion.div variants={iconVariants} initial="hidden" animate="visible"><Share2 className="w-5 h-5" /></motion.div>
                          <span className="sr-only">Share Profile</span>
                      </Button>
                  </CardHeader>
                  <CardContent>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Current Price</span>
                          <div className="text-3xl font-bold text-primary">
                              ₹{artist.fractalPrice.toLocaleString()}
                          </div>
                      </div>
                      <div className="w-full mb-4">
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                          <span>Fractals Available</span>
                          <span>{artist.availableEditions.toLocaleString()} / {artist.totalEditions.toLocaleString()}</span>
                        </div>
                        <Progress value={availablePercentage} className="h-2" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="lg" className="w-full" onClick={handleCollectClick} disabled={!isCollectible}>
                            <motion.div variants={iconVariants} initial="hidden" animate="visible" className="mr-2"><ShoppingCart className="h-5 w-5" /></motion.div>
                            Collect Now
                        </Button>
                         <Button size="lg" variant="outline" onClick={handleWatchClick} aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}>
                            <motion.div variants={iconVariants} initial="hidden" animate="visible">
                              <Star className={`w-5 h-5 transition-colors ${isWatched ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                            </motion.div>
                        </Button>
                      </div>
                       {!isCollectible && (
                          <p className="text-xs text-center text-destructive mt-2">
                              This artist's fractals are not available for collection until they provide a message to their collectors.
                          </p>
                      )}
                      {(ownedCount > 0 || listedCount > 0) && (
                          <div className="mt-4 text-center text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                              <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}><CheckCircle className="w-4 h-4" /></motion.div>
                              <span>You have {ownedCount} in holdings{listedCount > 0 ? ` and ${listedCount} on sale` : ''} from this artist.</span>
                          </div>
                      )}
                  </CardContent>
              </Card>
           )}
        </div>
      </div>
      
      <Tabs defaultValue="artworks" className="mb-12">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
          <TabsTrigger value="artworks"><motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mr-2"><Palette /></motion.div>Artworks</TabsTrigger>
          <TabsTrigger value="analytics"><motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mr-2"><TrendingUp /></motion.div>Analytics</TabsTrigger>
          <TabsTrigger value="achievements"><motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mr-2"><Award /></motion.div>Achievements</TabsTrigger>
          <TabsTrigger value="sold"><motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mr-2"><History /></motion.div>Previously Sold</TabsTrigger>
          <TabsTrigger value="collectors"><motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mr-2"><Users /></motion.div>Collectors</TabsTrigger>
        </TabsList>
        <TabsContent value="artworks" className="mt-6">
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8">
                {artistFractals.map((fractal) => (
                    <div key={fractal.id} className="break-inside-avoid mb-8">
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
                                    <YAxis allowDecimals={false} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={80} />
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
                                        <LineChart data={fractalPriceHistory} margin={{left: -10}}>
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
                                                width={80}
                                            />
                                            <Tooltip
                                                cursor={{
                                                    stroke: 'hsl(var(--border))',
                                                    strokeWidth: 2,
                                                    strokeDasharray: '3 3',
                                                }}
                                                content={<ChartTooltipContent
                                                    formatter={(value) => `₹${(value as number).toLocaleString()}`}
                                                    labelFormatter={(value) => format(new Date(value), "PP")}
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
                                        <LineChart data={totalValueHistory} margin={{left: -10}}>
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
                                                width={80}
                                            />
                                            <Tooltip
                                                cursor={{
                                                    stroke: 'hsl(var(--border))',
                                                    strokeWidth: 2,
                                                    strokeDasharray: '3 3',
                                                }}
                                                content={<ChartTooltipContent
                                                    formatter={(value) => `₹${(value as number).toLocaleString()}`}
                                                    labelFormatter={(value) => format(new Date(value), "PP")}
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
        <TabsContent value="achievements" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2">
                            <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}><Award /></motion.div> Awards
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {artist.awards.length > 0 ? (
                            <div className="columns-1 sm:columns-2 gap-6 space-y-6">
                                {artist.awards.map((award, i) => (
                                    <div key={i} className="break-inside-avoid">
                                        <Card className="bg-muted/50 overflow-hidden">
                                            {award.image && (
                                                <div className="border-b">
                                                    <Image 
                                                        src={award.image} 
                                                        alt={`Image for ${award.value}`} 
                                                        width={500}
                                                        height={300}
                                                        className="w-full h-auto object-cover"
                                                        data-ai-hint="award certificate" 
                                                    />
                                                </div>
                                            )}
                                            <div className="p-4">
                                                <p className="text-sm text-foreground/80 font-medium">{award.value}</p>
                                            </div>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-muted-foreground">No awards listed.</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2">
                            <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}><Building2 /></motion.div> Exhibitions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {artist.exhibitions.length > 0 ? (
                            <div className="columns-1 sm:columns-2 gap-6 space-y-6">
                                {artist.exhibitions.map((ex, i) => (
                                    <div key={i} className="break-inside-avoid">
                                        <Card className="bg-muted/50 overflow-hidden">
                                            {ex.images && ex.images.length > 0 && (
                                                <div className="border-b bg-black/10">
                                                    <div className={cn(
                                                        "grid gap-px",
                                                        ex.images.length > 1 ? "grid-cols-2" : "grid-cols-1"
                                                    )}>
                                                        {ex.images.map((img, imgIdx) => (
                                                            <div key={imgIdx}>
                                                                <Image 
                                                                    src={img} 
                                                                    alt={`Image for ${ex.value}`} 
                                                                    width={300} 
                                                                    height={300} 
                                                                    className="w-full h-auto object-cover"
                                                                    data-ai-hint="exhibition photo" 
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="p-4">
                                                <p className="text-sm text-foreground/80 font-medium">{ex.value}</p>
                                            </div>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-muted-foreground">No exhibitions listed.</p>}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
         <TabsContent value="sold" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Sales History</CardTitle>
                    <CardDescription>A showcase of artworks previously sold by the artist.</CardDescription>
                </CardHeader>
                <CardContent>
                    {artist.previouslySoldArtworks && artist.previouslySoldArtworks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {artist.previouslySoldArtworks.map((artwork, i) => (
                                <SoldArtworkCard key={i} artwork={artwork} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground py-8 text-center">No sales history provided.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="collectors" className="mt-6">
            <ArtistCollectorsList artistId={artist.id} />
        </TabsContent>
      </Tabs>
    </>
  );
}
