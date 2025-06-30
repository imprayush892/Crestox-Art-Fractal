
'use client';

import type { PublicUser } from '@/lib/data';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Package, Tag } from 'lucide-react';

interface CollectorStats {
    onSaleCount: number;
    cheapestPrice?: number;
}

interface CollectorCardProps {
  collector: PublicUser;
  stats: CollectorStats;
  ownedCount: number;
}

export function CollectorCard({ collector, stats, ownedCount }: CollectorCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg">
        <Link href={`/collector/${collector.id}`} className="block h-full">
            <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-primary/20">
                    <AvatarImage src={collector.avatar} alt={collector.name} data-ai-hint="user avatar" />
                    <AvatarFallback className="text-xl">{collector.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-headline text-xl font-bold">{collector.name}</h3>
                        <p className="text-sm text-muted-foreground">Collector</p>
                    </div>
                </div>
                <div className="mt-4 flex-grow space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Package className="h-4 w-4"/> Fractals Held</span>
                        <span className="font-semibold">{ownedCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Tag className="h-4 w-4"/> Items for Sale</span>
                        <span className="font-semibold">{stats.onSaleCount}</span>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                    {stats.cheapestPrice !== undefined ? (
                         <p className="text-xs text-muted-foreground">Fractals available from <span className="font-bold text-primary">₹{stats.cheapestPrice.toLocaleString()}</span></p>
                    ) : (
                         <p className="text-xs text-muted-foreground">No items currently for sale.</p>
                    )}
                </div>
            </CardContent>
      </Link>
    </Card>
  );
}
