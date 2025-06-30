
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { z } from 'zod';
import type { SuccessfulEvaluationSchema } from '@/ai/flows/evaluate-artwork-flow';
import { Button } from './ui/button';

type SuccessfulEvaluation = z.infer<typeof SuccessfulEvaluationSchema>['evaluation'];

const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
};

interface EvaluationScorecardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: SuccessfulEvaluation | null;
  onOptForManualReview: () => void;
}

export function EvaluationScorecardDialog({ isOpen, onClose, evaluation, onOptForManualReview }: EvaluationScorecardDialogProps) {
    if (!evaluation) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Evaluation Scorecard</DialogTitle>
                    <DialogDescription>This scorecard details the AI's quality assessment, which is a key factor in determining the final monetary valuation.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto pr-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Criterion</TableHead>
                                <TableHead className="text-center">Weight</TableHead>
                                <TableHead className="text-center">Score (0-10)</TableHead>
                                <TableHead className="text-right">Weighted Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {evaluation.breakdown?.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium text-xs">{item.criterion}</TableCell>
                                    <TableCell className="text-center">{item.weight}%</TableCell>
                                    <TableCell className={`text-center font-bold text-lg ${getScoreColor(item.score)}`}>{item.score}</TableCell>
                                    <TableCell className="text-right font-medium">{item.weightedScore.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter className="flex-col items-center gap-4 mt-4 pt-4 border-t">
                    <p className="text-sm text-center">Still not satisfied with the valuation?</p>
                    <Button onClick={onOptForManualReview}>Opt for Manual Valuation</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

    