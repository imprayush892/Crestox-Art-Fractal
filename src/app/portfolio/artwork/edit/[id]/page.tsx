
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Loader2, Wand2, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import type { Fractal } from '@/lib/data';
import Image from 'next/image';
import { evaluateArtwork, type EvaluationResult } from '@/ai/flows/evaluate-artwork-flow';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type EditArtworkFormValues, editArtworkFormSchema } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import { EvaluationScorecardDialog } from '@/components/evaluation-scorecard-dialog';
import { motion } from 'framer-motion';

const iconVariants = {
  hidden: { scale: 0.5, opacity: 0, rotate: -30 },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.1,
    },
  },
};

type SuccessfulEvaluation = Extract<EvaluationResult, { status: 'success' }>['evaluation'];


export default function EditArtworkPage() {
  const { isLoggedIn, artistProfile, fractals, updateAndReevaluateArtwork, updateArtworkDetails } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [artwork, setArtwork] = useState<Fractal | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<SuccessfulEvaluation | null>(null);

  const [isManualReviewDialogOpen, setIsManualReviewDialogOpen] = useState(false);
  const [manualReviewDetails, setManualReviewDetails] = useState({ concern: '', analysisForEmail: '' });
  const [isScorecardDialogOpen, setIsScorecardDialogOpen] = useState(false);
  const [isManualReviewConfirmDialogOpen, setIsManualReviewConfirmDialogOpen] = useState(false);

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
            heroImage: foundArtwork.heroImage,
          });
        } else {
          notFound();
        }
      } else {
        notFound();
      }
    }
  }, [fractals, artworkId, artistProfile, form]);

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
  
  async function onReevaluateSubmit(data: EditArtworkFormValues) {
    if (!artistProfile || !artwork) return;
    setIsEvaluating(true);
    setEvaluationResult(null);
    
    try {
        let artworkSizeString = `${data.length} x ${data.breadth}`;
        if (data.height) {
            artworkSizeString += ` x ${data.height}`;
        }
        artworkSizeString += ` ${data.unit}`;

        const evaluationInput = {
            photoDataUri: data.heroImage || artwork.heroImage,
            title: data.title,
            description: data.description,
            materials: data.materials,
            artworkSize: artworkSizeString,
            minEstimatedValue: data.minEstimatedValue || artwork.artistMinEstimate || 0,
            maxEstimatedValue: data.maxEstimatedValue || artwork.artistMaxEstimate || 0,
            subjectSignificance: data.subjectSignificance || "",
            personalSignificance: data.personalSignificance || "",
            timeEffort: data.timeEffort || "",
            biographicalContext: data.biographicalContext || "",
            commissionPatronage: data.commissionPatronage || "",
            artistBio: artistProfile.bio,
            artistAwards: artistProfile.awards.join(', '),
            artistExhibitions: artistProfile.exhibitions.join(', '),
        };

        const result = await evaluateArtwork(evaluationInput);
        setProgress(100);
        
        if (result.status === 'success') {
          setEvaluationResult(result.evaluation);
        } else {
          setManualReviewDetails({ concern: result.concern, analysisForEmail: result.analysisForEmail });
          setIsManualReviewDialogOpen(true);
        }
        
    } catch (error) {
        console.error("Error during artwork evaluation:", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem evaluating your artwork. Please try again.",
        });
    } finally {
        setIsEvaluating(false);
    }
  }

  const handleSimpleSave = async () => {
    if (!updateArtworkDetails || !artwork) return;
    setIsSubmitting(true);
    const data = form.getValues();
    try {
        await updateArtworkDetails(artwork.id, data);
        toast({ title: "Update Successful", description: "Artwork details have been saved." });
        router.push('/portfolio');
    } catch(e) {
        toast({ variant: "destructive", title: "Update Failed", description: "Could not save changes." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePriceChoice = async (useCrestoxPrice: boolean) => {
    if (!updateAndReevaluateArtwork || !evaluationResult || !artwork) return;
    
    setIsSubmitting(true);
    const formData = form.getValues();
    
    const successfulEvalResult: EvaluationResult = {
        status: 'success',
        evaluation: evaluationResult,
    };
    
    try {
        await updateAndReevaluateArtwork(
            artwork.id,
            formData,
            successfulEvalResult,
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
  
  const handleSendForManualCheck = () => {
    const subject = encodeURIComponent("Query for manual checking (Re-evaluation)");
    const body = encodeURIComponent(manualReviewDetails.analysisForEmail);
    window.location.href = `mailto:Crestox@crestox.com?subject=${subject}&body=${body}`;
    
    setIsManualReviewDialogOpen(false);
    toast({
        title: "Manual Review Submitted",
        description: "Your email client has been opened. Please send the email to complete the submission.",
        duration: 8000
    });
    router.push('/portfolio');
  };

  const handleCancelManualCheck = () => {
    setIsManualReviewDialogOpen(false);
  };
  
  const handleRequestManualValuation = () => {
    const data = form.getValues();
    const evaluation = evaluationResult;
    if (!data || !evaluation || !artistProfile || !artwork) return;

    let analysisDetail = `MANUAL VALUATION REQUEST\n\n`;
    analysisDetail += `Artwork ('${data.title}', ID: ${artwork.id}) has been submitted for manual valuation by the artist.\n\n`;
    analysisDetail += `--- Provided Artwork Details ---\n`;
    analysisDetail += `Title: ${data.title}\n`;
    analysisDetail += `Description: ${data.description}\n`;
    analysisDetail += `Artist Bio: ${artistProfile.bio}\n\n`;
    analysisDetail += `--- AI Re-evaluation Summary ---\n`;
    analysisDetail += `Final Score: ${evaluation.finalScore}\n`;
    analysisDetail += `Crestox Grade: ${evaluation.grade}\n`;
    analysisDetail += `Crestox Price Range: ₹${evaluation.crestoxPriceRange[0]} - ₹${evaluation.crestoxPriceRange[1]}\n`;

    const subject = encodeURIComponent("Manual Valuation Request");
    const body = encodeURIComponent(analysisDetail);
    window.location.href = `mailto:Crestox@crestox.com?subject=${subject}&body=${body}`;
    
    setIsManualReviewConfirmDialogOpen(false);
    toast({
        title: "Manual Valuation Requested",
        description: "Your email client has been opened. Please send the email to complete the request.",
        duration: 8000
    });
    router.push('/portfolio');
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
    <>
      <EvaluationScorecardDialog 
        isOpen={isScorecardDialogOpen}
        onClose={() => setIsScorecardDialogOpen(false)}
        evaluation={evaluationResult}
        onOptForManualReview={() => {
            setIsScorecardDialogOpen(false);
            setIsManualReviewConfirmDialogOpen(true);
        }}
      />

      <AlertDialog open={isManualReviewConfirmDialogOpen} onOpenChange={setIsManualReviewConfirmDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Manual Valuation</AlertDialogTitle>
                <AlertDialogDescription>
                    Only 3 manual valuations per artwork are free. After that, a small fee will be charged. Are you sure you want to proceed?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRequestManualValuation}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isManualReviewDialogOpen} onOpenChange={setIsManualReviewDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                    <motion.div variants={iconVariants} initial="hidden" animate="visible"><AlertTriangle className="text-destructive"/></motion.div> Manual Review Required</DialogTitle>
                  <DialogDescription>
                      Our AI has flagged this artwork for potential authenticity issues during re-evaluation.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="font-semibold">Reason:</p>
                <p className="text-muted-foreground">{manualReviewDetails.concern}</p>
                <p className="mt-4">You can submit this artwork for manual review by our team, or cancel and make changes.</p>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={handleCancelManualCheck}>Cancel</Button>
                  <Button onClick={handleSendForManualCheck}>Send for Manual Check</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    
      <div className="container py-12 flex justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className="font-headline text-3xl">Edit Artwork</CardTitle>
              <Button variant="ghost" asChild>
                  <Link href="/portfolio" className="flex items-center">
                      <motion.div variants={iconVariants} initial="hidden" animate="visible" className="mr-2"><ArrowLeft className="h-4 w-4" /></motion.div>
                      Back to Portfolio
                  </Link>
              </Button>
            </div>
            <CardDescription>
              Update artwork details. You can save simple text changes or trigger a full re-evaluation.
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
                      <motion.div variants={iconVariants} initial="hidden" animate="visible"><Wand2 className="h-4 w-4" /></motion.div>
                      <AlertTitle>Re-evaluation Complete!</AlertTitle>
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
                              <p className="text-3xl font-bold">₹{(form.getValues('minEstimatedValue') || 0).toLocaleString('en-IN')} - ₹{(form.getValues('maxEstimatedValue') || 0).toLocaleString('en-IN')}</p>
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
                              <p className="text-3xl font-bold text-primary">₹{evaluationResult.crestoxPriceRange[0].toLocaleString('en-IN')} - ₹{evaluationResult.crestoxPriceRange[1].toLocaleString('en-IN')}</p>
                          </CardContent>
                          <CardContent>
                              <Button size="lg" className="w-full" onClick={() => handlePriceChoice(true)} disabled={isSubmitting}>
                                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <motion.div variants={iconVariants} initial="hidden" animate="visible" className="mr-2"><Wand2 className="h-4 w-4" /></motion.div>}
                                  Accept Crestox Valuation
                              </Button>
                          </CardContent>
                      </Card>
                  </div>
                  <div className="text-center mt-4">
                      <p className="text-sm text-muted-foreground">
                          Not satisfied with the valuation?{' '}
                          <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setIsScorecardDialogOpen(true)}>
                              View Scorecard and Request Manual Review
                          </Button>
                      </p>
                  </div>
                </div>
            )}

            {!isEvaluating && !evaluationResult && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onReevaluateSubmit)} className="space-y-8">
                  
                  <FormItem>
                    <FormLabel>Artwork Images</FormLabel>
                    <RadioGroup
                        value={form.watch('heroImage')}
                        onValueChange={(value) => form.setValue("heroImage", value, { shouldDirty: true })}
                        className="flex flex-wrap justify-center gap-4 p-4 bg-muted/50 rounded-lg"
                    >
                        {artwork.images.map((img, index) => (
                            <div key={index} className="relative group">
                                <label htmlFor={`hero-image-${index}`}>
                                    <Image src={img} alt={`Artwork image ${index + 1}`} width={150} height={150} className={cn("rounded-md object-contain cursor-pointer border-4", form.watch('heroImage') === img ? "border-primary" : "border-transparent" )} />
                                    <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/50 text-white p-1 rounded-full text-xs">
                                      <RadioGroupItem value={img} id={`hero-image-${index}`} className="h-5 w-5 border-white text-white"/>
                                        <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}><Star className="h-4 w-4"/></motion.div> Hero
                                    </div>
                                </label>
                            </div>
                        ))}
                    </RadioGroup>
                  </FormItem>


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
                    
                    <Card className="bg-muted/50 p-6">
                      <h3 className="text-lg font-semibold mb-2">Re-evaluation Details</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                          To get a new AI Grade and valuation, please fill out these fields and click "Re-evaluate Artwork". For simple text edits, use "Save Changes".
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                          control={form.control}
                          name="minEstimatedValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Minimum Estimated Value (₹)</FormLabel>
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
                              <FormLabel>Your Maximum Estimated Value (₹)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="1000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Card>
                    
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
                  <div className="flex items-center gap-4">
                    <Button type="button" size="lg" variant="secondary" onClick={handleSimpleSave} disabled={isSubmitting || !form.formState.isDirty}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <motion.div variants={iconVariants} initial="hidden" animate="visible" className="mr-2"><Save className="h-4 w-4" /></motion.div>
                      Save Changes
                    </Button>
                    <Button type="submit" size="lg">
                      <motion.div variants={iconVariants} initial="hidden" animate="visible" className="mr-2"><Wand2 className="h-4 w-4" /></motion.div>
                      Re-evaluate Artwork
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
