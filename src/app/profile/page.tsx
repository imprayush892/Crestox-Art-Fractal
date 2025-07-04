'use client';

import { CollectionClient } from '@/components/collection-client';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PortfolioClient } from '@/components/portfolio-client';
import { Package, Palette } from 'lucide-react';

function ProfilePageContent() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultView = searchParams.get('view') === 'portfolio' ? 'portfolio' : 'collection';


  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/profile');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading Your Profile...</p>
            </div>
        </div>
    );
  }

  if (!isLoggedIn) {
      return null;
  }

  return (
    <div className="container py-12">
        <div className="text-center mb-8">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">My Profile</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                Manage your collection and artist portfolio.
            </p>
        </div>

        <Tabs defaultValue={defaultView} className="w-full">
            <div className="flex justify-center mb-8">
                <TabsList className="grid w-full max-w-sm grid-cols-2">
                    <TabsTrigger value="collection">
                        <Package className="mr-2 h-4 w-4" />
                        My Collection
                    </TabsTrigger>
                    <TabsTrigger value="portfolio">
                        <Palette className="mr-2 h-4 w-4" />
                        My Portfolio
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="collection">
                <CollectionClient />
            </TabsContent>
            <TabsContent value="portfolio">
                <PortfolioClient />
            </TabsContent>
        </Tabs>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-background z-50"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <ProfilePageContent />
    </Suspense>
  )
}
