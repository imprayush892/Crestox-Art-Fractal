
'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginClient } from '@/components/login-client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';

function LoginSkeleton() {
  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid gap-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/collection';
      router.push(redirectUrl);
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading || isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-14rem)] py-12">
        <LoginSkeleton />
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-14rem)] py-12">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginClient />
      </Suspense>
    </div>
  );
}
