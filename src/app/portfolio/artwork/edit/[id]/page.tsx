
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Fractal } from '@/lib/data';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const editArtworkFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(1000),
});

type EditArtworkFormValues = z.infer<typeof editArtworkFormSchema>;

export default function EditArtworkPage() {
  const { isLoggedIn, artistProfile, fractals, updateArtworkDetails } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [artwork, setArtwork] = useState<Fractal | null>(null);

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
    if (fractals.length > 0 && artworkId) {
      const foundArtwork = fractals.find(f => f.id === artworkId);
      if (foundArtwork) {
        if (foundArtwork.artistId === artistProfile?.id) {
          setArtwork(foundArtwork);
          form.reset({
            title: foundArtwork.title,
            description: foundArtwork.description,
          });
        } else {
          // Artwork found but doesn't belong to this artist
          notFound();
        }
      }
    }
  }, [fractals, artworkId, artistProfile, form, notFound]);
  
  async function onSubmit(data: EditArtworkFormValues) {
    if (!updateArtworkDetails || !artworkId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Update function not available.'});
        return;
    }
    setIsSubmitting(true);
    try {
      await updateArtworkDetails(artworkId, data);
      toast({
        title: "Artwork Updated!",
        description: `"${data.title}" has been updated successfully.`,
      });
      router.push('/portfolio');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem updating your artwork. Please try again.",
      });
    } finally {
        setIsSubmitting(false);
    }
  }
  
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
          <CardTitle className="font-headline text-3xl">Edit Artwork</CardTitle>
          <CardDescription>
            Update the details for your artwork. Changes to valuation are not available here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-muted/50 p-4 rounded-lg">
             <Image
                src={artwork.image}
                alt={artwork.title}
                width={artwork.width}
                height={artwork.height}
                className="rounded-md object-cover w-full"
                data-ai-hint={artwork.aiHint}
              />
              <div className="space-y-4">
                  <div>
                      <Label className="text-sm font-medium text-muted-foreground">Current Valuation</Label>
                      <p className="text-2xl font-bold">${artwork.price.toLocaleString()}</p>
                  </div>
                   {artwork.aiGrade && (
                    <div>
                        <Label className="text-sm font-medium text-muted-foreground">AI Grade</Label>
                        <Badge variant="secondary" className="text-lg mt-1">{artwork.aiGrade}</Badge>
                    </div>
                  )}
                  <div>
                      <Label className="text-sm font-medium text-muted-foreground">Artist</Label>
                      <p className="text-lg font-semibold">{artistProfile?.name}</p>
                  </div>
              </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
              
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
