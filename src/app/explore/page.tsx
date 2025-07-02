'use client';

import { ExploreTool } from '@/components/explore-tool';
import { ArtistCard } from '@/components/artist-card';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ExplorePage() {
  const { artists, fractals } = useAuth();

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
            <TabsList className="grid w-full max-w-sm grid-cols-2">
                <TabsTrigger value="artwork">Artwork</TabsTrigger>
                <TabsTrigger value="artists">Artists</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="artwork">
          <ExploreTool fractals={fractals} artists={artists} />
        </TabsContent>
        <TabsContent value="artists">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
