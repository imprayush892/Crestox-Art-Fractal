
'use client';

import type { Artist, Fractal, ArtworkSize } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { FractalCard } from '@/components/fractal-card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface FractalDetailProps {
    fractal: Fractal;
    artist?: Artist;
    relatedFractals: Fractal[];
    allArtists: Artist[];
}

const DetailItem = ({ label, value }: { label: string; value?: string }) => {
    if (!value) return null;
    return (
        <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{label}</h4>
            <p className="mt-1 text-base text-foreground/80">{value}</p>
        </div>
    );
};

const formatSize = (size: ArtworkSize) => {
    let sizeString = `${size.length} x ${size.breadth}`;
    if (size.height) {
        sizeString += ` x ${size.height}`;
    }
    return `${sizeString} ${size.unit}`;
};

export function FractalDetail({ fractal, artist, relatedFractals, allArtists }: FractalDetailProps) {
  const [currentIndex, setCurrentIndex] = useState(
    fractal.images.indexOf(fractal.heroImage) > -1 ? fractal.images.indexOf(fractal.heroImage) : 0
  );

  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? fractal.images.length - 1 : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev === fractal.images.length - 1 ? 0 : prev + 1));
  
  const artworkValueHistory = fractal.priceHistory.map(p => ({ date: p.date, value: p.price }));
  const hasContext = fractal.subjectSignificance || fractal.personalSignificance || fractal.timeEffort || fractal.biographicalContext || fractal.commissionPatronage;
  const formattedSize = formatSize(fractal.artworkSize);

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
        <div className="lg:col-span-3">
          <div className="bg-muted rounded-lg overflow-hidden shadow-lg mb-4 relative group">
            <Image
              src={fractal.images[currentIndex]}
              alt={fractal.title}
              width={fractal.width}
              height={fractal.height}
              className="w-full h-auto object-cover transition-opacity duration-300"
              data-ai-hint={fractal.aiHint}
              priority
              key={currentIndex}
            />
            {fractal.crestoxGrade && (
                <Badge variant="secondary" className="absolute top-4 right-4 text-base py-1 px-3 shadow-lg">
                    <Star className="w-4 h-4 mr-2 text-yellow-400 fill-yellow-400" />
                    Crestox Grade: {fractal.crestoxGrade}
                </Badge>
            )}

            {fractal.images.length > 1 && (
                <>
                    <Button onClick={handlePrev} size="icon" variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronLeft />
                    </Button>
                    <Button onClick={handleNext} size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {fractal.images.map((_, index) => (
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
                </>
            )}
          </div>
         
            <h2 className="font-headline text-3xl font-bold mb-6">Artwork Value History</h2>
            <Card>
              <CardHeader>
                  <CardTitle>Value Over Time</CardTitle>
                  <CardDescription>Historical value of the artwork "{fractal.title}".</CardDescription>
              </CardHeader>
              <CardContent>
                  <ChartContainer 
                      config={{ value: { label: "Value", color: "hsl(var(--primary))" } }} 
                      className="h-[300px] w-full"
                  >
                      <LineChart data={artworkValueHistory} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
                              tickFormatter={(value) => `₹${(value as number).toLocaleString('en-IN')}`}
                          />
                          <Tooltip
                              cursor={{
                                  stroke: 'hsl(var(--border))',
                                  strokeWidth: 2,
                                  strokeDasharray: '3 3',
                              }}
                              content={<ChartTooltipContent
                                  formatter={(value) => `₹${(value as number).toLocaleString('en-IN')}`}
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
              </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <h1 className="font-headline text-4xl font-bold">{fractal.title}</h1>
            
            {artist && (
              <div className="mt-4">
                <Link href={`/artist/${artist.id}`} className="group inline-flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={artist.avatar} alt={artist.name} />
                    <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">From the portfolio of</p>
                    <p className="font-semibold text-lg group-hover:text-primary transition-colors">{artist.name}</p>
                  </div>
                </Link>
              </div>
            )}

            <div className="text-4xl font-bold text-primary mt-6">
                ₹{fractal.price.toLocaleString('en-IN')}
            </div>
            <p className="text-sm text-muted-foreground">Artwork valuation</p>

            <p className="text-lg text-muted-foreground mt-4">{fractal.description}</p>
            
            <div className="mt-6 space-y-4 border-t pt-6">
                <DetailItem label="Medium / Materials" value={fractal.materials} />
                <DetailItem label="Size" value={formattedSize} />
            </div>

            {hasContext && (
               <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="hover:no-underline py-2">
                        <h3 className="text-base font-semibold">View Artwork Context</h3>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-2">
                           <DetailItem label="Subject / Cultural Significance" value={fractal.subjectSignificance} />
                            <DetailItem label="Personal / Emotional Significance" value={fractal.personalSignificance} />
                            <DetailItem label="Time Spent / Effort" value={fractal.timeEffort} />
                            <DetailItem label="Biographical / Contextual Relevance" value={fractal.biographicalContext} />
                            <DetailItem label="Commission / Patronage" value={fractal.commissionPatronage} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {artist && (
                <div className="mt-6 border-t pt-6">
                    <Button size="lg" className="w-full" asChild>
                        <Link href={`/artist/${artist.id}`}>
                            Collect from Artist's Portfolio
                        </Link>
                    </Button>
                     <p className="text-center text-xs text-muted-foreground mt-2">Collect a fractal from this artist's entire collection.</p>
                </div>
            )}
          </div>
        </div>
      </div>
      
      {relatedFractals.length > 0 && (
          <div className="mt-24">
            <h2 className="font-headline text-3xl font-bold mb-6">More from this Artist</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {relatedFractals.map(relatedFractal => {
                    const relatedArtist = allArtists.find(a => a.id === relatedFractal.artistId);
                    if (!relatedArtist) return null;
                    return <FractalCard key={relatedFractal.id} fractal={relatedFractal} artist={relatedArtist} />;
                })}
            </div>
          </div>
      )}
    </>
  );
}
