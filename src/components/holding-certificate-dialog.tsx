
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
import { Download, Loader2 } from 'lucide-react';
import { HoldingCertificate } from './holding-certificate';
import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface HoldingCertificateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  artist: Artist | null;
  ownedFractals: OwnedFractal[];
  allArtistFractals: Fractal[];
}

export function HoldingCertificateDialog({ isOpen, onClose, artist, ownedFractals, allArtistFractals }: HoldingCertificateDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!artist) return null;

  const handleDownload = async () => {
    const input = document.getElementById('certificate-content');
    if (!input) return;

    setIsDownloading(true);

    try {
      const canvas = await html2canvas(input, {
        scale: 2, // Higher scale for better quality
        backgroundColor: '#FDFCF6', // Match certificate background
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      // Maintain aspect ratio
      const ratio = canvasWidth / canvasHeight;
      let newWidth = pdfWidth;
      let newHeight = newWidth / ratio;

      if (newHeight > pdfHeight) {
        newHeight = pdfHeight;
        newWidth = newHeight * ratio;
      }
      
      const xOffset = (pdfWidth - newWidth) / 2;
      const yOffset = (pdfHeight - newHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, newWidth, newHeight);
      pdf.save(`Crestox-Certificate-${artist.name.replace(/\s/g, '_')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };


  return (
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
                <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download PDF
                </Button>
                <Button onClick={onClose}>Close</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
