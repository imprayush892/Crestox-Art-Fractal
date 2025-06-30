
'use client';

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EvaluationResult, ValuationBreakdownItem } from '@/ai/flows/evaluate-artwork-flow';
import { Button } from './ui/button';

type SuccessfulEvaluation = Extract<EvaluationResult, { status: 'success' }>['evaluation'];


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

    const groupedBreakdown = useMemo(() => {
        if (!evaluation.valuationBreakdown) return {};
        return evaluation.valuationBreakdown.reduce((acc, item) => {
            (acc[item.category] = acc[item.category] || []).push(item);
            return acc;
        }, {} as Record<string, ValuationBreakdownItem[]>);
    }, [evaluation.valuationBreakdown]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Crestox Quality Scorecard</DialogTitle>
                    <DialogDescription>This scorecard details the AI's assessment against the criteria from the ArtScoreChecklist. This quality score (Q) is a primary input for the ArtValueEst model's final price calculation.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto pr-4">
                    <Table>
                        {Object.entries(groupedBreakdown).map(([category, items]) => (
                             <React.Fragment key={category}>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead colSpan={3} className="text-primary font-semibold bg-muted/50">{category}</TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <TableHead>Criterion</TableHead>
                                        <TableHead className="text-center">Weight</TableHead>
                                        <TableHead className="text-right">Score (0-10)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium text-xs">{item.criterion}</TableCell>
                                            <TableCell className="text-center">{item.weight}%</TableCell>
                                            <TableCell className={`text-right font-bold text-lg ${getScoreColor(item.score)}`}>{item.score}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </React.Fragment>
                        ))}
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
