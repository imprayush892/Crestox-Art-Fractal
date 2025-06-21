import { artists } from '@/lib/data';
import { ArtistCard } from '@/components/artist-card';

export default function ArtistsPage() {
  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">Meet the Artists</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          The creative minds behind the mesmerizing fractal art on Crestox.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {artists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
    </div>
  );
}
