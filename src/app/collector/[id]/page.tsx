
'use client';

import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { CollectorProfile } from '@/components/collector-profile';
import { useEffect, useState } from 'react';
import type { PublicHolding, ResaleListing, PublicUser } from '@/lib/data';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function CollectorProfilePage() {
  const params = useParams();
  const { allUsers } = useAuth();

  const collectorId = typeof params.id === 'string' ? params.id : '';
  
  const [collector, setCollector] = useState<PublicUser | null>(null);
  const [holdings, setHoldings] = useState<PublicHolding[]>([]);
  const [listings, setListings] = useState<ResaleListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!collectorId || !db || allUsers.length === 0) {
        if (allUsers.length > 0) setIsLoading(false);
        return;
    };
    
    const foundUser = allUsers.find(u => u.id === collectorId);
    if (!foundUser) {
        setIsLoading(false);
        notFound();
        return;
    }
    setCollector(foundUser);

    const fetchData = async () => {
        try {
            const holdingsQuery = query(collection(db, 'users', collectorId, 'holdings'));
            const holdingsSnap = await getDocs(holdingsQuery);
            const fetchedHoldings = holdingsSnap.docs.map(d => d.data() as PublicHolding);
            setHoldings(fetchedHoldings);
            
            const listingsQuery = query(collection(db, 'resaleListings'), where('resellerId', '==', collectorId), where('status', '==', 'active'));
            const listingsSnap = await getDocs(listingsQuery);
            const fetchedListings = listingsSnap.docs.map(d => ({id: d.id, ...d.data()}) as ResaleListing);
            setListings(fetchedListings);

        } catch (error) {
            console.error("Error fetching collector data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchData();

  }, [collectorId, allUsers]);

  if (isLoading) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading Collector Profile...</p>
            </div>
        </div>
    );
  }

  if (!collector) {
      notFound();
  }

  return (
    <div className="container py-12">
        <CollectorProfile 
            collector={collector}
            holdings={holdings}
            listings={listings}
        />
    </div>
  );
}
