
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import type { Artist, Fractal, OwnedFractal } from '@/lib/data';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { HoldingCertificate } from './holding-certificate';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

interface HoldingCertificateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  artist: Artist | null;
  ownedFractals: OwnedFractal[];
  allArtistFractals: Fractal[];
}

export function HoldingCertificateDialog({ isOpen, onClose, artist, ownedFractals, allArtistFractals }: HoldingCertificateDialogProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handlePrint = () => {
    window.print();
  };

  if (!artist) return null;

  return (
    <>
        {isClient && isOpen && createPortal(
            <div className="print-only">
                <HoldingCertificate
                    artist={artist}
                    ownedFractals={ownedFractals}
                    allArtistFractals={allArtistFractals}
                />
            </div>,
            document.body
        )}
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Certificate of Holding: {artist.name}</DialogTitle>
                    <DialogDescription>
                    Your official certificate for the fractals you hold from this artist.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="max-h-[75vh] overflow-y-auto p-2">
                    <HoldingCertificate
                        artist={artist}
                        ownedFractals={ownedFractals}
                        allArtistFractals={allArtistFractals}
                    />
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={handlePrint}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
