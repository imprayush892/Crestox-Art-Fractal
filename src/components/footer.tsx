'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from './logo';

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
            <Logo className="h-14 w-14" />
            <span className="font-bold text-lg font-headline">Crestox</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {year} Crestox. All rights reserved.
          </p>
          <nav className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
