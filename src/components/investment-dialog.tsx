'use client';

import React, { useState, useMemo } from 'react';
import type { Artist } from '@/lib/data';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Minus, Plus } from 'lucide-react';

interface InvestmentDialogProps {
  artist: Artist;
  isOpen: boolean;
  onClose: () => void;
}

export function InvestmentDialog({ artist, isOpen, onClose }: InvestmentDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const { investInPortfolio } = useAuth();
  const { toast } = useToast();

  const totalCost = useMemo(() => quantity * artist.fractalPrice, [quantity, artist.fractalPrice]);

  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= artist.availableEditions) {
      setQuantity(value);
    }
  };

  const handleConfirm = () => {
    investInPortfolio(artist, quantity);
    toast({
      title: 'Investment Successful!',
      description: `You have purchased ${quantity} fractal${quantity > 1 ? 's' : ''} of ${artist.name}'s portfolio.`,
    });
    onClose();
  };
  
  if (!artist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Invest in {artist.name}</DialogTitle>
          <DialogDescription>
            Select how many fractals of this artist's portfolio you'd like to acquire.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <span className="text-muted-foreground">Price per Fractal</span>
                <span className="text-xl font-bold">${artist.fractalPrice.toLocaleString()}</span>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="quantity" className="text-left">
                Quantity
                </Label>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                        className="col-span-3 text-center h-10"
                        min="1"
                        max={artist.availableEditions}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= artist.availableEditions}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                 <p className="text-xs text-muted-foreground text-right">{artist.availableEditions.toLocaleString()} available</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 text-primary-foreground">
                <span className="text-lg font-semibold text-primary">Total Cost</span>
                <span className="text-2xl font-bold text-primary">${totalCost.toLocaleString()}</span>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
                Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm}>
            Confirm Investment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
