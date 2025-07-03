
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const getPublicUrl = (path: string) => {
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
        return 'https://placehold.co/56x56.png';
    }
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
}
const monogramUrl = getPublicUrl('public/assets/crestox-monogram.png');


export function Footer() {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Image src={monogramUrl} alt="Crestox Logo" width={56} height={56} className="h-14 w-14" data-ai-hint="logo monogram" />
            <span className="font-bold text-lg font-headline">Crestox</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {year} Crestox. All rights reserved.
          </p>
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
