
'use client';

import { useAuth } from '@/context/auth-context';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DollarSign, Eye, ImageIcon, Layers, Palette, Settings, Tag, TrendingUp, UserPlus, Wand2, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import { ArtistSettingsForm } from '@/components/artist-settings-form';
import { SafeImage as Image } from '@/components/ui/safe-image';
import type { Fractal } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { ScorecardDialog } from '@/components/scorecard-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

export function PortfolioClient() {
  const { artistProfile, fractals } = useAuth();
  const [selectedFractal, setSelectedFractal] = useState<Fractal | null>(null);

  const artistFractals = useMemo(() => {
    if (!artistProfile) return [];
    return fractals.filter(f => f.artistId === artistProfile.id);
  }, [fractals, artistProfile]);


  if (!artistProfile) {
    return (
      <div className="container py-12 text-center">
        <h1 className="font-headline text-4xl font-bold">Become an Artist on Crestox</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          You are not currently registered as an artist. Join our community to showcase and sell your fractal art.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/portfolio/create">
            <motion.div variants={iconVariants} initial="hidden" animate="visible" className="mr-2"><UserPlus /></motion.div>
            Create Artist Profile
          </Link>
        </Button>
      </div>
    );
  }
  
  const currentPortfolioValue = artistProfile.totalPortfolioValueHistory?.slice(-1)[0]?.value ?? 0;
  const fractalsSoldCount = artistProfile.totalEditions - artistProfile.availableEditions;
  const needsArtistMessage = artistFractals.length > 0 && !artistProfile.artistMessage;
  
  const totalEarnings = 0;

  return (
    <>
      <ScorecardDialog
        fractal={selectedFractal}
        isOpen={!!selectedFractal}
        onClose={() => setSelectedFractal(null)}
      />
      <div className="container py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border">
              <AvatarImage src={artistProfile.avatar} alt={artistProfile.name} data-ai-hint="artist avatar" />
              <AvatarFallback>{artistProfile.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-headline text-3xl md:text-4xl font-bold">{artistProfile.name}</h1>
              <p className="text-muted-foreground">Your Artist Dashboard</p>
            </div>
          </div>
          <Button asChild>
              <Link href={`/artist/${artistProfile.id}`}>
                  <motion.div variants={iconVariants} initial="hidden" animate="visible" className="mr-2"><Eye /></motion.div>
                  View Public Profile
              </Link>
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="w-max">
              <TabsTrigger value="overview"><motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mr-2"><TrendingUp /></motion.div> Overview</TabsTrigger>
              <TabsTrigger value="artworks"><motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mr-2"><Palette /></motion.div> My Artworks</TabsTrigger>
              <TabsTrigger value="settings" className="relative">
                <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mr-2"><Settings /></motion.div>
                Profile Settings
                {needsArtistMessage && (
                  <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                  <CardTitle>Portfolio Overview</CardTitle>
                  <CardDescription>A summary of your performance on the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
                              <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.8 }}><DollarSign className="h-4 w-4 text-muted-foreground" /></motion.div>
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">₹{currentPortfolioValue.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">Based on artwork valuations</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Current Fractal Price</CardTitle>
                              <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.8 }}><Tag className="h-4 w-4 text-muted-foreground" /></motion.div>
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">₹{artistProfile.fractalPrice.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">Market price per portfolio fractal</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Available Fractals</CardTitle>
                              <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.8 }}><Layers className="h-4 w-4 text-muted-foreground" /></motion.div>
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">{artistProfile.availableEditions.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">Portfolio fractals available to buy</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Fractals Sold</CardTitle>
                              <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.8 }}><TrendingUp className="h-4 w-4 text-muted-foreground" /></motion.div>
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">+{fractalsSoldCount.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">Total fractals sold from your portfolio</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                              <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.8 }}><DollarSign className="h-4 w-4 text-muted-foreground" /></motion.div>
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">₹{totalEarnings.toFixed(2)}</div>
                              <p className="text-xs text-muted-foreground">After platform fees</p>
                          </CardContent>
                      </Card>
                  </div>
              </CardContent>
            </Card>
            <Card>
                  <CardHeader>
                      <CardTitle>Sales & Payouts</CardTitle>
                      <CardDescription>Track your sales and manage payouts. A verified identity is required for payouts.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">This section will show detailed sales history and allow you to withdraw your earnings. This feature is coming soon.</p>
                    <Button disabled>Withdraw Earnings</Button>
                  </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="artworks" className="mt-6">
              <Card>
                  <CardHeader className="flex-row items-center justify-between">
                      <div>
                          <CardTitle>My Artworks</CardTitle>
                          <CardDescription>Manage your listed artworks.</CardDescription>
                      </div>
                      <Button asChild>
                          <Link href="/portfolio/artwork/create">
                              <motion.div variants={iconVariants} initial="hidden" animate="visible" className="mr-2"><ImageIcon /></motion.div>Add New Artwork
                          </Link>
                      </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full overflow-x-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-[80px] hidden md:table-cell">Image</TableHead>
                                  <TableHead>Artwork</TableHead>
                                  <TableHead>Valuation</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {artistFractals.length > 0 ? artistFractals.map(fractal => (
                                  <TableRow key={fractal.id}>
                                      <TableCell className="hidden md:table-cell">
                                          <Image src={fractal.heroImage} alt={fractal.title} width={40} height={40} className="rounded-md object-cover" />
                                      </TableCell>
                                      <TableCell className="font-medium">{fractal.title}</TableCell>
                                      <TableCell>
                                        {fractal.status === 'pending_review' ? (
                                            <span className="text-muted-foreground italic">To be decided</span>
                                        ) : `₹${fractal.price.toLocaleString()}`}
                                      </TableCell>
                                      <TableCell>
                                        {fractal.status === 'pending_review' ? (
                                             <Badge variant="destructive" className="flex items-center gap-1.5">
                                                <Clock className="h-3 w-3"/>
                                                Pending Review
                                            </Badge>
                                        ) : fractal.crestoxGrade ? (
                                            <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => setSelectedFractal(fractal)}>
                                                <Badge variant="secondary">{fractal.crestoxGrade}</Badge>
                                            </Button>
                                        ) : fractal.aiScore !== undefined ? (
                                            <Button variant="outline" size="sm" onClick={() => setSelectedFractal(fractal)}>
                                                View Scorecard
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">Not Evaluated</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right space-x-2">
                                          <Button variant="outline" size="sm" asChild>
                                              <Link href={`/portfolio/artwork/edit/${fractal.id}`} className="flex items-center">
                                                <motion.div variants={iconVariants} initial="hidden" animate="visible" className="mr-2"><Wand2 className="h-3 w-3" /></motion.div>
                                                Edit
                                              </Link>
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              )) : (
                                  <TableRow>
                                      <TableCell colSpan={5} className="text-center h-24">
                                          You haven't listed any artwork yet.
                                      </TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                      </div>
                  </CardContent>
              </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
              <Card>
                  <CardHeader>
                      <CardTitle>Profile Settings</CardTitle>
                      <CardDescription>Update your public artist profile and manage account settings.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      {needsArtistMessage && (
                        <Alert variant="destructive" className="mb-6">
                            <motion.div variants={iconVariants} initial="hidden" animate="visible"><AlertTriangle className="h-4 w-4" /></motion.div>
                            <AlertTitle>Action Required</AlertTitle>
                            <AlertDescription>
                                Add a "Message to your Collectors" to make your artworks collectible. This message will be included on their certificate of holding.
                            </AlertDescription>
                        </Alert>
                      )}
                      <ArtistSettingsForm artist={artistProfile} />
                  </CardContent>
              </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
