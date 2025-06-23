
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DollarSign, Eye, ImageIcon, Layers, Palette, Settings, Tag, TrendingUp, UserPlus, FileText } from 'lucide-react';
import Link from 'next/link';
import { ArtistSettingsForm } from '@/components/artist-settings-form';
import Image from 'next/image';
import type { Fractal } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { ScorecardDialog } from '@/components/scorecard-dialog';
import { ReevaluationDialog } from '@/components/reevaluation-dialog';

export default function PortfolioPage() {
  const { isLoggedIn, artistProfile, fractals } = useAuth();
  const router = useRouter();
  const [selectedFractal, setSelectedFractal] = useState<Fractal | null>(null);
  const [fractalForReevaluation, setFractalForReevaluation] = useState<Fractal | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/portfolio');
    }
  }, [isLoggedIn, router]);
  
  const artistFractals = useMemo(() => {
    if (!artistProfile) return [];
    return fractals.filter(f => f.artistId === artistProfile.id);
  }, [fractals, artistProfile]);

  if (!isLoggedIn) {
    return null; // Or a loading spinner
  }

  if (!artistProfile) {
    return (
      <div className="container py-12 text-center">
        <h1 className="font-headline text-4xl font-bold">Become an Artist on Crestox</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          You are not currently registered as an artist. Join our community to showcase and sell your fractal art.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/portfolio/create">
            <UserPlus className="mr-2" />
            Create Artist Profile
          </Link>
        </Button>
      </div>
    );
  }
  
  const currentPortfolioValue = artistProfile.totalPortfolioValueHistory?.slice(-1)[0]?.value ?? 0;
  const fractalsSoldCount = artistProfile.totalEditions - artistProfile.availableEditions;
  
  // This is a placeholder for now, as earnings tracking is not yet implemented.
  const totalEarnings = 0;

  return (
    <>
      <ScorecardDialog
        fractal={selectedFractal}
        isOpen={!!selectedFractal}
        onClose={() => setSelectedFractal(null)}
      />
       <ReevaluationDialog
        fractal={fractalForReevaluation}
        artist={artistProfile}
        isOpen={!!fractalForReevaluation}
        onClose={() => setFractalForReevaluation(null)}
      />
      <div className="container py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border">
              <AvatarImage src={artistProfile.avatar} alt={artistProfile.name} data-ai-hint="artist avatar" />
              <AvatarFallback>{artistProfile.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-headline text-4xl font-bold">{artistProfile.name}</h1>
              <p className="text-muted-foreground">Your Artist Dashboard</p>
            </div>
          </div>
          <Button asChild>
              <Link href={`/artist/${artistProfile.id}`}>
                  <Eye className="mr-2" />
                  View Public Profile
              </Link>
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="overview"><TrendingUp className="mr-2" /> Overview</TabsTrigger>
            <TabsTrigger value="artworks"><Palette className="mr-2" /> My Artworks</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="mr-2" /> Profile Settings</TabsTrigger>
          </TabsList>
          
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
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">${currentPortfolioValue.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">Based on artwork valuations</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Current Fractal Price</CardTitle>
                              <Tag className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">${artistProfile.fractalPrice.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">Market price per portfolio share</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Available Fractals</CardTitle>
                              <Layers className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">{artistProfile.availableEditions.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">Portfolio shares available to buy</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Fractals Sold</CardTitle>
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">+{fractalsSoldCount.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">Total shares sold from your portfolio</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
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
                              <ImageIcon className="mr-2"/>Add New Artwork
                          </Link>
                      </Button>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-[80px] hidden md:table-cell">Image</TableHead>
                                  <TableHead>Artwork</TableHead>
                                  <TableHead>Valuation</TableHead>
                                  <TableHead>AI Grade</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {artistFractals.length > 0 ? artistFractals.map(fractal => (
                                  <TableRow key={fractal.id}>
                                      <TableCell className="hidden md:table-cell">
                                          <Image src={fractal.image} alt={fractal.title} width={40} height={40} className="rounded-md object-cover" />
                                      </TableCell>
                                      <TableCell className="font-medium">{fractal.title}</TableCell>
                                      <TableCell>${fractal.price.toLocaleString()}</TableCell>
                                      <TableCell>
                                        {fractal.aiGrade ? (
                                            <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => setSelectedFractal(fractal)}>
                                                <Badge variant="secondary">{fractal.aiGrade}</Badge>
                                            </Button>
                                        ) : fractal.aiScore !== undefined ? (
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => setSelectedFractal(fractal)}>
                                                    View Scorecard
                                                </Button>
                                                <Button size="sm" onClick={() => setFractalForReevaluation(fractal)}>
                                                    Get Grade
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">Not Evaluated</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right space-x-2">
                                          <Button variant="outline" size="sm" asChild>
                                              <Link href={`/portfolio/artwork/edit/${fractal.id}`}>Edit</Link>
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
                      <ArtistSettingsForm artist={artistProfile} />
                  </CardContent>
              </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
