
import { fractals, artists } from '@/lib/data';
import { FractalCard } from '@/components/fractal-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const artistsMap = new Map(artists.map(a => [a.id, a]));
  const getArtistById = (artistId: string) => artistsMap.get(artistId);

  // This is a server component, so this will run on every request in dev,
  // and at build time in prod. For a truly random experience on each refresh in production,
  // this page might need to be dynamically rendered.
  const shuffledFractals = [...fractals].sort(() => 0.5 - Math.random());
  const displayedFractals = shuffledFractals.slice(0, 100);

  return (
    <div className="container py-12">
      <div className="flex flex-col items-center justify-center text-center min-h-[50vh] mb-12">
        <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight">Democratizing Art</h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
          Crestox is a revolutionary platform dedicated to making the world of art accessible. We believe in the power of art to inspire, connect, and transform.
        </p>
      </div>
      
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

      <div className="text-center mt-16">
        <Button size="lg" variant="outline" asChild>
          <Link href="/explore">Explore More</Link>
        </Button>
      </div>
    </div>
  );
}
