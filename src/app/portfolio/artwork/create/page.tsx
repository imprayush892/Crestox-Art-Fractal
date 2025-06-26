
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
import { useEffect, useState, useRef, useMemo } from 'react';
import { Loader2, UploadCloud, X, Wand2, ArrowRight, Star, Info } from 'lucide-react';
import Image from 'next/image';
import { evaluateArtwork, type EvaluationResult } from '@/ai/flows/evaluate-artwork-flow';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArtworkSize } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const artworkFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(1000),
  materials: z.string().min(3, "Please specify the materials used."),
  length: z.coerce.number().min(0.1, "Length is required."),
  breadth: z.coerce.number().min(0.1, "Breadth is required."),
  height: z.coerce.number().optional(),
  unit: z.enum(['in', 'cm', 'ft', 'px']),
  minEstimatedValue: z.coerce.number().min(1, "Minimum value must be at least ₹1."),
  maxEstimatedValue: z.coerce.number(),
  editionsToIssue: z.coerce.number().int().min(0, "Cannot issue negative editions.").default(0),
  images: z.array(z.any())
    .min(1, "At least one image is required.")
    .max(3, "You can upload a maximum of 3 images.")
    .refine((files) => files.every((file) => file?.size <= MAX_FILE_SIZE), `Max file size is 5MB.`)
    .refine(
      (files) => files.every((file) => ACCEPTED_IMAGE_TYPES.includes(file?.type)),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  heroImageIndex: z.coerce.number().min(0).max(2).default(0),
  subjectSignificance: z.string().max(500).optional(),
  personalSignificance: z.string().max(500).optional(),
  timeEffort: z.string().max(500).optional(),
  biographicalContext: z.string().max(500).optional(),
  commissionPatronage: z.string().max(500).optional(),
}).refine(data => data.maxEstimatedValue >= data.minEstimatedValue, {
  message: "Maximum value must be greater than or equal to minimum value.",
  path: ["maxEstimatedValue"],
});

type ArtworkFormValues = z.infer<typeof artworkFormSchema>;

type ArtworkSubmissionData = {
    evaluationResult: EvaluationResult;
    finalPrice: number;
    shouldApplyGrade: boolean;
};

