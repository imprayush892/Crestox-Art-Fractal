
'use client';
import { CollectionClient } from '@/components/collection-client';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function CollectionPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/collection');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading Your Collection...</p>
            </div>
        </div>
    );
  }

  if (!isLoggedIn) {
      return null;
  }

  return (
    <div className="container py-12">
        <CollectionClient />
    </div>
  );
}
