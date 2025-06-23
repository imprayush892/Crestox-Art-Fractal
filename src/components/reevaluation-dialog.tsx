
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { Fractal } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { toast } from './ui/use-toast';

interface ReevaluationDialogProps {
  fractal: Fractal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReevaluationDialog({ fractal, isOpen, onClose }: ReevaluationDialogProps) {
  const { reevaluateArtworkForGrading } = useAuth();
  const [isReevaluating, setIsReevaluating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
        setIsReevaluating(false);
    }
  },[isOpen])

  if (!fractal) return null;

  const handleConfirm = async () => {
    setIsReevaluating(true);
    try {
        if(reevaluateArtworkForGrading) {
            await reevaluateArtworkForGrading(fractal);
            toast({
                title: "Artwork Re-evaluated",
                description: `"${fractal.title}" has been updated with the latest AI evaluation.`,
            });
            onClose();
            router.refresh();
        } else {
            throw new Error("Re-evaluation function not available.");
        }
    } catch(e) {
        toast({
            variant: "destructive",
            title: "Re-evaluation Failed",
            description: (e as Error).message || 'An unknown error occurred.',
        })
    } finally {
        setIsReevaluating(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Re-evaluate and Get Graded</DialogTitle>
          <DialogDescription>
            This will update the artwork's price to the Crestox AI-assisted valuation and apply the grade. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <p>
                Are you sure you want to re-evaluate "{fractal.title}"? Your artwork's price will be updated to the current AI-assisted valuation.
            </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={isReevaluating}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isReevaluating}>
            {isReevaluating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Re-evaluate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
