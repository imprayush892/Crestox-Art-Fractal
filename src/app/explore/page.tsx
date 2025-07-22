
'use client';

import { useState, useEffect } from 'react';
import { ExploreTool } from '@/components/explore-tool';
import { ArtistCard } from '@/components/artist-card';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FractalCard } from '@/components/fractal-card';
import { Shield } from 'lucide-react';
import type { Artist, Fractal } from '@/lib/data';

export default function ExplorePage() {
  const { artists, fractals, isAdmin } = useAuth();

  const [shuffledArtists, setShuffledArtists] = useState<Artist[]>([]);
  const [shuffledFractals, setShuffledFractals] = useState<Fractal[]>([]);

  useEffect(() => {
    if (artists.length > 0) {
      setShuffledArtists([...artists].sort(() => 0.5 - Math.random()));
    }
  }, [artists]);

  useEffect(() => {
    if (fractals.length > 0) {
      setShuffledFractals([...fractals].sort(() => 0.5 - Math.random()));
    }
  }, [fractals]);
  
  const pendingFractals = fractals.filter(f => f.status === 'pending_review');
  const artistsMap = new Map(artists.map(a => [a.id, a]));

  return (
    <div className="container py-12">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">Explore</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Discover unique fractal art and the talented artists behind them.
        </p>
      </div>

      <Tabs defaultValue="artwork" className="w-full">
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-md overflow-x-auto pb-2">
            <TabsList className={`w-max min-w-full grid ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <TabsTrigger value="artwork">Artwork</TabsTrigger>
                <TabsTrigger value="artists">Artists</TabsTrigger>
                {isAdmin && (
                    <TabsTrigger value="pending" className="text-destructive">
                        <Shield className="mr-2 h-4 w-4" />
                        Pending Action ({pendingFractals.length})
                    </TabsTrigger>
                )}
            </TabsList>
          </div>
        </div>

        <TabsContent value="artwork">
          <ExploreTool fractals={shuffledFractals} artists={artists} />
        </TabsContent>
        <TabsContent value="artists">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {shuffledArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </TabsContent>
        {isAdmin && (
            <TabsContent value="pending">
              {pendingFractals.length > 0 ? (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-8">
                  {pendingFractals.map((fractal) => {
                    const artist = artistsMap.get(fractal.artistId);
                    if (!artist) return null;
                    return (
                      <div key={fractal.id} className="break-inside-avoid mb-4 sm:mb-8">
                        <FractalCard fractal={fractal} artist={artist} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                    No artworks are pending review.
                </div>
              )}
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
