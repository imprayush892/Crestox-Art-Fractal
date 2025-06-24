
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
import { Minus, Plus, Wallet } from 'lucide-react';
import { Separator } from './ui/separator';

interface CollectionDialogProps {
  artist: Artist;
  isOpen: boolean;
  onClose: () => void;
}

export function CollectionDialog({ artist, isOpen, onClose }: CollectionDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const { user, collectFromPortfolio } = useAuth();
  const { toast } = useToast();

  const totalCost = useMemo(() => quantity * artist.fractalPrice, [quantity, artist.fractalPrice]);

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

  const handleConfirm = async () => {
    try {
        await collectFromPortfolio(artist, quantity);
        toast({
          title: 'Collection Successful!',
          description: `You have collected ${quantity} fractal${quantity > 1 ? 's' : ''} of ${artist.name}'s portfolio.`,
        });
        onClose();
    } catch (error) {
        // Error toast is handled in the context
        console.error("Collection failed:", error);
    }
  };
  
  if (!artist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Collect from {artist.name}</DialogTitle>
          <DialogDescription>
            Acquire fractals from this artist's portfolio using your Cred Coins.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            {user && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Wallet className="w-4 h-4" />
                        <span>Your Balance</span>
                    </div>
                    <span className="font-semibold">{user.walletBalance.toLocaleString('en-IN')} Cred Coins</span>
                </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Price / Fractal</span>
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
                <div className="flex items-center justify-between text-lg font-bold text-primary">
                    <span>Total Cost</span>
                    <span>₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                 <p className="text-xs text-muted-foreground text-right">Payable in Cred Coins</p>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
                Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={!user || user.walletBalance < totalCost}>
            Confirm Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
