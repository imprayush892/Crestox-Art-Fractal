'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PortfolioPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile?view=portfolio');
  }, [router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting to My Profile...</p>
      </div>
    </div>
  );
}
