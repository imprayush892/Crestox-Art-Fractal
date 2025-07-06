
'use client';

import type { Artist, Fractal, ArtworkSize } from '@/lib/data';
import { SafeImage as Image } from '@/components/ui/safe-image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { FractalCard } from '@/components/fractal-card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { Star, ChevronLeft, ChevronRight, Edit, Flag, Loader2, Clock } from 'lucide-react';
import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import { notFound } from 'next/navigation';


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
  const { user, isAdmin, updateFractalPriceAsAdmin, flagArtwork } = useAuth();
  const { toast } = useToast();
  
  if (fractal.status === 'pending_review' && !isAdmin && user?.uid !== artist?.userId) {
      notFound();
  }
  
  const [currentIndex, setCurrentIndex] = useState(
    fractal.images.indexOf(fractal.heroImage) > -1 ? fractal.images.indexOf(fractal.heroImage) : 0
  );
  
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [newPrice, setNewPrice] = useState<string>(fractal.price.toString());
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const [isFlagging, setIsFlagging] = useState(false);
  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");


  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? fractal.images.length - 1 : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev === fractal.images.length - 1 ? 0 : prev + 1));
  
  const artworkValueHistory = fractal.priceHistory.map(p => ({ date: p.date, value: p.price }));
  const hasContext = fractal.subjectSignificance || fractal.personalSignificance || fractal.timeEffort || fractal.biographicalContext || fractal.commissionPatronage;
  const formattedSize = formatSize(fractal.artworkSize);

  const handleUpdatePrice = async () => {
    setIsUpdatingPrice(true);
    try {
        await updateFractalPriceAsAdmin(fractal.id, Number(newPrice));
        toast({ title: "Price Updated", description: `Price for "${fractal.title}" has been updated.`});
        setIsPriceDialogOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Update Failed", description: error.message });
    } finally {
        setIsUpdatingPrice(false);
    }
  };

  const handleFlagSubmit = async () => {
    if (!flagReason) {
        toast({ variant: "destructive", title: "Reason required", description: "Please provide a reason for flagging." });
        return;
    }
    setIsFlagging(true);
    try {
        await flagArtwork(fractal.id, !fractal.isFlagged, flagReason);
        toast({ title: `Artwork ${fractal.isFlagged ? 'Unflagged' : 'Flagged'}`});
        setIsFlagDialogOpen(false);
        setFlagReason("");
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Action Failed", description: error.message });
    } finally {
        setIsFlagging(false);
    }
  };

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
              className={cn("w-full h-auto object-cover transition-opacity duration-300", fractal.isFlagged && "opacity-50 grayscale")}
              data-ai-hint={fractal.aiHint}
              priority
              key={currentIndex}
            />
            {fractal.crestoxGrade && fractal.status === 'active' && (
                <Badge variant="secondary" className="absolute top-4 right-4 text-base py-1 px-3 shadow-lg">
                    <motion.div variants={iconVariants} initial="hidden" animate="visible" className="mr-2"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /></motion.div>
                    Crestox Grade: {fractal.crestoxGrade}
                </Badge>
            )}

            {fractal.status === 'pending_review' && (
                 <Badge variant="destructive" className="absolute top-4 right-4 text-base py-1 px-3 shadow-lg">
                    <motion.div variants={iconVariants} initial="hidden" animate="visible" className="mr-2"><Clock className="w-4 h-4" /></motion.div>
                    Pending Review
                </Badge>
            )}

            {fractal.isFlagged && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="flex items-center gap-2 text-white bg-destructive/80 p-4 rounded-lg">
                        <Flag className="h-8 w-8" />
                        <span className="text-xl font-bold">FLAGGED FOR REVIEW</span>
                    </div>
                </div>
            )}


            {fractal.images.length > 1 && (
                <>
                    <Button onClick={handlePrev} size="icon" variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.div variants={iconVariants} initial="hidden" animate="visible"><ChevronLeft /></motion.div>
                    </Button>
                    <Button onClick={handleNext} size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.div variants={iconVariants} initial="hidden" animate="visible"><ChevronRight /></motion.div>
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
         
            <h2 className="font-headline text-2xl md:text-3xl font-bold mb-6">Artwork Value History</h2>
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
                              tickFormatter={(value) => format(new Date(value), "MMM d")}
                          />
                          <YAxis
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              tickFormatter={(value) => `₹${(value as number).toLocaleString()}`}
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
              </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <h1 className="font-headline text-3xl md:text-4xl font-bold">{fractal.title}</h1>
            
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

            {fractal.status === 'pending_review' ? (
                <div className="text-2xl font-bold text-muted-foreground mt-6">
                    Valuation Pending
                </div>
            ) : (
                <div className="text-4xl font-bold text-primary mt-6">
                    ₹{fractal.price.toLocaleString()}
                </div>
            )}
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

            {artist && !isAdmin && fractal.status === 'active' && (
                <div className="mt-6 border-t pt-6">
                    <Button size="lg" className="w-full" asChild>
                        <Link href={`/artist/${artist.id}`}>
                            Collect from Artist's Portfolio
                        </Link>
                    </Button>
                     <p className="text-center text-xs text-muted-foreground mt-2">Collect a fractal from this artist's entire collection.</p>
                </div>
            )}
            
            {isAdmin && (
              <Card className="mt-6 border-yellow-500/50">
                <CardHeader>
                  <CardTitle>Admin Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <Button onClick={() => setIsPriceDialogOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Price</Button>
                    <Button variant={fractal.isFlagged ? "destructive" : "outline"} onClick={() => setIsFlagDialogOpen(true)}>
                        <Flag className="mr-2 h-4 w-4" />
                        {fractal.isFlagged ? 'Unflag Artwork' : 'Flag Artwork'}
                    </Button>
                </CardContent>
              </Card>
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

      {/* Admin Dialogs */}
      <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Edit Artwork Price</DialogTitle>
                  <DialogDescription>Manually set a new price for "{fractal.title}". This action will be recorded.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Label htmlFor="new-price">New Price (₹)</Label>
                  <Input id="new-price" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsPriceDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdatePrice} disabled={isUpdatingPrice}>
                      {isUpdatingPrice && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Price
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      <Dialog open={isFlagDialogOpen} onOpenChange={setIsFlagDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Reason for {fractal.isFlagged ? 'Unflagging' : 'Flagging'}</DialogTitle>
                  <DialogDescription>
                    Provide a reason for this action. This will be sent as a notification to the artist.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Label htmlFor="flag-reason">Reason</Label>
                  <Textarea 
                    id="flag-reason" 
                    value={flagReason} 
                    onChange={(e) => setFlagReason(e.target.value)}
                    placeholder="e.g., Copyright concern, low quality image..."
                  />
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsFlagDialogOpen(false)} disabled={isFlagging}>Cancel</Button>
                  <Button onClick={handleFlagSubmit} disabled={isFlagging}>
                      {isFlagging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </>
  );
}
