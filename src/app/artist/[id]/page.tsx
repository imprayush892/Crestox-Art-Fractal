import { artists, fractals } from '@/lib/data';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FractalCard } from '@/components/fractal-card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';

export default function ArtistProfilePage({ params }: { params: { id:string } }) {
  const artist = artists.find(a => a.id === params.id);

  if (!artist) {
    notFound();
  }

  const artistFractals = fractals.filter(f => f.artistId === artist.id);

  const allPricePoints = artistFractals.flatMap(f => f.priceHistory);
  const uniqueDates = [...new Set(allPricePoints.map(p => p.date))].sort((a,b) => new Date(a).getTime() - new Date(b).getTime());

  const portfolioHistory = uniqueDates.map(date => {
      const portfolioValue = artistFractals.reduce((total, fractal) => {
          const pricePointsOnOrBefore = fractal.priceHistory.filter(p => new Date(p.date) <= new Date(date));
          const lastPricePoint = pricePointsOnOrBefore.length > 0 ? pricePointsOnOrBefore[pricePointsOnOrBefore.length - 1] : null;
          return total + (lastPricePoint ? lastPricePoint.price : 0);
      }, 0);
      return { date, value: portfolioValue };
  });

  return (
    <div className="container py-12">
      <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12 mb-12">
        <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-primary shadow-lg">
          <AvatarImage src={artist.avatar} alt={artist.name} />
          <AvatarFallback className="text-4xl">{artist.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="pt-4">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">{artist.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{artist.bio}</p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="font-headline text-3xl font-bold mb-6">Portfolio Value</h2>
        <Card>
          <CardHeader>
              <CardTitle>Portfolio Value Over Time</CardTitle>
              <CardDescription>Aggregated value of all artworks by {artist.name}.</CardDescription>
          </CardHeader>
          <CardContent>
              <ChartContainer 
                  config={{ value: { label: "Value", color: "hsl(var(--primary))" } }} 
                  className="h-[300px] w-full"
              >
                  <LineChart data={portfolioHistory} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                          cursor={{
                              stroke: 'hsl(var(--border))',
                              strokeWidth: 2,
                              strokeDasharray: '3 3',
                          }}
                          content={<ChartTooltipContent
                              formatter={(value) => `$${(value as number).toLocaleString()}`}
                              indicator="dot"
                          />}
                      />
                      <Line
                          dataKey="value"
                          type="monotone"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                      />
                  </LineChart>
              </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="font-headline text-3xl font-bold mb-8 border-b pb-4">Artwork by {artist.name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {artistFractals.map((fractal) => (
                <FractalCard key={fractal.id} fractal={fractal} artist={artist} />
            ))}
        </div>
      </div>
    </div>
  );
}
