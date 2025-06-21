import { fractals, artists } from '@/lib/data';
import { FractalCard } from '@/components/fractal-card';

export default function CollectionPage() {
  const userCollection = fractals.slice(0, 4); 
  const getArtistById = (artistId: string) => artists.find(a => a.id === artistId);

  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">My Collection</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          A personal gallery of the fractal worlds you've chosen.
        </p>
      </div>
      
      {userCollection.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {userCollection.map((fractal) => {
            const artist = getArtistById(fractal.artistId);
            if (!artist) return null;
            return <FractalCard key={fractal.id} fractal={fractal} artist={artist} />;
          })}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">Your collection is empty.</h2>
            <p className="mt-2 text-muted-foreground">Start exploring to find art that resonates with you.</p>
        </div>
      )}
    </div>
  );
}
