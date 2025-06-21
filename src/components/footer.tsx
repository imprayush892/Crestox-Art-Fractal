import Link from 'next/link';
import { Gem } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Gem className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg font-headline">Crestox</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Crestox. All rights reserved.
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
