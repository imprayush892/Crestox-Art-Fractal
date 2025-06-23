
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2, Wand2, ArrowRight, ArrowLeft } from 'lucide-react';
import type { Fractal, ArtworkSize } from '@/lib/data';
import Image from 'next/image';
import { evaluateArtwork } from '@/ai/flows/evaluate-artwork-flow';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { EvaluationResult } from '@/context/auth-context';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const editArtworkFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(1000),
  materials: z.string().min(3, "Please specify the materials used."),
  length: z.coerce.number().min(0.1, "Length is required."),
  breadth: z.coerce.number().min(0.1, "Breadth is required."),
  height: z.coerce.number().optional(),
  unit: z.enum(['in', 'cm', 'ft', 'px']),
  minEstimatedValue: z.coerce.number().min(1, "Minimum value must be at least $1."),
  maxEstimatedValue: z.coerce.number(),
  editionsToIssue: z.coerce.number().int().min(0, "Cannot issue negative editions.").default(0),
  subjectSignificance: z.string().max(500).optional(),
  personalSignificance: z.string().max(500).optional(),
  timeEffort: z.string().max(500).optional(),
  biographicalContext: z.string().max(500).optional(),
  commissionPatronage: z.string().max(500).optional(),
}).refine(data => data.maxEstimatedValue >= data.minEstimatedValue, {
  message: "Maximum value must be greater than or equal to minimum value.",
  path: ["maxEstimatedValue"],
});

export type EditArtworkFormValues = z.infer<typeof editArtworkFormSchema>;

