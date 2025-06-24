
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
  artist: Artist;
  isOpen: boolean;
  onClose: () => void;
}

interface OrderBreakdown {
    price: number;
    quantity: number;
    source: string;
}

export function CollectionDialog({ artist, isOpen, onClose }: InvestmentDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [breakdown, setBreakdown] = useState<OrderBreakdown[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [maxAvailable, setMaxAvailable] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { user, collectFromPortfolio, resaleListings } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && artist) {
      const activeResaleListings = resaleListings.filter(l => l.artistId === artist.id && l.status === 'active');
      const availableFromResale = activeResaleListings.reduce((sum, l) => sum + l.quantity, 0);
      const availableFromArtist = artist.availableEditions;
      const totalAvailable = availableFromResale + availableFromArtist;
      setMaxAvailable(totalAvailable);

      if (quantity > totalAvailable) {
        setQuantity(totalAvailable > 0 ? 1 : 0);
      } else if(quantity === 0 && totalAvailable > 0) {
        setQuantity(1);
      }
    }
  }, [isOpen, artist, resaleListings, quantity]);


  useEffect(() => {
    if (!isOpen || !artist) return;
    
    let orderBook: { price: number; quantity: number; source: string; isResold: boolean }[] = [];

    const activeResaleListings = resaleListings.filter(l => l.artistId === artist.id && l.status === 'active');
    activeResaleListings.forEach(listing => {
        const now = Date.now();
        const startTime = new Date(listing.listingTimestamp).getTime();
        const elapsedSeconds = (now - startTime) / 1000;
        let currentPrice = listing.initialPrice - (listing.initialPrice - listing.minPrice) * (elapsedSeconds / listing.periodSeconds);
        if (elapsedSeconds >= listing.periodSeconds) {
            currentPrice = listing.minPrice;
        }
        orderBook.push({
            price: Math.round(currentPrice * 100) / 100,
            quantity: listing.quantity,
            source: `Reseller`,
            isResold: true
        });
    });

    if (artist.availableEditions > 0) {
        orderBook.push({
            price: artist.fractalPrice,
            quantity: artist.availableEditions,
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

  }, [quantity, artist, isOpen, resaleListings]);


  const handleQuantityChange = (value: number) => {
    if (value >= 0 && value <= maxAvailable) {
      setQuantity(value);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
        await collectFromPortfolio(artist, quantity);
        toast({
          title: 'Collection Successful!',
          description: `You have collected ${quantity} fractal${quantity > 1 ? 's' : ''} of ${artist.name}'s portfolio.`,
        });
        onClose();
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
  
  if (!artist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Collect from {artist.name}</DialogTitle>
          <DialogDescription>
            Acquire fractals from the cheapest available sources.
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
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg text-sm">
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
