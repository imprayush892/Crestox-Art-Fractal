

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
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef } from 'react';
import { Loader2, UploadCloud, X, Wand2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { evaluateArtwork } from '@/ai/flows/evaluate-artwork-flow';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const artworkFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(1000),
  materials: z.string().min(3, "Please specify the materials used."),
  artworkSize: z.string().min(3, "Please specify the artwork's dimensions."),
  minEstimatedValue: z.coerce.number().min(1, "Minimum value must be at least $1."),
  maxEstimatedValue: z.coerce.number(),
  editionsToIssue: z.coerce.number().int().min(0, "Cannot issue negative editions.").default(0),
  image: z.any()
    .refine((file) => file, "Image is required.")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  subjectSignificance: z.string().max(500).optional(),
  personalSignificance: z.string().max(500).optional(),
  timeEffort: z.string().max(500).optional(),
  biographicalContext: z.string().max(500).optional(),
  commissionPatronage: z.string().max(500).optional(),
}).refine(data => data.maxEstimatedValue > data.minEstimatedValue, {
  message: "Maximum value must be greater than minimum value.",
  path: ["maxEstimatedValue"],
});

type ArtworkFormValues = z.infer<typeof artworkFormSchema>;

interface EvaluationResult {
    finalScore: number;
    grade: 'AAA' | 'AA' | 'A+' | 'A' | 'A-';
    breakdown: any[];
    crestoxPriceRange: [number, number];
}

export default function CreateArtworkPage() {
  const { isLoggedIn, artistProfile, addArtwork } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/portfolio/artwork/create');
    }
    if (isLoggedIn && !artistProfile) {
        router.push('/portfolio/create');
    }
  }, [isLoggedIn, artistProfile, router]);
  
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

  const form = useForm<ArtworkFormValues>({
    resolver: zodResolver(artworkFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      materials: "",
      artworkSize: "",
      minEstimatedValue: 100,
      maxEstimatedValue: 1000,
      editionsToIssue: 100,
      image: undefined,
      subjectSignificance: "",
      personalSignificance: "",
      timeEffort: "",
      biographicalContext: "",
      commissionPatronage: "",
    }
  });

  async function onFormSubmit(data: ArtworkFormValues) {
    if (!artistProfile) return;
    setIsEvaluating(true);
    
    try {
        const reader = new FileReader();
        reader.readAsDataURL(data.image);
        reader.onloadend = async () => {
            const imageDataUri = reader.result as string;

            const evaluationInput = {
                photoDataUri: imageDataUri,
                title: data.title,
                description: data.description,
                materials: data.materials,
                artworkSize: data.artworkSize,
                minEstimatedValue: data.minEstimatedValue,
                maxEstimatedValue: data.maxEstimatedValue,
                subjectSignificance: data.subjectSignificance,
                personalSignificance: data.personalSignificance,
                timeEffort: data.timeEffort,
                biographicalContext: data.biographicalContext,
                commissionPatronage: data.commissionPatronage,
                artistBio: artistProfile.bio,
                awardsAndExhibitions: artistProfile.awardsAndExhibitions
            };

            const result = await evaluateArtwork(evaluationInput);
            setProgress(100);
            setEvaluationResult(result);
            setIsEvaluating(false);
        }
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
    if (!addArtwork || !evaluationResult) return;
    
    setIsSubmitting(true);
    const formData = form.getValues();
    
    const crestoxPrice = (evaluationResult.crestoxPriceRange[0] + evaluationResult.crestoxPriceRange[1]) / 2;
    const finalPrice = useCrestoxPrice ? crestoxPrice : formData.maxEstimatedValue;
    
    const shouldApplyGrade = useCrestoxPrice || formData.maxEstimatedValue <= crestoxPrice;
    
    try {
        await addArtwork(
            { ...formData, image: imagePreview! },
            {
                aiScore: evaluationResult.finalScore,
                aiGrade: evaluationResult.grade,
                aiScorecard: evaluationResult.breakdown,
            },
            finalPrice,
            shouldApplyGrade
        );
        toast({
            title: "Artwork Added!",
            description: `"${formData.title}" has been added to your portfolio.`,
        });
        router.push('/portfolio');
    } catch (error) {
         console.error("Error during artwork final submission:", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem adding your artwork. Please try again.",
        });
        setIsSubmitting(false);
    }
  };
  
  if (!isLoggedIn || !artistProfile) {
    return null;
  }

  return (
    <div className="container py-12 flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Add New Artwork</CardTitle>
          <CardDescription>
            Upload a new artwork. This will be added to your public portfolio and will be evaluated by our AI to provide a quality grade and price suggestion.
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
                            <CardDescription>Our AI-powered recommendation.</CardDescription>
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
                
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artwork File</FormLabel>
                      <FormControl>
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors">
                          {imagePreview ? (
                            <div className="relative w-full h-full">
                              <Image src={imagePreview} alt="Preview" fill style={{ objectFit: 'contain' }} />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 z-10 h-8 w-8"
                                onClick={(e) => {
                                  e.preventDefault();
                                  form.setValue('image', null, { shouldValidate: true });
                                  setImagePreview(null);
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = "";
                                  }
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                              <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP (MAX. 5MB)</p>
                            </div>
                          )}
                          <input
                            id="dropzone-file"
                            type="file"
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                            ref={fileInputRef}
                            onBlur={field.onBlur}
                            name={field.name}
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              field.onChange(file);
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setImagePreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              } else {
                                setImagePreview(null);
                              }
                            }}
                          />
                        </label>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-8">
                  <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl> <Input placeholder="e.g., Chromatic Bloom" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Description / Artist's Statement</FormLabel> <FormControl> <Textarea placeholder="Describe your artwork, its inspiration, and the process..." className="resize-y min-h-[120px]" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="materials" render={({ field }) => ( <FormItem> <FormLabel>Materials Used / Medium</FormLabel> <FormControl> <Input placeholder="e.g., Oil on canvas, Digital (Procreate)" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="artworkSize" render={({ field }) => ( <FormItem> <FormLabel>Artwork Size</FormLabel> <FormControl> <Input placeholder="e.g., 24x36 inches, 4000x4000 pixels" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="minEstimatedValue" render={({ field }) => ( <FormItem> <FormLabel>Minimum Estimated Value ($)</FormLabel> <FormControl> <Input type="number" placeholder="100" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="maxEstimatedValue" render={({ field }) => ( <FormItem> <FormLabel>Maximum Estimated Value ($)</FormLabel> <FormControl> <Input type="number" placeholder="1000" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                  </div>
                  
                  <FormField control={form.control} name="editionsToIssue" render={({ field }) => ( <FormItem> <FormLabel>New Portfolio Fractals to Issue</FormLabel> <FormControl> <Input type="number" placeholder="100" {...field} /> </FormControl> <FormDescription> New 'fractals' to add to your total supply. </FormDescription> <FormMessage /> </FormItem> )}/>

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
                  Evaluate Artwork
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
