import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { Fractal, Artist } from '@/lib/data';
import { motion } from 'framer-motion';
import React, { useState, useRef } from 'react';
import { Lightbox } from './lightbox';
import { Button } from './ui/button';

interface FractalCardProps {
  fractal: Fractal;
  artist: Artist;
  className?: string;
}

export const FractalCard = React.forwardRef<HTMLDivElement, FractalCardProps>(({ fractal, artist, className }, ref) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsLightboxOpen(true);
    }, 700); // 0.7 second delay for preview
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
  };
  
  return (
    <>
      <motion.div
        ref={ref}
        className={className}
        whileHover={{ y: -5, scale: 1.03, zIndex: 10 }}
        transition={{ type: 'spring', stiffness: 300 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link href={`/fractal/${fractal.id}`} className="group block">
          <Card className="overflow-hidden transition-all duration-300 ease-in-out shadow-md group-hover:shadow-xl group-hover:shadow-primary/10 border-2 border-transparent group-hover:border-primary/20">
            <CardContent className="p-0">
              <div className="relative overflow-hidden">
                <Image
                  src={fractal.heroImage}
                  alt={fractal.title}
                  width={fractal.width}
                  height={fractal.height}
                  className="object-cover w-full h-auto transition-transform duration-300 ease-in-out group-hover:scale-105"
                  data-ai-hint={fractal.aiHint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                    <h3 className="font-headline text-lg font-bold truncate">{fractal.title}</h3>
                    <p className="text-sm text-white/90">by {artist.name}</p>
                    <p className="mt-2 font-semibold text-lg">₹{fractal.price.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      <Lightbox isOpen={isLightboxOpen} onClose={() => setIsLightboxOpen(false)}>
        <div className="flex flex-col items-center gap-4 text-white">
          <Image
            src={fractal.heroImage}
            alt={fractal.title}
            width={800}
            height={800}
            className="object-contain w-auto h-auto max-w-full max-h-[75vh] rounded-lg shadow-2xl"
            data-ai-hint={fractal.aiHint}
          />
          <div className="text-center">
            <p className="font-headline text-2xl">{fractal.title}</p>
            <p className="text-lg text-white/80">by {artist.name}</p>
          </div>
          <Button asChild size="lg">
            <Link href={`/fractal/${fractal.id}`}>
              Collect Fractal
            </Link>
          </Button>
        </div>
      </Lightbox>
    </>
  );
});

FractalCard.displayName = 'FractalCard';
