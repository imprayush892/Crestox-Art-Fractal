'use client';

import type { Artist, Fractal } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FractalCard } from '@/components/fractal-card';

interface FractalDetailProps {
    fractal: Fractal;
    artist?: Artist;
    relatedFractals: Fractal[];
    allArtists: Artist[];
}

export function FractalDetail({ fractal, artist, relatedFractals, allArtists }: FractalDetailProps) {

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
        <div className="lg:col-span-3">
          <div className="bg-muted rounded-lg overflow-hidden shadow-lg">
            <Image
              src={fractal.image}
              alt={fractal.title}
              width={fractal.width}
              height={fractal.height}
              className="w-full h-auto object-cover"
              data-ai-hint={fractal.aiHint}
              priority
            />
          </div>
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

            <p className="text-lg text-muted-foreground mt-4">{fractal.description}</p>
            
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="secondary">Fractal</Badge>
              <Badge variant="secondary">Digital Art</Badge>
              <Badge variant="secondary">Algorithmic</Badge>
            </div>

            {artist && (
                <div className="mt-8 border-t pt-8">
                    <Button size="lg" className="w-full" asChild>
                        <Link href={`/artist/${artist.id}`}>
                            Invest in Artist&apos;s Portfolio
                        </Link>
                    </Button>
                     <p className="text-center text-xs text-muted-foreground mt-2">Invest in a share of this artist&apos;s entire collection.</p>
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
