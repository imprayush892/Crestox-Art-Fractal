import { artists, fractals } from '@/lib/data';
import { notFound } from 'next/navigation';
import { ArtistProfile } from '@/components/artist-profile';

export default function ArtistProfilePage({ params }: { params: { id: string } }) {
  const artist = artists.find(a => a.id === params.id);

  if (!artist) {
    notFound();
  }

  const artistFractals = fractals.filter(f => f.artistId === artist.id);

  return (
    <div className="container py-12">
      <ArtistProfile artist={artist} artistFractals={artistFractals} />
    </div>
  );
}
