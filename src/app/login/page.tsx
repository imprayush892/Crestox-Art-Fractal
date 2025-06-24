import { Suspense } from 'react';
import { LoginClient } from '@/components/login-client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-14rem)] py-12">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginClient />
      </Suspense>
    </div>
  );
}
