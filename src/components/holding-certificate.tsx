'use client';

import { useAuth } from '@/context/auth-context';
import type { Artist, Fractal } from '@/lib/data';
import type { OwnedFractal } from '@/context/auth-context';
import { Wordmark } from './wordmark';
import { format } from 'date-fns';
import Image from 'next/image';
import { useMemo } from 'react';

interface HoldingCertificateProps {
  artist: Artist;
  ownedFractals: OwnedFractal[];
  allArtistFractals: Fractal[];
}

export function HoldingCertificate({ artist, ownedFractals, allArtistFractals }: HoldingCertificateProps) {
  const { user } = useAuth();

  const collectorName = user ? `${user.firstName} ${user.lastName}` : "Valued Collector";
  const numberOfFractals = ownedFractals.length;
  
  const latestPurchaseDate = useMemo(() => {
    if (ownedFractals.length === 0) return new Date();
    const sorted = [...ownedFractals].sort((a,b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    return new Date(sorted[0].purchaseDate);
  }, [ownedFractals]);

  const authenticationNumber = useMemo(() => {
      if(!user) return 'N/A';
      const dataToEncode = `${user.uid}-${artist.id}-${numberOfFractals}-${latestPurchaseDate.toISOString()}`;
      // A simple way to create a "serial number" like string
      return btoa(dataToEncode).replace(/=/g, '').toUpperCase();
  }, [user, artist, numberOfFractals, latestPurchaseDate]);


  if (!user) {
    return <div>Please log in to view your certificate.</div>;
  }
  
  return (
    <div id="certificate-content" className="bg-background text-foreground font-serif p-8 max-w-4xl mx-auto">
        <h1 className="text-center font-headline text-3xl font-bold tracking-tight mb-8">
            Certificate of Authentic Fractal Holding
        </h1>

        <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4 mb-8">
            {allArtistFractals.map((fractal) => (
                <div key={fractal.id} className="break-inside-avoid">
                    <Image
                        src={fractal.heroImage}
                        alt={fractal.title}
                        width={fractal.width}
                        height={fractal.height}
                        className="object-cover w-full h-auto"
                        data-ai-hint={fractal.aiHint}
                    />
                </div>
            ))}
        </div>
        
        <div className="text-left space-y-6 text-sm">
            <p className="leading-relaxed">
                This is to formally certify that <span className="font-bold">{collectorName}</span> holds <span className="font-bold">{numberOfFractals}</span> authentic Collector's Edition Fractal(s) from the portfolio of <span className="font-bold">{artist.name}</span>, as of <span className="font-bold">{format(latestPurchaseDate, 'MMMM d, yyyy')}</span>.
            </p>

            {artist.artistMessage && (
                 <div className="bg-muted/50 p-4 rounded-lg my-6 text-left">
                    <h2 className="font-bold font-headline text-lg mb-2">A Message from {artist.name}</h2>
                    <p className="text-muted-foreground italic leading-relaxed">&ldquo;{artist.artistMessage}&rdquo;</p>
                </div>
            )}

            <div>
                <p className="text-muted-foreground uppercase text-xs tracking-widest">Authentication number</p>
                <p className="font-mono text-base mt-1 break-all">{authenticationNumber}</p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                This certificate affirms the authenticity of the Fractal(s) held by {collectorName}, while clarifying that these do not constitute ownership rights over the original physical or digital artwork by {artist.name}.
            </p>

            <div className="flex flex-col items-start pt-8">
                 <p className="text-muted-foreground mb-2">With appreciation,</p>
                 <Wordmark className="h-16 w-auto" />
            </div>
        </div>
    </div>
  );
}
