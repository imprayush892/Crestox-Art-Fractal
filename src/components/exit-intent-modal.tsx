'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
}

export function ExitIntentModal({ isOpen, onClose, imageUrl }: ExitIntentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0">
        <div className="relative aspect-video flex items-center justify-center text-center text-white p-6">
          <Image
            src={imageUrl || "https://placehold.co/600x400.png"}
            alt="Featured Artwork"
            fill
            className="object-cover brightness-50"
            data-ai-hint="luxury art gallery"
          />
          <div className="relative z-10">
            <h2 className="font-headline text-3xl font-bold">Love what you see?</h2>
            <p className="mt-2 text-lg text-white/90">Support an artist today.</p>
            <Button asChild size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90" onClick={onClose}>
              <Link href="/explore">Explore Art</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
