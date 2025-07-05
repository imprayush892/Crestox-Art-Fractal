'use client';

import { Lightbox } from './lightbox';
import { Button } from '@/components/ui/button';
import { SafeImage as Image } from '@/components/ui/safe-image';
import Link from 'next/link';
import type { Fractal } from '@/lib/data';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fractal?: Fractal;
}

export function ExitIntentModal({ isOpen, onClose, fractal }: ExitIntentModalProps) {
  return (
    <Lightbox isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center gap-4 text-white">
        {fractal ? (
          <Image
            src={fractal.heroImage}
            alt={fractal.title}
            width={fractal.width}
            height={fractal.height}
            className="object-contain w-auto h-auto max-w-full max-h-[75vh] rounded-lg shadow-2xl"
            data-ai-hint={fractal.aiHint}
          />
        ) : (
           <Image
            src={"https://placehold.co/800x600.png"}
            alt="Featured Artwork"
            width={800}
            height={600}
            className="object-contain w-auto h-auto max-w-full max-h-[75vh] rounded-lg shadow-2xl"
            data-ai-hint="luxury art gallery"
          />
        )}
        
        <div className="text-center">
          <h2 className="font-headline text-2xl font-bold">Love what you see?</h2>
          <p className="mt-2 text-lg text-white/80">Support an artist today.</p>
        </div>

        <Button asChild size="lg" onClick={onClose}>
          <Link href={fractal ? `/fractal/${fractal.id}` : "/explore"}>
            View Artwork
          </Link>
        </Button>
      </div>
    </Lightbox>
  );
}
