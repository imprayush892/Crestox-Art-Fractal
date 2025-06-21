import { artists, fractals } from '@/lib/data';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { FractalDetail } from '@/components/fractal-detail';

export default function FractalDetailPage({ params }: { params: { id: string } }) {
  const fractal = fractals.find(f => f.id === params.id);
  
  if (!fractal) {
    notFound();
  }

  const artist = artists.find(a => a.id === fractal.artistId);
  const relatedFractals = fractals.filter(f => f.artistId === fractal.artistId && f.id !== fractal.id).slice(0, 3);

  return (
    <div className="container py-12">
        <Link href="/explore" className="inline-flex items-center gap-2 mb-8 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>
        <FractalDetail 
            fractal={fractal} 
            artist={artist}
            relatedFractals={relatedFractals}
            allArtists={artists}
        />
    </div>
  );
}
