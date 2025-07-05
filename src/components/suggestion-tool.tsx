
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { FractalCard } from './fractal-card';
import { artists, type Fractal } from '@/lib/data';
import { getArtworkSuggestions } from '@/actions/suggestions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2 } from 'lucide-react';
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { motion } from 'framer-motion';

const iconVariants = {
  hidden: { scale: 0.5, opacity: 0, rotate: -30 },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.1,
    },
  },
};


export function SuggestionTool() {
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<Fractal[]>([]);
  const { toast } = useToast();

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await getArtworkSuggestions();
      if (result.success) {
        setSuggestions(result.suggestions ?? []);
         if ((result.suggestions ?? []).length === 0) {
           toast({
            title: "No new suggestions",
            description: "We couldn't find any new art for you. Try browsing some more!",
          });
         }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    });
  };

  const getArtistById = (artistId: string) => artists.find(a => a.id === artistId);
  
  return (
    <div className="w-full">
      <Card className="p-6 md:p-8 bg-card border shadow-sm rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h2 className="font-headline text-2xl font-bold">Discover Your Next Favorite</h2>
                <p className="text-muted-foreground mt-1">Let our AI curator suggest new artwork based on your taste.</p>
            </div>
            <Button onClick={handleGenerate} disabled={isPending} size="lg">
              {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <motion.div variants={iconVariants} initial="hidden" animate="visible" className="mr-2"><Wand2 className="h-5 w-5" /></motion.div>}
              Generate Suggestions
            </Button>
        </div>
      </Card>

      {isPending && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-8">
              {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                      <Skeleton className="aspect-square w-full rounded-b-none" />
                      <div className="p-4 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                      </div>
                  </Card>
              ))}
          </div>
      )}

      {suggestions.length > 0 && !isPending && (
        <div className="mt-8">
            <h3 className="font-headline text-3xl font-bold mb-6">Your Personal Suggestions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {suggestions.map((fractal) => {
                    const artist = getArtistById(fractal.artistId);
                    if (!artist) return null;
                    return <FractalCard key={fractal.id} fractal={fractal} artist={artist} />;
                })}
            </div>
        </div>
      )}
    </div>
  );
}
