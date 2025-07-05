
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from './ui/button';

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


interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Lightbox({ isOpen, onClose, children }: LightboxProps) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] w-full p-4 flex flex-col items-center"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute -top-2 -right-2 md:top-0 md:right-0 bg-white/20 hover:bg-white/30 text-white rounded-full h-10 w-10 z-10"
            >
              <motion.div variants={iconVariants} initial="hidden" animate="visible">
                <X className="h-6 w-6" />
              </motion.div>
            </Button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
