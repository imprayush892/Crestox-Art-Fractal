
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Artist } from '@/lib/data';
import { useAuth, type OwnedFractal } from '@/context/auth-context';
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
  
  const { listForResale } = useAuth();
  const { toast } = useToast();

  const ownedShares = useMemo(() => ownedFractals.filter(f => f.status !== 'listed').length, [ownedFractals]);
  
  const initialSaleValue = useMemo(() => quantity * (Number(initialPrice) || 0), [quantity, initialPrice]);
  const transactionFee = useMemo(() => initialSaleValue * 0.02, [initialSaleValue]);
  const netProceeds = useMemo(() => initialSaleValue - transactionFee, [initialSaleValue, transactionFee]);

  useEffect(() => {
    if (artist) {
      setInitialPrice(String(artist.fractalPrice));
      setMinPrice(String(Math.round(artist.fractalPrice * 0.8)));
    }
  }, [artist, isOpen]);

  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= ownedShares) {
        setQuantity(value);
    }
  };
  
  const handleConfirm = async () => {
    if (!artist || !initialPrice || !minPrice || !periodDays) return;
    
    try {
      await listForResale(artist, {
        quantity,
        initialPrice: Number(initialPrice),
        minPrice: Number(minPrice),
        periodDays: Number(periodDays)
      });
      toast({
        title: 'Listing Successful!',
        description: `You have listed ${quantity} fractal${quantity > 1 ? 's' : ''} of ${artist.name}'s portfolio for sale.`,
      });
      onClose();
    } catch(e: any) {
        toast({
            variant: "destructive",
            title: "Listing Failed",
            description: e.message || "Could not list fractals for sale.",
        });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);
  
  if (!artist) return null;

  const isFormInvalid = !initialPrice || !minPrice || !periodDays || Number(initialPrice) <= Number(minPrice) || Number(initialPrice) <= 0 || Number(minPrice) < 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">List Fractals for Resale: {artist.name}</DialogTitle>
          <DialogDescription>
            Set your pricing and terms to list your fractals on the secondary market.
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
                 <p className="text-xs text-muted-foreground text-right">You own {ownedShares.toLocaleString('en-IN')} available fractals</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="initial-price">Initial Price (Q)</Label>
                    <Input id="initial-price" type="number" placeholder="e.g. 120" value={initialPrice} onChange={(e) => setInitialPrice(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="min-price">Minimum Price (S)</Label>
                    <Input id="min-price" type="number" placeholder="e.g. 80" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="period">Selling Period (T)</Label>
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
                    <span className="font-medium">₹{initialSaleValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Transaction Fee (2%)</span>
                    <span className="font-medium text-red-500">-₹{transactionFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <Separator className="my-2"/>
                <div className="flex items-center justify-between text-base font-bold">
                    <span>Est. Net Proceeds</span>
                    <span>₹{netProceeds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={isFormInvalid}>
            Confirm Listing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
