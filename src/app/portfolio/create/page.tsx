

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
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Artist name must be at least 2 characters.",
  }).max(50, {
    message: "Artist name must not be longer than 50 characters.",
  }),
  bio: z.string().max(500, {
    message: "Bio must not be longer than 500 characters."
  }).min(10, {
    message: "Bio must be at least 10 characters.",
  }),
  location: z.string().max(100).optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  style: z.string().max(100).optional(),
  awardsAndExhibitions: z.string().max(1000).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function CreateArtistProfilePage() {
  const { isLoggedIn, createArtistProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/portfolio/create');
    }
  }, [isLoggedIn, router]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      location: "",
      website: "",
      style: "",
      awardsAndExhibitions: "",
    },
    mode: "onChange",
  });

  async function onSubmit(data: ProfileFormValues) {
    if (!createArtistProfile) {
        toast({ variant: 'destructive', title: 'Error', description: 'Creation function not available.'});
        return;
    }
    setIsSubmitting(true);
    try {
      await createArtistProfile(data);
      toast({
        title: "Profile Created!",
        description: "Welcome to the Crestox artist community.",
      });
      router.push('/portfolio');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isLoggedIn) {
    return null; // or a loading skeleton
  }

  return (
    <div className="container py-12 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Create Your Artist Profile</CardTitle>
          <CardDescription>
            Tell the world about your unique artistic vision. You can edit this information later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist Name / Pseudonym</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Aether Synthesis" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your public display name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a little bit about yourself and your art..."
                        className="resize-y min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      Share your story, your process, and what inspires you.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="awardsAndExhibitions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Awards & Exhibitions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List any notable awards, exhibitions, or publications..."
                        className="resize-y min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This adds to your credibility and is factored into artwork evaluations.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Berlin, Germany" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website / Social Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-portfolio.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artistic Style</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Generative, Abstract, Algorithmic" {...field} />
                    </FormControl>
                     <FormDescription>
                      Comma-separated keywords describing your art.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Profile & Continue
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
