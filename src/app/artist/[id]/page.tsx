import { artists, fractals } from '@/lib/data';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FractalCard } from '@/components/fractal-card';

export default function ArtistProfilePage({ params }: { params: { id:string } }) {
  const artist = artists.find(a => a.id === params.id);

  if (!artist) {
    notFound();
  }

  const artistFractals = fractals.filter(f => f.artistId === artist.id);

  return (
    <div className="container py-12">
      <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12 mb-12">
        <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-primary shadow-lg">
          <AvatarImage src={artist.avatar} alt={artist.name} />
          <AvatarFallback className="text-4xl">{artist.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="pt-4">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">{artist.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{artist.bio}</p>
        </div>
      </div>

      <div>
        <h2 className="font-headline text-3xl font-bold mb-8 border-b pb-4">Artwork by {artist.name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {artistFractals.map((fractal) => (
                <FractalCard key={fractal.id} fractal={fractal} artist={artist} />
            ))}
        </div>
      </div>
    </div>
  );
}