export default function EditArtworkPage() {
  const { isLoggedIn, artistProfile, fractals, updateAndReevaluateArtwork } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [artwork, setArtwork] = useState<Fractal | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  const artworkId = typeof params.id === 'string' ? params.id : '';
  
  const form = useForm<EditArtworkFormValues>({
    resolver: zodResolver(editArtworkFormSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/portfolio/artwork/edit/${artworkId}`);
    }
    if (isLoggedIn && !artistProfile) {
        router.push('/portfolio/create');
    }
  }, [isLoggedIn, artistProfile, router, artworkId]);

  useEffect(() => {
    if (fractals.length > 0 && artworkId && artistProfile) {
      const foundArtwork = fractals.find(f => f.id === artworkId);
      if (foundArtwork) {
        if (foundArtwork.artistId === artistProfile.id) {
          setArtwork(foundArtwork);
          form.reset({
            title: foundArtwork.title,
            description: foundArtwork.description,
            materials: foundArtwork.materials,
            length: foundArtwork.artworkSize.length,
            breadth: foundArtwork.artworkSize.breadth,
            height: foundArtwork.artworkSize.height,
            unit: foundArtwork.artworkSize.unit,
            minEstimatedValue: foundArtwork.artistMinEstimate || 100,
            maxEstimatedValue: foundArtwork.artistMaxEstimate || 1000,
            editionsToIssue: 0,
            subjectSignificance: foundArtwork.subjectSignificance,
            personalSignificance: foundArtwork.personalSignificance,
            timeEffort: foundArtwork.timeEffort,
            biographicalContext: foundArtwork.biographicalContext,
            commissionPatronage: foundArtwork.commissionPatronage,
          });
        } else {
          notFound();
        }
      } else {
        notFound();
      }
    }
  }, [fractals, artworkId, artistProfile, form, notFound]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isEvaluating) {
      setProgress(13); // Initial progress
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(timer);
            return prev;
          }
          return prev + 5;
        });
      }, 800);
    } else {
      setProgress(0);
    }
    return () => clearInterval(timer);
  }, [isEvaluating]);
  
  async function onFormSubmit(data: EditArtworkFormValues) {
    if (!artistProfile || !artwork) return;
    setIsEvaluating(true);
    
    try {
        let artworkSizeString = `${data.length} x ${data.breadth}`;
        if (data.height) {
            artworkSizeString += ` x ${data.height}`;
        }
        artworkSizeString += ` ${data.unit}`;

        const evaluationInput = {
            photoDataUri: artwork.image,
            title: data.title,
            description: data.description,
            materials: data.materials,
            artworkSize: artworkSizeString,
            minEstimatedValue: data.minEstimatedValue,
            maxEstimatedValue: data.maxEstimatedValue,
            subjectSignificance: data.subjectSignificance,
            personalSignificance: data.personalSignificance,
            timeEffort: data.timeEffort,
            biographicalContext: data.biographicalContext,
            commissionPatronage: data.commissionPatronage,
            artistBio: artistProfile.bio,
            artistAwards: artistProfile.awards.join(', '),
            artistExhibitions: artistProfile.exhibitions.join(', '),
        };

        const result = await evaluateArtwork(evaluationInput);
        setProgress(100);
        setEvaluationResult(result);
        setIsEvaluating(false);
        
    } catch (error) {
        console.error("Error during artwork evaluation:", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem evaluating your artwork. Please try again.",
        });
        setIsEvaluating(false);
    }
  }

  const handlePriceChoice = async (useCrestoxPrice: boolean) => {
    if (!updateAndReevaluateArtwork || !evaluationResult || !artwork) return;
    
    setIsSubmitting(true);
    const formData = form.getValues();
    
    try {
        await updateAndReevaluateArtwork(
            artwork.id,
            formData,
            evaluationResult,
            useCrestoxPrice
        );
        toast({
            title: "Artwork Updated!",
            description: `"${formData.title}" has been successfully re-evaluated and updated.`,
        });
        router.push('/portfolio');
    } catch (error) {
         console.error("Error during artwork final submission:", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem updating your artwork. Please try again.",
        });
        setIsSubmitting(false);
    }
  };
  
  if (!artwork) {
    return (
        <div className="container py-12 flex justify-center">
             <Card className="w-full max-w-3xl">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Loading Artwork...</CardTitle>
                </CardHeader>
                <CardContent>
                    <Loader2 className="mx-auto h-10 w-10 animate-spin" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container py-12 flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className="font-headline text-3xl">Re-evaluate Artwork</CardTitle>
            <Button variant="ghost" asChild>
                <Link href="/portfolio">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Portfolio
                </Link>
            </Button>
          </div>
          <CardDescription>
            Update artwork details and submit for a fresh AI-assisted evaluation to get a quality grade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEvaluating && (
              <div className="space-y-4 pt-4 flex flex-col items-center">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center animate-pulse">
                      AI evaluation in progress... This may take up to a minute. Please don't leave the page.
                  </p>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
          )}

          {evaluationResult && !isEvaluating && (
              <div className="space-y-6">
                 <Alert>
                    <Wand2 className="h-4 w-4" />
                    <AlertTitle>Evaluation Complete!</AlertTitle>
                    <AlertDescription>
                        Choose a valuation for your artwork. Accepting the Crestox price ensures you receive a grade badge.
                    </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                    <Card className="flex flex-col justify-between">
                        <CardHeader>
                            <CardTitle>Your Estimate</CardTitle>
                            <CardDescription>Based on your provided range.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">${form.getValues('minEstimatedValue').toLocaleString()} - ${form.getValues('maxEstimatedValue').toLocaleString()}</p>
                        </CardContent>
                        <CardContent>
                             <Button size="lg" className="w-full" onClick={() => handlePriceChoice(false)} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Use My Valuation
                            </Button>
                        </CardContent>
                    </Card>
                     <Card className="border-primary border-2 flex flex-col justify-between">
                        <CardHeader>
                            <CardTitle>Crestox AI Suggestion</CardTitle>
                            <CardDescription>Our AI-assisted recommendation.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary">${evaluationResult.crestoxPriceRange[0].toLocaleString()} - ${evaluationResult.crestoxPriceRange[1].toLocaleString()}</p>
                        </CardContent>
                         <CardContent>
                             <Button size="lg" className="w-full" onClick={() => handlePriceChoice(true)} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ArrowRight className="mr-2 h-4 w-4" />}
                                Accept Crestox Valuation
                            </Button>
                        </CardContent>
                    </Card>
                </div>
              </div>
          )}

          {!isEvaluating && !evaluationResult && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8">
                
                <div className="bg-muted/50 rounded-lg p-4 flex justify-center">
                  <Image
                    src={artwork.image}
                    alt={artwork.title}
                    width={300}
                    height={300}
                    className="rounded-md object-contain"
                    data-ai-hint={artwork.aiHint}
                  />
                </div>

                <div className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Chromatic Bloom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description / Artist's Statement</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your artwork, its inspiration, and the process..."
                            className="resize-y min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                      control={form.control}
                      name="materials"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Materials Used / Medium</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Oil on canvas, Digital (Procreate)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  <FormItem>
                    <FormLabel>Artwork Size</FormLabel>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        <FormField control={form.control} name="length" render={({field}) => (<FormItem><FormControl><Input type="number" placeholder="Length" {...field}/></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="breadth" render={({field}) => (<FormItem><FormControl><Input type="number" placeholder="Breadth" {...field}/></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="height" render={({field}) => (<FormItem><FormControl><Input type="number" placeholder="Height (Opt.)" {...field}/></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="unit" render={({field}) => (
                            <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="in">in</SelectItem>
                                        <SelectItem value="cm">cm</SelectItem>
                                        <SelectItem value="ft">ft</SelectItem>
                                        <SelectItem value="px">px</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                    </div>
                  </FormItem>
                  

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="minEstimatedValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Minimum Estimated Value ($)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxEstimatedValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Maximum Estimated Value ($)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="1000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="editionsToIssue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Portfolio Fractals to Issue</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormDescription> New 'fractals' to add to your total supply (for your entire portfolio, not just this artwork). </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        <h3 className="text-lg font-medium">Optional: Add Detailed Context for AI Evaluation</h3>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-6 pt-6">
                        <Alert variant="default">
                          <AlertDescription>Providing thorough and accurate information here will significantly improve the quality of the AI evaluation. Leaving fields blank may result in a lower score.</AlertDescription>
                        </Alert>
                        <FormField
                          control={form.control}
                          name="subjectSignificance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject/Cultural Significance</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Explain any historical, cultural, or notable relevance of your artwork's subject." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="personalSignificance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Personal/Emotional Significance</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Describe the personal story or emotional meaning behind this piece." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="timeEffort"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time Spent / Effort</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 80 hours of rendering, 3 months of concept work" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="biographicalContext"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Biographical/Contextual Relevance</FormLabel>
                              <FormControl>
                                <Textarea placeholder="How does this artwork relate to a specific period in your life or a broader art movement?" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="commissionPatronage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Commission/Patronage Information</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Commissioned by the Museum of Digital Art" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                <Button type="submit" size="lg">
                  <Wand2 className="mr-2 h-4 w-4" />
                  Re-evaluate Artwork
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
