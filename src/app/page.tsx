
'use client';

import { useAuth } from '@/context/auth-context';
import { type Fractal } from '@/lib/data';
import { FractalCard } from '@/components/fractal-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

const getPublicUrl = (path: string) => {
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
        // Fallback for local dev or misconfigured env
        return 'https://placehold.co/564x370.png';
    }
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
}

const wordmarkUrl = getPublicUrl('public/assets/crestox-wordmark.png');

export default function Home() {
  const { artists, fractals } = useAuth();
  const [displayedFractals, setDisplayedFractals] = useState<Fractal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const artistsMap = useMemo(() => new Map(artists.map(a => [a.id, a])), [artists]);
  const getArtistById = (artistId: string) => artistsMap.get(artistId);

  useEffect(() => {
    // This code runs only on the client, after the component has mounted.
    if (fractals.length > 0) {
      const shuffled = [...fractals].sort(() => 0.5 - Math.random());
      setDisplayedFractals(shuffled.slice(0, 100));
      setIsLoading(false);
    }
  }, [fractals]); 

  const renderSkeletons = () => {
    return (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8">
            {[...Array(12)].map((_, i) => (
                <div key={i} className="break-inside-avoid">
                    <Skeleton className="h-64 w-full" />
                </div>
            ))}
        </div>
    );
  };


  return (
    <div className="container py-12">
      <div className="flex flex-col items-center justify-center text-center min-h-[50vh] mb-12">
        <Image
            src={wordmarkUrl}
            alt="Crestox Wordmark"
            width={564}
            height={370}
            className="h-auto w-full max-w-sm mb-4"
            data-ai-hint="company logo"
            priority
        />
        <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight">Democratizing Art</h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
          Crestox is a revolutionary platform dedicated to making the world of art accessible. We believe in the power of art to inspire, connect, and transform.
        </p>
      </div>
      
      {isLoading ? renderSkeletons() : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8">
          {displayedFractals.map((fractal) => {
            const artist = getArtistById(fractal.artistId);
            if (!artist) return null;
            return (
              <div key={fractal.id} className="break-inside-avoid">
                <FractalCard fractal={fractal} artist={artist} />
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center mt-16">
        <Button size="lg" variant="outline" asChild>
          <Link href="/explore">Explore More</Link>
        </Button>
      </div>
    </div>
  );
}
