'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import type { Artist, Fractal } from '@/lib/data';
import type { OwnedFractal } from '@/context/auth-context';
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
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      // Calculate the image height in the PDF while maintaining aspect ratio
      const ratio = canvasWidth / canvasHeight;
      const imgHeightInPdf = pdfWidth / ratio;

      let heightLeft = imgHeightInPdf;
      let position = 0;

      // Add the first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
      heightLeft -= pdfHeight;

      // Add more pages if content is taller than one page
      while (heightLeft > 0) {
        position -= pdfHeight; // Move the "view" of the image up
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;
      }
      
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
