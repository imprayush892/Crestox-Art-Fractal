
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { Fractal, Artist } from '@/lib/data';

interface FractalCardProps {
  fractal: Fractal;
  artist: Artist;
}

export function FractalCard({ fractal, artist }: FractalCardProps) {
  return (
    <Link href={`/fractal/${fractal.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
        <CardContent className="p-0">
           <div className="relative overflow-hidden">
            <Image
              src={fractal.image}
              alt={fractal.title}
              width={fractal.width}
              height={fractal.height}
              className="object-cover w-full h-auto transition-transform duration-300 ease-in-out group-hover:scale-105"
              data-ai-hint={fractal.aiHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                <h3 className="font-headline text-lg font-bold truncate">{fractal.title}</h3>
                <p className="text-sm text-white/90">by {artist.name}</p>
                <p className="mt-2 font-semibold text-lg">₹{fractal.price.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
