
'use client';

import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ArtistProfile } from '@/components/artist-profile';
import { useMemo } from 'react';

export default function ArtistProfilePage() {
  const params = useParams();
  const { artists, fractals } = useAuth();
  
  const id = typeof params.id === 'string' ? params.id : '';
  const artist = artists.find(a => a.id === id);

  if (!artist) {
    notFound();
  }
  
  const artistFractals = useMemo(() => {
    return fractals.filter(f => f.artistId === artist.id && f.status !== 'pending_review');
  }, [artist.id, fractals]);

  return (
    <div className="container py-12">
      <ArtistProfile artist={artist} artistFractals={artistFractals} />
    </div>
  );
}