export default function CreateArtworkPage() {
  const { isLoggedIn, artistProfile, addArtwork, updateArtistProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [artworkSubmissionData, setArtworkSubmissionData] = useState<ArtworkSubmissionData | null>(null);
  
  const form = useForm<ArtworkFormValues>({
    resolver: zodResolver(artworkFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      materials: "",
      length: 24,
      breadth: 36,
      unit: "in",
      minEstimatedValue: 100,
      maxEstimatedValue: 1000,
      editionsToIssue: 100,
      images: [],
      heroImageIndex: 0,
      subjectSignificance: "",
      personalSignificance: "",
      timeEffort: "",
      biographicalContext: "",
      commissionPatronage: "",
    }
  });
  
  const { editionsToIssue, minEstimatedValue, maxEstimatedValue } = form.watch();

  const estimatedFractalPrice = useMemo(() => {
    if (!artistProfile) return 0;

    const newArtworkValue = (minEstimatedValue && maxEstimatedValue) ? (minEstimatedValue + maxEstimatedValue) / 2 : 0;
    
    if (newArtworkValue <= 0 || !editionsToIssue || editionsToIssue <= 0) return 0;

    const currentPortfolioValue = artistProfile.totalPortfolioValueHistory?.slice(-1)[0]?.value ?? 0;
    const currentTotalEditions = artistProfile.totalEditions;

    const projectedPortfolioValue = currentPortfolioValue + newArtworkValue;
    const projectedTotalEditions = currentTotalEditions + editionsToIssue;

    if (projectedTotalEditions === 0) return 0;

    return projectedPortfolioValue / projectedTotalEditions;
  }, [editionsToIssue, minEstimatedValue, maxEstimatedValue, artistProfile]);
  
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

  const onFormSubmit = async (data: ArtworkFormValues) => {
    if (!artistProfile) return;
    setIsEvaluating(true);

    const fileToDataUrl = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    };

    try {
      const heroImageDataUri = await fileToDataUrl(data.images[data.heroImageIndex]);

      let artworkSizeString = `${data.length} x ${data.breadth}`;
      if (data.height) {
        artworkSizeString += ` x ${data.height}`;
      }
      artworkSizeString += ` ${data.unit}`;

      const evaluationInput = {
        photoDataUri: heroImageDataUri,
        title: data.title,
        description: data.description,
        materials: data.materials,
        artworkSize: artworkSizeString,
        minEstimatedValue: data.minEstimatedValue,
        maxEstimatedValue: data.maxEstimatedValue,
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
      setEvaluationResult(result);
    } catch (error) {
      console.error("Error during artwork evaluation:", error);
      toast({
        variant: "destructive",
        title: "Evaluation Failed",
        description: "There was a problem with the evaluation service. Please try again.",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const finalizeArtworkSubmission = async (submissionData: ArtworkSubmissionData, wasSkipped: boolean) => {
    if (!addArtwork || !artistProfile) return;
    setIsSubmitting(true);
    setArtworkSubmissionData(null); // Clear the temporary data

    const { evaluationResult, finalPrice, shouldApplyGrade } = submissionData;
    const formData = form.getValues();

    try {
      const artworkSize: ArtworkSize = { length: formData.length, breadth: formData.breadth, unit: formData.unit };
      if (formData.height) artworkSize.height = formData.height;

      const newArtworkData = {
        title: formData.title,
        description: formData.description,
        materials: formData.materials,
        artworkSize,
        minEstimatedValue: formData.minEstimatedValue,
        maxEstimatedValue: formData.maxEstimatedValue,
        editionsToIssue: formData.editionsToIssue,
        images: imagePreviews,
        heroImage: imagePreviews[formData.heroImageIndex],
        subjectSignificance: formData.subjectSignificance,
        personalSignificance: formData.personalSignificance,
        timeEffort: formData.timeEffort,
        biographicalContext: formData.biographicalContext,
        commissionPatronage: formData.commissionPatronage,
      };

      await addArtwork(newArtworkData, evaluationResult, finalPrice, shouldApplyGrade);
      
      toast({
        title: "Artwork Added!",
        description: `"${formData.title}" has been added to your portfolio.`,
      });

      if (wasSkipped) {
        toast({
            title: "Action Required",
            description: "Add a 'Message to Collectors' in your profile settings to make your artwork collectible.",
            duration: 8000,
        });
      }

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

  const handlePriceChoice = async (useCrestoxPrice: boolean) => {
    if (!evaluationResult || !artistProfile) return;

    const crestoxPrice = Math.round((evaluationResult.crestoxPriceRange[0] + evaluationResult.crestoxPriceRange[1]) / 2);
    const artistPrice = Math.round((form.getValues().minEstimatedValue + form.getValues().maxEstimatedValue) / 2);
    const finalPrice = useCrestoxPrice ? crestoxPrice : artistPrice;
    const shouldApplyGrade = useCrestoxPrice || artistPrice <= crestoxPrice;
    
    const submissionData: ArtworkSubmissionData = { evaluationResult, finalPrice, shouldApplyGrade };

    if (!artistProfile.artistMessage) {
      setArtworkSubmissionData(submissionData);
      setIsMessageDialogOpen(true);
    } else {
      await finalizeArtworkSubmission(submissionData, false);
    }
  };

  const handleSaveMessageAndSubmit = async () => {
    if (!updateArtistProfile || !artworkSubmissionData || !newMessage) return;
    if (newMessage.trim().length < 10) {
      toast({ variant: 'destructive', title: 'Message is too short', description: 'Please write a message of at least 10 characters.' });
      return;
    }
    setIsMessageDialogOpen(false);
    await updateArtistProfile({ artistMessage: newMessage });
    await finalizeArtworkSubmission(artworkSubmissionData, false);
  };
  
  const handleSkipMessage = async () => {
    if (!artworkSubmissionData) return;
    setIsMessageDialogOpen(false);
    await finalizeArtworkSubmission(artworkSubmissionData, true);
  };
  
  if (!isLoggedIn || !artistProfile) {
    return null;
  }

  return (
    <>
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl">A Message for Your Collectors</DialogTitle>
                <DialogDescription>
                    This message will be included on the Certificate of Holding for anyone who collects your work. It's required to make your art collectible.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Textarea 
                    placeholder="Write a personal message to the future owners of your art..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[150px]"
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={handleSkipMessage}>Skip for Now</Button>
                <Button onClick={handleSaveMessageAndSubmit} disabled={!newMessage.trim() || isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Save and Continue
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="container py-12 flex justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Add New Artwork</CardTitle>
            <CardDescription>
              Upload a new artwork. This will be added to your public portfolio and will be evaluated by our AI assistant to provide a quality grade and price suggestion.
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
                              <p className="text-3xl font-bold">₹{form.getValues('minEstimatedValue').toLocaleString('en-IN')} - ₹{form.getValues('maxEstimatedValue').toLocaleString('en-IN')}</p>
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
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artwork Files (up to 3)</FormLabel>
                        <FormControl>
                          <div
                            className="flex flex-col items-center justify-center w-full min-h-64 p-4 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {imagePreviews.length > 0 ? (
                                <RadioGroup
                                    defaultValue={form.getValues("heroImageIndex").toString()}
                                    onValueChange={(value) => form.setValue("heroImageIndex", parseInt(value))}
                                    className="flex flex-wrap justify-center gap-4"
                                    onClick={(e) => {
                                      // Stop the click from propagating to the parent div which triggers file upload.
                                      e.stopPropagation();
                                    }}
                                >
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <label htmlFor={`hero-image-${index}`}>
                                                <Image src={preview} alt={`Preview ${index + 1}`} width={150} height={150} className={cn("rounded-md object-contain cursor-pointer border-4", form.watch('heroImageIndex') === index ? "border-primary" : "border-transparent" )} />
                                                <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/50 text-white p-1 rounded-full text-xs">
                                                   <RadioGroupItem value={index.toString()} id={`hero-image-${index}`} className="h-5 w-5 border-white text-white"/>
                                                    <Star className="h-4 w-4"/> Hero
                                                </div>
                                            </label>
                                            <Button
                                              type="button"
                                              variant="destructive"
                                              size="icon"
                                              className="absolute top-2 right-2 z-10 h-6 w-6 opacity-50 group-hover:opacity-100"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const newPreviews = [...imagePreviews];
                                                newPreviews.splice(index, 1);
                                                setImagePreviews(newPreviews);
                                                
                                                const currentFiles = form.getValues('images');
                                                const newFiles = [...currentFiles];
                                                newFiles.splice(index, 1);
                                                form.setValue('images', newFiles, { shouldValidate: true });
                                                
                                                if (form.getValues('heroImageIndex') === index) {
                                                    form.setValue('heroImageIndex', 0);
                                                } else if (form.getValues('heroImageIndex') > index) {
                                                    form.setValue('heroImageIndex', form.getValues('heroImageIndex') - 1);
                                                }
                                              }}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </RadioGroup>
                            ) : (
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP (MAX. 5MB each)</p>
                              </div>
                            )}
                            <input
                              id="dropzone-file"
                              type="file"
                              multiple
                              className="hidden"
                              accept="image/png, image/jpeg, image/webp"
                              ref={fileInputRef}
                              onBlur={field.onBlur}
                              name={field.name}
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                const currentFiles = form.getValues("images") || [];
                                const combinedFiles = [...currentFiles, ...files].slice(0, 3);
                                
                                form.setValue("images", combinedFiles, { shouldValidate: true });

                                const previewPromises = combinedFiles.map(file => {
                                  return new Promise<string>((resolve) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result as string);
                                    reader.readAsDataURL(file);
                                  });
                                });

                                Promise.all(previewPromises).then(setImagePreviews);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


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
                            <FormLabel>Minimum Estimated Value (₹)</FormLabel>
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
                            <FormLabel>Maximum Estimated Value (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="1000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-end gap-4">
                        <FormField
                            control={form.control}
                            name="editionsToIssue"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                <FormLabel>New Portfolio Fractals to Issue</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="100" {...field} />
                                </FormControl>
                                <FormDescription> New 'fractals' to add to your total supply. </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="w-[200px] flex-shrink-0">
                            <Card className="bg-muted/50 p-3">
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" /> Est. Price Per Fractal</p>
                                <p className="font-bold text-lg text-primary">
                                    {estimatedFractalPrice > 0 ? `₹${estimatedFractalPrice.toFixed(2)}` : 'N/A'}
                                </p>
                            </Card>
                        </div>
                    </div>


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
                  <Button type="submit" size="lg" disabled={isEvaluating}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Evaluate Artwork
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
