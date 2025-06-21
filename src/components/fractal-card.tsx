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
          <div className="aspect-square overflow-hidden">
            <Image
              src={fractal.image}
              alt={fractal.title}
              width={600}
              height={600}
              className="object-cover w-full h-full transition-transform duration-300 ease-in-out group-hover:scale-105"
              data-ai-hint={fractal.aiHint}
            />
          </div>
          <div className="p-4">
            <h3 className="font-headline text-lg font-bold truncate">{fractal.title}</h3>
            <p className="text-sm text-muted-foreground">by {artist.name}</p>
            <p className="mt-2 font-semibold text-lg text-foreground">${fractal.price.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
