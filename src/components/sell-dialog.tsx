'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Artist } from '@/lib/data';
import type { OwnedFractal } from '@/context/auth-context';
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
import { Checkbox } from './ui/checkbox';

interface SellDialogProps {
  artist: Artist | null;
  ownedFractals: OwnedFractal[];
  isOpen: boolean;
  onClose: () => void;
}

export function SellDialog({ artist, ownedFractals, isOpen, onClose }: SellDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [useDefaultPrice, setUseDefaultPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState<number | string>('');

  const { sellFromPortfolio } = useAuth();
  const { toast } = useToast();

  const ownedShares = ownedFractals.length;

  useEffect(() => {
    if (artist && !useDefaultPrice) {
      setCustomPrice(artist.fractalPrice);
    } else {
      setCustomPrice('');
    }
  }, [useDefaultPrice, artist]);

  const effectivePrice = useMemo(() => {
      if (!artist) return 0;
      if (useDefaultPrice) {
          return artist.fractalPrice;
      }
      return Number(customPrice) || 0;
  }, [useDefaultPrice, customPrice, artist]);


  const { totalCost, gainLoss } = useMemo(() => {
    if (!artist || ownedShares === 0) {
      return { totalCost: 0, gainLoss: 0 };
    }
    const totalPurchaseValue = ownedFractals.reduce((sum, f) => sum + f.purchasePrice, 0);
    const avgPrice = totalPurchaseValue / ownedShares;
    const totalSellingPrice = quantity * effectivePrice;
    const totalCostOfSoldShares = quantity * avgPrice;
    const gl = totalSellingPrice - totalCostOfSoldShares;

    return {
      totalCost: totalSellingPrice,
      gainLoss: gl
    };
  }, [quantity, artist, ownedFractals, ownedShares, effectivePrice]);


  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= ownedShares) {
        setQuantity(value);
    }
  };
  
  const handleConfirm = () => {
    if (!artist) return;
    
    const priceForSale = useDefaultPrice ? undefined : effectivePrice;
    
    sellFromPortfolio(artist, quantity, priceForSale);

    toast({
      title: 'Sale Successful!',
      description: `You have sold ${quantity} fractal${quantity > 1 ? 's' : ''} of ${artist.name}'s portfolio.`,
    });
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setUseDefaultPrice(true);
      setCustomPrice('');
    }
  }, [isOpen]);
  
  if (!artist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            onClose();
        }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Sell Fractals: {artist.name}</DialogTitle>
          <DialogDescription>
            Select how many fractals you'd like to sell from this portfolio.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <span className="text-muted-foreground">Current Price per Fractal</span>
                <span className="text-xl font-bold">${artist.fractalPrice.toLocaleString()}</span>
            </div>

            <div className="p-4 rounded-lg border space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="custom-price" className="text-left">
                    Custom Selling Price
                  </Label>
                  <Input
                      id="custom-price"
                      type="number"
                      placeholder="Enter custom price"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      disabled={useDefaultPrice}
                      className="col-span-3 text-left h-10"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-default-price"
                    checked={useDefaultPrice}
                    onCheckedChange={(checked) => setUseDefaultPrice(Boolean(checked))}
                  />
                  <label
                    htmlFor="use-default-price"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Use default platform price
                  </label>
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="quantity" className="text-left">
                Quantity to Sell
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
                        max={ownedShares}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= ownedShares}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                 <p className="text-xs text-muted-foreground text-right">You own {ownedShares.toLocaleString()}</p>
            </div>
            
             <div className="space-y-2">
                 <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
                    <span className="text-lg font-semibold text-primary">Total Sale Value</span>
                    <span className="text-2xl font-bold text-primary">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                 <div className={`flex items-center justify-between p-3 rounded-lg ${gainLoss >= 0 ? 'bg-green-600/10' : 'bg-red-600/10'}`}>
                    <span className={`text-sm font-semibold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>Est. Gain / Loss</span>
                    <span className={`text-sm font-bold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>${gainLoss.toLocaleString(undefined, { signDisplay: 'always', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
             </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
                Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={!useDefaultPrice && (!customPrice || Number(customPrice) <= 0)}>
            Confirm Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
