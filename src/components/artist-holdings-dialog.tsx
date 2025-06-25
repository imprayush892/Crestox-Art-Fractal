
'use client';

import type { Artist } from '@/lib/data';
import type { OwnedFractal } from '@/context/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface ArtistHoldingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  artist: Artist | null;
  ownedFractals: OwnedFractal[];
}

export function ArtistHoldingsDialog({ isOpen, onClose, artist, ownedFractals }: ArtistHoldingsDialogProps) {
  if (!artist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Your Holdings: {artist.name}</DialogTitle>
          <DialogDescription>
            A detailed breakdown of the fractals you own from this artist's portfolio.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Serial Number</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead className="text-right">Purchase Price</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Gain / Loss (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownedFractals.map((fractal) => {
                const currentValue = artist.fractalPrice;
                const gainLoss = currentValue - fractal.purchasePrice;
                const percentageChange = fractal.purchasePrice > 0 ? (gainLoss / fractal.purchasePrice) * 100 : 0;
                
                return (
                  <TableRow key={fractal.id}>
                    <TableCell className="font-mono text-xs">{fractal.serialNumber}</TableCell>
                    <TableCell>{format(new Date(fractal.purchaseDate), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">₹{fractal.purchasePrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">₹{currentValue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                       <div className={`flex items-center justify-end gap-1 font-medium ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                         {gainLoss > 0 && <ArrowUp className="h-3 w-3"/>}
                         {gainLoss < 0 && <ArrowDown className="h-3 w-3"/>}
                         <span>{percentageChange.toFixed(2)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
