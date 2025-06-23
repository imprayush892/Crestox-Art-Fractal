
'use client';

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
import { useToast } from '@/hooks/use-toast';
import type { Fractal } from '@/lib/data';
import { useAuth } from '@/context/auth-context';
import { ArrowDown, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ReevaluationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fractal: Fractal | null;
}

export function ReevaluationDialog({ isOpen, onClose, fractal }: ReevaluationDialogProps) {
    const { acceptCrestoxValuation } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!fractal || !fractal.crestoxPriceRange) return null;

    const newPrice = Math.round((fractal.crestoxPriceRange[0] + fractal.crestoxPriceRange[1]) / 2);
    
    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await acceptCrestoxValuation(fractal.id);
            toast({
                title: "Valuation Updated!",
                description: `"${fractal.title}" is now priced at $${newPrice.toLocaleString()} and has received its AI Grade.`,
            });
            onClose();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "There was a problem updating the artwork.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Accept AI Valuation</DialogTitle>
                    <DialogDescription>
                        Update the artwork's valuation for "{fractal.title}" to receive your AI Grade.
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4 space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-muted-foreground">Current Valuation</span>
                        <span className="font-semibold">${fractal.price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-center">
                        <ArrowDown className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border-2 border-primary">
                        <span className="text-primary font-medium">New Crestox Valuation</span>
                        <span className="font-bold text-primary text-lg">${newPrice.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Accepting the Crestox Valuation will update the artwork's public price and your total portfolio value. This action cannot be undone.
                    </p>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost" disabled={isSubmitting}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleConfirm} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm and Get Badge
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
