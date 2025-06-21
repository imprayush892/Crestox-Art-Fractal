import { SuggestionTool } from '@/components/suggestion-tool';

export default function SuggestionsPage() {
  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">AI Art Curator</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Leverage the power of AI to uncover hidden gems in the world of fractal art tailored just for you.
        </p>
      </div>
      <SuggestionTool />
    </div>
  );
}
