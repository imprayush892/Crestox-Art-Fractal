
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
import { Download } from 'lucide-react';
import { Separator } from './ui/separator';

interface ScorecardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fractal: Fractal | null;
}

export function ScorecardDialog({ isOpen, onClose, fractal }: ScorecardDialogProps) {
  if (!fractal) return null;

  const handlePrint = () => {
    window.print();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <div className="printable-area">
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

          <div className="mt-4 max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
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

        <DialogFooter className="mt-6 no-print">
            <Button onClick={handlePrint} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download as PDF
            </Button>
            <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
