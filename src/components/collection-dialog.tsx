
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { Separator } from './ui/separator';

interface CollectionDialogProps {
  artist: Artist;
  isOpen: boolean;
  onClose: () => void;
}

export function CollectionDialog({ artist, isOpen, onClose }: CollectionDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const { collectFromPortfolio } = useAuth();
  const { toast } = useToast();

  const subtotal = useMemo(() => quantity * artist.fractalPrice, [quantity, artist.fractalPrice]);
  const taxAmount = useMemo(() => subtotal * 0.18, [subtotal]);
  const totalCost = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= artist.availableEditions) {
      setQuantity(value);
    }
  };

  const handleConfirm = () => {
    collectFromPortfolio(artist, quantity);
    toast({
      title: 'Collection Successful!',
      description: `You have purchased ${quantity} fractal${quantity > 1 ? 's' : ''} of ${artist.name}'s portfolio.`,
    });
    onClose();
  };
  
  if (!artist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Collect from {artist.name}</DialogTitle>
          <DialogDescription>
            Select how many fractals of this artist's portfolio you'd like to acquire.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Current Price / Fractal</span>
                <span className="font-bold">₹{artist.fractalPrice.toLocaleString('en-IN')}</span>
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
                 <p className="text-xs text-muted-foreground text-right">{artist.availableEditions.toLocaleString('en-IN')} available</p>
            </div>
            
            <Separator />

            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">G.S.T. (18%)</span>
                    <span className="font-medium">₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <Separator className="my-2"/>
                <div className="flex items-center justify-between text-lg font-bold text-primary">
                    <span>Total Payable</span>
                    <span>₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
                Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm}>
            Confirm Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
