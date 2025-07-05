'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ExitIntentModal } from './exit-intent-modal';
import { useIsMobile } from '@/hooks/use-mobile';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile || hasTriggered) return;

    const handleMouseOut = (event: MouseEvent) => {
      // Trigger if cursor leaves the top of the viewport
      if (event.clientY <= 0 && !event.relatedTarget && !event.toElement) {
        setIsModalOpen(true);
        setHasTriggered(true);
      }
    };

    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [hasTriggered, isMobile]);

  return (
    <>
      <ExitIntentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
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
