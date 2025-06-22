
'use client';

import { useForm, Controller } from 'react-hook-form';
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
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2, UploadCloud, X, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { evaluateArtwork } from '@/ai/flows/evaluate-artwork-flow';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const artworkFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(1000),
  estimatedValue: z.coerce.number().min(1, "Estimated value must be at least $1."),
  editionsToIssue: z.coerce.number().int().min(0, "Cannot issue negative editions.").default(0),
  image: z.any()
    .refine((file) => file, "Image is required.")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

type ArtworkFormValues = z.infer<typeof artworkFormSchema>;

export default function CreateArtworkPage() {
  const { isLoggedIn, artistProfile, addArtwork } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/portfolio/artwork/create');
    }
    if (isLoggedIn && !artistProfile) {
        router.push('/portfolio/create');
    }
  }, [isLoggedIn, artistProfile, router]);
  
  const form = useForm<ArtworkFormValues>({
    resolver: zodResolver(artworkFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      estimatedValue: 1000,
      editionsToIssue: 100,
      image: undefined,
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          form.setValue('image', file);
          const reader = new FileReader();
          reader.onloadend = () => {
              setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  async function onSubmit(data: ArtworkFormValues) {
    if (!addArtwork) {
        toast({ variant: 'destructive', title: 'Error', description: 'Creation function not available.'});
        return;
    }
    setIsSubmitting(true);
    
    try {
        const reader = new FileReader();
        reader.readAsDataURL(data.image);
        reader.onloadend = async () => {
            const imageDataUri = reader.result as string;

            // Step 1: Evaluate artwork
            toast({ title: "AI Evaluation In Progress...", description: "Our AI is analyzing your artwork. This may take a moment." });
            const evaluationResult = await evaluateArtwork({ photoDataUri: imageDataUri });

            // Step 2: Add artwork with evaluation results
            await addArtwork(
              { ...data, image: imageDataUri }, 
              evaluationResult.finalScore, 
              evaluationResult.grade
            );

            toast({
                title: "Artwork Added!",
                description: `"${data.title}" has been added to your portfolio with an AI grade of ${evaluationResult.grade}.`,
            });
            router.push('/portfolio');
        }
    } catch (error) {
        console.error("Error during artwork creation:", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem adding your artwork. Please try again.",
        });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (!isLoggedIn || !artistProfile) {
    return null; // or a loading skeleton
  }

  return (
    <div className="container py-12 flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Add New Artwork</CardTitle>
          <CardDescription>
            Upload a new artwork. This will be added to your public portfolio and will be evaluated by our AI to provide a quality grade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artwork File</FormLabel>
                    <FormControl>
                      <Controller
                        name="image"
                        control={form.control}
                        render={({ field: { onChange, value, ...rest } }) => (
                          <>
                           <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors">
                              {imagePreview ? (
                                <div className="relative w-full h-full">
                                    <Image src={imagePreview} alt="Preview" fill style={{ objectFit: 'contain' }} />
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 z-10 h-8 w-8" onClick={() => { form.setValue('image', null); setImagePreview(null); }}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                  <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                  <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP (MAX. 5MB)</p>
                                </div>
                              )}
                              <input id="dropzone-file" type="file" className="hidden" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" />
                           </label>
                          </>
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormLabel>Description</FormLabel>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="estimatedValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Value ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1000" {...field} />
                      </FormControl>
                      <FormDescription>
                        The value this piece adds to your portfolio.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="editionsToIssue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Portfolio Fractals to Issue</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormDescription>
                        New 'fractals' to add to your total supply.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Evaluating & Adding...' : 'Add Artwork to Portfolio'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
