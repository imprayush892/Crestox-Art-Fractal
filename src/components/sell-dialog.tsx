
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Artist } from '@/lib/data';
import { useAuth } from '@/context/auth-context';
import type { OwnedFractal } from '@/context/auth-context';
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
import { Minus, Plus, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';

interface SellDialogProps {
  artist: Artist | null;
  ownedFractals: OwnedFractal[];
  isOpen: boolean;
  onClose: () => void;
}

export function SellDialog({ artist, ownedFractals, isOpen, onClose }: SellDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [initialPrice, setInitialPrice] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [periodDays, setPeriodDays] = useState<string>('7');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { listForResale } = useAuth();
  const { toast } = useToast();

  const ownedShares = useMemo(() => ownedFractals.length, [ownedFractals]);
  
  const initialSaleValue = useMemo(() => quantity * (Number(initialPrice) || 0), [quantity, initialPrice]);
  const netProceeds = useMemo(() => initialSaleValue, [initialSaleValue]);

  useEffect(() => {
    if (artist) {
      setInitialPrice(String(artist.fractalPrice));
      setMinPrice(String(Math.round(artist.fractalPrice * 0.8)));
    }
     if (isOpen) {
      setQuantity(1);
      setIsSubmitting(false);
    }
  }, [artist, isOpen]);

  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= ownedShares) {
        setQuantity(value);
    }
  };
  
  const handleConfirm = async () => {
    if (!artist || !initialPrice || !minPrice || !periodDays) return;
    setIsSubmitting(true);
    
    try {
      await listForResale(artist, {
        quantity,
        initialPrice: Number(initialPrice),
        minPrice: Number(minPrice),
        periodDays: Number(periodDays)
      });
      onClose();
    } catch(e: any) {
        toast({
            variant: "destructive",
            title: "Listing Failed",
            description: e.message || "Could not list fractals for sale.",
        });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!artist) return null;

  const isFormInvalid = isSubmitting || !initialPrice || !minPrice || !periodDays || Number(initialPrice) <= Number(minPrice) || Number(initialPrice) <= 0 || Number(minPrice) < 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">List Fractals for Resale: {artist.name}</DialogTitle>
          <DialogDescription>
            Set your pricing in CreCoins to list your fractals on the secondary market.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            
            <div className="grid gap-2">
                <Label htmlFor="quantity" className="text-left">
                Quantity to List
                </Label>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1}>
                        <Minus className="h-4 w-4" />
                    </Button>
                    <Input id="quantity" type="number" value={quantity} onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)} className="col-span-3 text-center h-10" min="1" max={ownedShares} />
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange(quantity + 1)} disabled={quantity >= ownedShares}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                 <p className="text-xs text-muted-foreground text-right">You own {ownedShares.toLocaleString()} available fractals</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="initial-price">Initial Price (per fractal)</Label>
                    <Input id="initial-price" type="number" placeholder="e.g. 120" value={initialPrice} onChange={(e) => setInitialPrice(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="min-price">Minimum Price (per fractal)</Label>
                    <Input id="min-price" type="number" placeholder="e.g. 80" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="period">Selling Period</Label>
                <Select value={periodDays} onValueChange={setPeriodDays}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             
             <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
                Your fractals will be listed at the <span className="font-bold">Initial Price</span>, and the price will gradually decrease over the <span className="font-bold">Selling Period</span> until it reaches the <span className="font-bold">Minimum Price</span>.
             </div>

             <Separator />

             <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Est. Gross Sale (at initial price)</span>
                    <span className="font-medium">{initialSaleValue.toLocaleString('default', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CreCoins</span>
                </div>
                <Separator className="my-2"/>
                <div className="flex items-center justify-between text-base font-bold">
                    <span>Est. Net Proceeds</span>
                    <span>{netProceeds.toLocaleString('default', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CreCoins</span>
                </div>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={isFormInvalid}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Confirm Listing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
