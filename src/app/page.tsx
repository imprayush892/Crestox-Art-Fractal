'use client';

import { useAuth } from '@/context/auth-context';
import { type Fractal } from '@/lib/data';
import { FractalCard } from '@/components/fractal-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';

const getPublicUrl = (path: string) => {
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
        return 'https://placehold.co/564x370.png';
    }
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
}

const wordmarkUrl = getPublicUrl('public/assets/crestox-wordmark.png');

export default function Home() {
  const { artists, fractals } = useAuth();
  const [displayedFractals, setDisplayedFractals] = useState<Fractal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const yWordmark = useTransform(scrollYProgress, [0, 1], ['0%', '150%']);
  const yHeadline = useTransform(scrollYProgress, [0, 1], ['0%', '120%']);
  const yParagraph = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);


  const artistsMap = useMemo(() => new Map(artists.map(a => [a.id, a])), [artists]);
  const getArtistById = (artistId: string) => artistsMap.get(artistId);

  useEffect(() => {
    if (fractals.length > 0) {
      const shuffled = [...fractals].sort(() => 0.5 - Math.random());
      setDisplayedFractals(shuffled.slice(0, 100));
      setIsLoading(false);
    }
  }, [fractals]); 

  const renderSkeletons = () => {
    return (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8">
            {[...Array(12)].map((_, i) => (
                <div key={i} className="break-inside-avoid">
                    <Skeleton className="h-64 w-full" />
                </div>
            ))}
        </div>
    );
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.01,
        duration: 0.2,
        ease: 'easeOut'
      },
    }),
  };


  return (
    <div className="container py-12">
      <div ref={heroRef} className="flex flex-col items-center justify-center text-center min-h-[70vh] mb-12 relative overflow-hidden">
        <motion.div style={{ y: yWordmark, opacity }} className="w-full">
          <Image
              src={wordmarkUrl}
              alt="Crestox Wordmark"
              width={564}
              height={370}
              className="h-auto w-full max-w-sm mb-4 mx-auto"
              data-ai-hint="company logo"
              priority
          />
        </motion.div>
        <motion.h1 style={{ y: yHeadline, opacity }} className="font-headline text-5xl md:text-6xl font-bold tracking-tight">Democratizing Art</motion.h1>
        <motion.p style={{ y: yParagraph, opacity }} className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
          Crestox is a revolutionary platform dedicated to making the world of art accessible. We believe in the power of art to inspire, connect, and transform.
        </motion.p>
        <motion.div 
          style={{ y: yParagraph, opacity }} 
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="lg" variant="secondary" asChild className="font-semibold hover:bg-primary hover:text-primary-foreground hover:shadow-lg transition-shadow">
            <Link href="/explore">Start Collecting</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild className="font-semibold hover:bg-primary hover:text-primary-foreground hover:shadow-lg transition-shadow">
            <Link href="/portfolio">Become a Listed Artist</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild className="font-semibold hover:bg-primary hover:text-primary-foreground hover:shadow-lg transition-shadow">
            <Link href="/donate">What is Crestox?</Link>
          </Button>
        </motion.div>
      </div>
      
      {isLoading ? renderSkeletons() : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8">
          {displayedFractals.map((fractal, i) => {
            const artist = getArtistById(fractal.artistId);
            if (!artist) return null;
            return (
              <motion.div 
                key={fractal.id} 
                className="break-inside-avoid"
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={cardVariants}
              >
                <FractalCard fractal={fractal} artist={artist} />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
