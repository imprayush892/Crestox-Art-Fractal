
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Fractal } from '@/lib/data';
import { useAuth } from '@/context/auth-context';
import { ArrowRight, Loader2, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { reevaluateArtworkForGrading, type ReevaluationResult } from '@/actions/reevaluate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface ReevaluationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fractal: Fractal | null;
}

type EvaluationState = 'idle' | 'evaluating' | 'evaluated' | 'submitting';

export function ReevaluationDialog({ isOpen, onClose, fractal }: ReevaluationDialogProps) {
    const { updateArtworkWithCrestoxValuation, updateArtworkWithNewScorecard } = useAuth();
    const { toast } = useToast();
    const [state, setState] = useState<EvaluationState>('idle');
    const [evaluationResult, setEvaluationResult] = useState<ReevaluationResult | null>(null);

    useEffect(() => {
        if (isOpen && fractal && state === 'idle') {
            const performEvaluation = async () => {
                setState('evaluating');
                try {
                    const result = await reevaluateArtworkForGrading(fractal.id);
                    setEvaluationResult(result);
                    setState('evaluated');
                } catch (error: any) {
                    toast({
                        variant: "destructive",
                        title: "Evaluation Failed",
                        description: error.message || "Could not re-evaluate the artwork.",
                    });
                    onClose(); // Close dialog on failure
                }
            };
            performEvaluation();
        } else if (!isOpen) {
            // Reset state when dialog is closed
            setState('idle');
            setEvaluationResult(null);
        }
    }, [isOpen, fractal, state, toast, onClose]);

    const handlePriceChoice = async (useCrestoxPrice: boolean) => {
        if (!fractal || !evaluationResult) return;
        setState('submitting');
        try {
            if (useCrestoxPrice) {
                await updateArtworkWithCrestoxValuation(fractal.id, evaluationResult);
                 toast({
                    title: "Artwork Re-graded!",
                    description: `"${fractal.title}" has been updated with the Crestox valuation and grade.`,
                });
            } else {
                await updateArtworkWithNewScorecard(fractal.id, evaluationResult);
                toast({
                    title: "Scorecard Updated",
                    description: `The latest evaluation data for "${fractal.title}" has been saved. The price remains unchanged.`,
                });
            }
            onClose();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "There was a problem updating the artwork.",
            });
            setState('evaluated'); // Go back to choice on failure
        }
    };
    
    if (!fractal) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if (!open) onClose()}}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Re-evaluate Artwork</DialogTitle>
                    <DialogDescription>
                        Get a fresh AI evaluation for "{fractal.title}" to receive a grade.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {state === 'evaluating' && (
                        <div className="space-y-4 pt-4 flex flex-col items-center justify-center min-h-[200px]">
                            <p className="text-sm text-muted-foreground text-center animate-pulse">
                                AI evaluation in progress... This may take up to a minute.
                            </p>
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    {state === 'evaluated' && evaluationResult && (
                         <div className="space-y-6">
                            <Alert>
                                <Wand2 className="h-4 w-4" />
                                <AlertTitle>Evaluation Complete!</AlertTitle>
                                <AlertDescription>
                                    Choose a valuation for your artwork. Accepting the Crestox price ensures you receive a grade badge.
                                </AlertDescription>
                            </Alert>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                                <Card className="flex flex-col justify-between">
                                    <CardHeader>
                                        <CardTitle>Your Valuation</CardTitle>
                                        <CardDescription>Your current listed price.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">${fractal.price.toLocaleString()}</p>
                                    </CardContent>
                                    <CardContent>
                                        <Button size="lg" className="w-full" onClick={() => handlePriceChoice(false)} disabled={state === 'submitting'}>
                                            {state === 'submitting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                            Keep My Valuation
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card className="border-primary border-2 flex flex-col justify-between">
                                    <CardHeader>
                                        <CardTitle>Crestox AI Suggestion</CardTitle>
                                        <CardDescription>Our new AI-powered recommendation.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-primary">${evaluationResult.crestoxPriceRange[0].toLocaleString()} - ${evaluationResult.crestoxPriceRange[1].toLocaleString()}</p>
                                    </CardContent>
                                    <CardContent>
                                        <Button size="lg" className="w-full" onClick={() => handlePriceChoice(true)} disabled={state === 'submitting'}>
                                            {state === 'submitting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ArrowRight className="mr-2 h-4 w-4" />}
                                            Accept Crestox Valuation
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
