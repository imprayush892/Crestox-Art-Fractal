'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ExitIntentModal } from './exit-intent-modal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/auth-context';
import type { Fractal } from '@/lib/data';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [randomFractal, setRandomFractal] = useState<Fractal | undefined>(undefined);
  const isMobile = useIsMobile();
  const { fractals } = useAuth();

  useEffect(() => {
    if (isMobile || hasTriggered) return;

    const handleMouseOut = (event: MouseEvent) => {
      // Trigger if cursor leaves the top of the viewport
      if (event.clientY <= 0 && !event.relatedTarget && !event.toElement) {
        if (fractals && fractals.length > 0) {
           // Prefer fractals from real users (which won't have the 'fractal-' prefix)
          const realUserFractals = fractals.filter(f => !f.id.startsWith('fractal-'));
          const fractalsToSample = realUserFractals.length > 0 ? realUserFractals : fractals;
          const selectedFractal = fractalsToSample[Math.floor(Math.random() * fractalsToSample.length)];
          setRandomFractal(selectedFractal);
        }
        setIsModalOpen(true);
        setHasTriggered(true);
      }
    };

    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [hasTriggered, isMobile, fractals]);

  return (
    <>
      <ExitIntentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        fractal={randomFractal}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
