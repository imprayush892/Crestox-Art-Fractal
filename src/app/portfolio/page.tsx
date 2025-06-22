'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DollarSign, Eye, ImageIcon, Palette, Settings, TrendingUp, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function PortfolioPage() {
  const { isLoggedIn, artistProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/portfolio');
    }
  }, [isLoggedIn, router]);

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
  const fractalsSold = artistProfile.totalEditions - artistProfile.availableEditions;
  // This is a placeholder for now, as earnings tracking is not yet implemented.
  const totalEarnings = 0;

  return (
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
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="overview"><TrendingUp className="mr-2" /> Overview</TabsTrigger>
          <TabsTrigger value="artworks"><Palette className="mr-2" /> My Artworks</TabsTrigger>
          <TabsTrigger value="earnings"><DollarSign className="mr-2" /> Sales & Earnings</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-2" /> Profile Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
                <CardTitle>Portfolio Overview</CardTitle>
                <CardDescription>A summary of your performance on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${currentPortfolioValue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Based on current fractal prices</p>
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
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Fractals Sold</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{fractalsSold.toLocaleString()}</div>
                             <p className="text-xs text-muted-foreground">All-time sales from your portfolio</p>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="artworks" className="mt-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>My Artworks</CardTitle>
                        <CardDescription>Manage your listed fractals and portfolios. This is where you would list new art.</CardDescription>
                    </div>
                     <Button><ImageIcon className="mr-2"/>Add New Artwork</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Artwork/Portfolio</TableHead>
                                <TableHead>Fractal Price</TableHead>
                                <TableHead>Available / Total Editions</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             <TableRow>
                                <TableCell className="font-medium">{artistProfile.name}'s Portfolio</TableCell>
                                <TableCell>${artistProfile.fractalPrice.toFixed(2)}</TableCell>
                                <TableCell>{artistProfile.availableEditions.toLocaleString()} / {artistProfile.totalEditions.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" disabled>Edit</Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="earnings" className="mt-6">
            <Card>
                 <CardHeader>
                    <CardTitle>Sales & Earnings</CardTitle>
                    <CardDescription>Track your sales and manage payouts. A verified identity is required for payouts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-sm text-muted-foreground">This section will show detailed sales history and allow you to withdraw your earnings. This feature is coming soon.</p>
                   <Button disabled>Withdraw Earnings</Button>
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
                    <p className="text-sm text-muted-foreground">This section will contain a form to edit your artist name, bio, and avatar, and manage communications. This feature is coming soon.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
