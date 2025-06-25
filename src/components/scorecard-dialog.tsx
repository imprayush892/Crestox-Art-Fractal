
'use client';

import type { Fractal } from '@/lib/data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ScorecardContent = ({ fractal }: { fractal: Fractal | null }) => {
  if (!fractal) return null;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  }

  return (
    <div id="scorecard-content" className="bg-background p-4">
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl">Crestox Evaluation Scorecard</DialogTitle>
        <DialogDescription>
          Detailed analysis for "{fractal.title}".
        </DialogDescription>
      </DialogHeader>
      
      <div className="flex items-center justify-between my-4 bg-muted/50 p-4 rounded-lg">
          <div className="text-center">
              <p className="text-sm text-muted-foreground">Final Score</p>
              <p className="text-3xl font-bold">{fractal.aiScore}</p>
          </div>
          <div className="text-center">
              <p className="text-sm text-muted-foreground">Crestox Grade</p>
              <Badge variant="secondary" className="text-2xl mt-1 px-4 py-1">{fractal.crestoxGrade || 'N/A'}</Badge>
          </div>
      </div>

      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Criterion</TableHead>
              <TableHead className="text-center">Weight</TableHead>
              <TableHead className="text-center">Score (0-10)</TableHead>
              <TableHead className="text-right">Weighted Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fractal.aiScorecard?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-xs">{item.criterion}</TableCell>
                <TableCell className="text-center">{item.weight}%</TableCell>
                <TableCell className={`text-center font-bold text-lg ${getScoreColor(item.score)}`}>{item.score}</TableCell>
                <TableCell className="text-right font-medium">{item.weightedScore.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}


interface ScorecardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fractal: Fractal | null;
}

export function ScorecardDialog({ isOpen, onClose, fractal }: ScorecardDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  
  if (!fractal) return null;

  const handleDownload = async () => {
    const input = document.getElementById('scorecard-content');
    if (!input) return;

    setIsDownloading(true);

    try {
        const canvas = await html2canvas(input, {
            scale: 2,
            backgroundColor: '#FDFCF6',
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfPageHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        const ratio = imgWidth / imgHeight;
        const pdfImageHeight = pdfWidth / ratio;

        let heightLeft = pdfImageHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImageHeight);
        heightLeft -= pdfPageHeight;

        while (heightLeft > 0) {
            position -= pdfPageHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImageHeight);
            heightLeft -= pdfPageHeight;
        }

        pdf.save(`Crestox-Scorecard-${fractal.title.replace(/\s/g, '_')}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
            <div className="max-h-[80vh] overflow-y-auto">
              <ScorecardContent fractal={fractal} />
            </div>
            <DialogFooter className="mt-6">
                <Button onClick={handleDownload} variant="outline" disabled={isDownloading}>
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download as PDF
                </Button>
                <Button onClick={onClose}>Close</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
