
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
import { Minus, Plus, Wallet, Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';

interface InvestmentDialogProps {
  artist: Artist | null;
  isOpen: boolean;
  onClose: () => void;
}

interface OrderBreakdown {
    price: number;
    quantity: number;
    source: string;
}

export function InvestmentDialog({ artist, isOpen, onClose }: InvestmentDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [breakdown, setBreakdown] = useState<OrderBreakdown[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [maxAvailable, setMaxAvailable] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { user, collectFromPortfolio, resaleListings, artists } = useAuth();
  const { toast } = useToast();

  const currentArtist = useMemo(() => {
    if (!artist) return null;
    return artists.find(a => a.id === artist.id) || null;
  }, [artists, artist]);

  useEffect(() => {
    if (isOpen && currentArtist) {
      const activeResaleListings = resaleListings.filter(l => l.artistId === currentArtist.id && l.status === 'active');
      const availableFromResale = activeResaleListings.reduce((sum, l) => sum + l.quantity, 0);
      const availableFromArtist = currentArtist.availableEditions;
      const totalAvailable = availableFromResale + availableFromArtist;
      setMaxAvailable(totalAvailable);

      if (quantity > totalAvailable) {
        setQuantity(totalAvailable > 0 ? 1 : 0);
      } else if(quantity === 0 && totalAvailable > 0) {
        setQuantity(1);
      }
    }
  }, [isOpen, currentArtist, resaleListings, quantity]);


  useEffect(() => {
    if (!isOpen || !currentArtist) return;
    
    let orderBook: { price: number; quantity: number; source: string; isResold: boolean }[] = [];

    const activeResaleListings = resaleListings.filter(l => l.artistId === currentArtist.id && l.status === 'active');
    activeResaleListings.forEach(listing => {
        const t = (Date.now() - new Date(listing.listingTimestamp).getTime()) / 1000;
        const price = Math.max(listing.minPrice, listing.initialPrice - ((listing.initialPrice - listing.minPrice) * t / listing.periodSeconds));
        orderBook.push({
            price: Math.round(price * 100) / 100,
            quantity: listing.quantity,
            source: `Reseller`,
            isResold: true
        });
    });

    if (currentArtist.availableEditions > 0) {
        orderBook.push({
            price: currentArtist.fractalPrice,
            quantity: currentArtist.availableEditions,
            source: 'Artist Portfolio',
            isResold: false
        });
    }

    orderBook.sort((a, b) => {
        if (a.price !== b.price) return a.price - b.price;
        return a.isResold ? -1 : 1;
    });

    let remainingQty = quantity;
    let cost = 0;
    const newBreakdown: OrderBreakdown[] = [];

    for (const order of orderBook) {
        if (remainingQty <= 0) break;
        const qtyToTake = Math.min(remainingQty, order.quantity);
        
        cost += qtyToTake * order.price;
        newBreakdown.push({
            price: order.price,
            quantity: qtyToTake,
            source: order.source
        });

        remainingQty -= qtyToTake;
    }
    
    setTotalCost(cost);
    setBreakdown(newBreakdown);

  }, [quantity, currentArtist, isOpen, resaleListings]);


  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(0, Math.min(value, maxAvailable));
    setQuantity(newQuantity);
  };

  const handleConfirm = async () => {
    if (!currentArtist) return;
    setIsLoading(true);
    try {
        await collectFromPortfolio(currentArtist, quantity);
        onClose();
        setQuantity(1); // Reset for next time
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Collection Failed",
            description: error.message || "An unknown error occurred.",
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  if (!currentArtist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Collect from {currentArtist.name}</DialogTitle>
          <DialogDescription>
            Acquire fractals from the cheapest available sources. Prices are in CreCoins.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            {user && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Wallet className="w-4 h-4" />
                        <span>Your Balance</span>
                    </div>
                    <span className="font-semibold">{user.walletBalance.toLocaleString('en-IN')} CreCoins</span>
                </div>
            )}
            
            <div className="grid gap-2">
                <Label htmlFor="quantity" className="text-left">
                Quantity
                </Label>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 0}> <Minus className="h-4 w-4" /> </Button>
                    <Input id="quantity" type="number" value={quantity} onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)} className="col-span-3 text-center h-10" min="0" max={maxAvailable} />
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange(quantity + 1)} disabled={quantity >= maxAvailable}> <Plus className="h-4 w-4" /> </Button>
                </div>
                 <p className="text-xs text-muted-foreground text-right">{maxAvailable.toLocaleString('en-IN')} available</p>
            </div>
            
            <Separator />
            
            <div className='space-y-2'>
                <h4 className="font-medium text-sm">Order Breakdown</h4>
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg text-sm min-h-[60px]">
                    {breakdown.length > 0 ? breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between">
                            <span className="text-muted-foreground">{item.quantity} x @ {item.price.toFixed(2)} CreCoins</span>
                            <span>from {item.source}</span>
                        </div>
                    )) : (
                        <p className="text-xs text-muted-foreground">Enter a quantity to see the breakdown.</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between text-lg font-bold text-primary">
                    <span>Total Cost</span>
                    <span>{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CreCoins</span>
                </div>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isLoading}> Cancel </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={!user || user.walletBalance < totalCost || quantity === 0 || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Confirm Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
