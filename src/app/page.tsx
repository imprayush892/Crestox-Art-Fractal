import { fractals, artists } from '@/lib/data';
import { FractalCard } from '@/components/fractal-card';

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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
        {fractals.map((fractal) => {
          const artist = getArtistById(fractal.artistId);
          if (!artist) return null;
          return <FractalCard key={fractal.id} fractal={fractal} artist={artist} />;
        })}
      </div>
    </div>
  );
}
