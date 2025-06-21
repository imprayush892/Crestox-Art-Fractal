'use client';

import type { Artist } from '@/lib/data';
import { ArtistCard } from '@/components/artist-card';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';

interface CollectionClientProps {
    artists: Artist[];
}

export function CollectionClient({ artists }: CollectionClientProps) {
  const { isLoggedIn, collection } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/collection');
    }
  }, [isLoggedIn, router]);

  const userPortfolio = artists.filter(a => collection.includes(a.id));

  if (!isLoggedIn) {
    return null; // or a loading spinner
  }

  return (
    <>
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">My Portfolio</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          A gallery of the artist portfolios you have invested in.
        </p>
      </div>
      
      {userPortfolio.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {userPortfolio.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
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
