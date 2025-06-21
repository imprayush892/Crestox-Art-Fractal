'use client';

import { artists, fractals } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Layers } from 'lucide-react';
import { FractalCard } from '@/components/fractal-card';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format } from 'date-fns';

export default function FractalDetailPage() {
  const { isLoggedIn, isInCollection, addToCollection } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  
  const fractal = fractals.find(f => f.id === params.id);
  
  if (!fractal) {
    notFound();
  }

  const artist = artists.find(a => a.id === fractal.artistId);
  const relatedFractals = fractals.filter(f => f.artistId === fractal.artistId && f.id !== fractal.id).slice(0, 3);

  const inCollection = isInCollection(fractal.id);

  const handleAddToCollection = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/fractal/${fractal.id}`);
      return;
    }
    addToCollection(fractal.id);
    toast({
      title: "Added to Collection!",
      description: `"${fractal.title}" is now in your collection.`,
    });
  };

  return (
    <div className="container py-12">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </Link>
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
        <div className="lg:col-span-3">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden shadow-lg">
            <Image
              src={fractal.image}
              alt={fractal.title}
              width={1000}
              height={1000}
              className="w-full h-full object-cover"
              data-ai-hint={fractal.aiHint}
            />
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <h1 className="font-headline text-4xl font-bold">{fractal.title}</h1>
            <p className="text-lg text-muted-foreground mt-2">{fractal.description}</p>
            
            {artist && (
              <div className="mt-6">
                <Link href={`/artist/${artist.id}`} className="group inline-flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={artist.avatar} alt={artist.name} />
                    <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">Artist</p>
                    <p className="font-semibold group-hover:text-primary transition-colors">{artist.name}</p>
                  </div>
                </Link>
              </div>
            )}
            
            <div className="mt-8 flex flex-wrap gap-2">
              <Badge variant="secondary">Fractal</Badge>
              <Badge variant="secondary">Digital Art</Badge>
              <Badge variant="secondary">Algorithmic</Badge>
            </div>

            <div className="mt-8 border-t pt-8">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>{fractal.availableEditions} of {fractal.totalEditions} available</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    ${fractal.price.toLocaleString()}
                  </div>
                </div>
                <Button size="lg" className="w-full" onClick={handleAddToCollection} disabled={inCollection}>
                   {inCollection ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Owned in Collection
                    </>
                  ) : (
                    'Invest Now'
                  )}
                </Button>
            </div>
          </div>
        </div>
      </div>

       <div className="mt-16">
        <h3 className="font-headline text-2xl font-bold mb-4">Price History</h3>
        <Card>
          <CardContent className="p-2 md:p-6 pt-6">
            <ChartContainer
              config={{
                price: {
                  label: "Price",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[250px] w-full"
            >
              <LineChart data={fractal.priceHistory} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => format(new Date(value), "MMM yy")}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  cursor={{
                    stroke: 'hsl(var(--border))',
                    strokeWidth: 2,
                    strokeDasharray: '3 3',
                  }}
                  content={<ChartTooltipContent 
                    indicator="dot"
                    formatter={(value) => `$${(value as number).toLocaleString()}`}
                  />}
                />
                <Line
                  dataKey="price"
                  type="monotone"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={true}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      {relatedFractals.length > 0 && (
          <div className="mt-24">
            <h2 className="font-headline text-3xl font-bold mb-6">More from this Artist</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {relatedFractals.map(relatedFractal => {
                    const relatedArtist = artists.find(a => a.id === relatedFractal.artistId);
                    if (!relatedArtist) return null;
                    return <FractalCard key={relatedFractal.id} fractal={relatedFractal} artist={relatedArtist} />;
                })}
            </div>
          </div>
      )}
    </div>
  );
}
