
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
import { Loader2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ReevaluationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fractal: Fractal | null;
}

export function ReevaluationDialog({ isOpen, onClose, fractal }: ReevaluationDialogProps) {
    const { acceptCrestoxValuation } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!fractal) return null;
    
    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await acceptCrestoxValuation(fractal.id);
            toast({
                title: "Valuation Updated!",
                description: `"${fractal.title}" has been re-evaluated and has received its AI Grade.`,
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
                    <DialogTitle className="font-headline text-2xl">Get AI Grade</DialogTitle>
                    <DialogDescription>
                        To receive an AI Grade, your artwork's price must be set by the Crestox valuation model.
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4 space-y-4">
                     <Alert>
                        <Wand2 className="h-4 w-4" />
                        <AlertTitle>How it Works</AlertTitle>
                        <AlertDescription>
                            We will perform a fresh, real-time evaluation of your artwork. The resulting price will replace its current valuation, and an AI Grade badge will be applied. This action cannot be undone.
                        </AlertDescription>
                    </Alert>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-muted-foreground">Current Valuation</span>
                        <span className="font-semibold">${fractal.price.toLocaleString()}</span>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost" disabled={isSubmitting}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleConfirm} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Re-evaluate and Get Badge
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
