
'use client';

import type { Fractal } from '@/lib/data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';

interface ArtworkContextDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fractal: Fractal | null;
}

const DetailItem = ({ label, value }: { label: string; value?: string }) => {
    if (!value) return null;
    return (
        <div>
            <h4 className="font-semibold text-sm text-muted-foreground">{label}</h4>
            <p className="mt-1 text-base">{value}</p>
        </div>
    );
};

export function ArtworkContextDialog({ isOpen, onClose, fractal }: ArtworkContextDialogProps) {
  if (!fractal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Artwork Context</DialogTitle>
          <DialogDescription>
            Additional details provided by the artist for "{fractal.title}".
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-6 pr-4">
            <DetailItem label="Subject / Cultural Significance" value={fractal.subjectSignificance} />
            <DetailItem label="Personal / Emotional Significance" value={fractal.personalSignificance} />
            <DetailItem label="Time Spent / Effort" value={fractal.timeEffort} />
            <DetailItem label="Biographical / Contextual Relevance" value={fractal.biographicalContext} />
            <DetailItem label="Commission / Patronage" value={fractal.commissionPatronage} />
        </div>

        <DialogFooter className="mt-6">
            <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
