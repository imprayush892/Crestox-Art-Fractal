import { fractals, artists } from '@/lib/data';
import { ExploreTool } from '@/components/explore-tool';

export default function ExplorePage() {
  return (
    <div className="container py-12">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">Full Collection</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Browse, search, and filter through our entire catalog of unique fractal art.
        </p>
      </div>

      <ExploreTool fractals={fractals} artists={artists} />
    </div>
  );
}
