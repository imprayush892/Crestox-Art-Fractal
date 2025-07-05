'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import type { Fractal } from '@/lib/data';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fractal?: Fractal;
}

export function ExitIntentModal({ isOpen, onClose, fractal }: ExitIntentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-0 max-h-[90vh]">
        <div className="relative flex items-center justify-center text-center text-white p-6 h-full">
          {fractal ? (
            <Image
              src={fractal.heroImage}
              alt={fractal.title}
              width={fractal.width}
              height={fractal.height}
              className="object-contain brightness-50 w-full h-full"
              data-ai-hint={fractal.aiHint}
            />
          ) : (
             <Image
              src={"https://placehold.co/800x600.png"}
              alt="Featured Artwork"
              width={800}
              height={600}
              className="object-contain brightness-50 w-full h-full"
              data-ai-hint="luxury art gallery"
            />
          )}
          
          <div className="relative z-10">
            <h2 className="font-headline text-3xl font-bold">Love what you see?</h2>
            <p className="mt-2 text-lg text-white/90">Support an artist today.</p>
            <Button asChild size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90" onClick={onClose}>
              <Link href={fractal ? `/fractal/${fractal.id}` : "/explore"}>
                {fractal ? 'View Artwork' : 'Explore Art'}
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
