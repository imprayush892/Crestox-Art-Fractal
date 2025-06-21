
import { fractals, artists } from '@/lib/data';
import { FractalCard } from '@/components/fractal-card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const getArtistById = (artistId: string) => artists.find(a => a.id === artistId);

  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">Explore the Digital Canvas</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Discover a universe of infinite detail and mesmerizing beauty in our curated collection of fractal art.
        </p>
      </div>
      
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8">
        {fractals.map((fractal) => {
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
        <Button size="lg" variant="outline">Explore More</Button>
      </div>
    </div>
  );
}
