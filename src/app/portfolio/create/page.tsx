
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
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
import { Loader2, PlusCircle, Trash2, Twitter, Instagram, Linkedin } from 'lucide-react';

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
  artistMessage: z.string().min(20, "Message must be at least 20 characters.").max(1000, "Message must be at most 1000 characters."),
  location: z.string().max(100).optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  style: z.string().max(100).optional(),
  awards: z.array(z.object({ value: z.string().min(1, "Award cannot be empty.") })),
  exhibitions: z.array(z.object({ value: z.string().min(1, "Exhibition cannot be empty.") })),
  twitter: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
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
      artistMessage: "",
      location: "",
      website: "",
      style: "",
      awards: [],
      exhibitions: [],
      twitter: "",
      instagram: "",
      linkedin: "",
    },
    mode: "onChange",
  });

  const { fields: awardFields, append: appendAward, remove: removeAward } = useFieldArray({
    control: form.control,
    name: "awards"
  });

  const { fields: exhibitionFields, append: appendExhibition, remove: removeExhibition } = useFieldArray({
    control: form.control,
    name: "exhibitions"
  });

  async function onSubmit(data: ProfileFormValues) {
    if (!createArtistProfile) {
        toast({ variant: 'destructive', title: 'Error', description: 'Creation function not available.'});
        return;
    }
    setIsSubmitting(true);
    try {
      const profileData = {
          ...data,
          awards: data.awards.map(item => item.value),
          exhibitions: data.exhibitions.map(item => item.value),
      };
      await createArtistProfile(profileData);
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
                name="artistMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message to Your Collectors</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write a personal message that will be shared with people who collect your art..."
                        className="resize-y min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      This message is exclusive to your fractal holders and will appear on their Certificate of Holding.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormItem>
                <FormLabel>Awards</FormLabel>
                <div className="space-y-2">
                  {awardFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`awards.${index}.value`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="e.g., Digital Art Prize 2024" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <Button type="button" variant="ghost" size="icon" onClick={() => removeAward(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendAward({ value: '' })}> <PlusCircle className="mr-2 h-4 w-4" /> Add Award </Button>
              </FormItem>

              <FormItem>
                <FormLabel>Exhibitions</FormLabel>
                 <div className="space-y-2">
                  {exhibitionFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`exhibitions.${index}.value`}
                          render={({ field }) => (
                             <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="e.g., 'Future Visions' at Modern Gallery" {...field} />
                              </FormControl>
                               <FormMessage />
                            </FormItem>
                          )}
                        />
                         <Button type="button" variant="ghost" size="icon" onClick={() => removeExhibition(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendExhibition({ value: '' })}> <PlusCircle className="mr-2 h-4 w-4" /> Add Exhibition </Button>
              </FormItem>

              <FormItem>
                  <FormLabel>Social Links</FormLabel>
                   <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="twitter"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2">
                                        <Twitter className="h-5 w-5 text-muted-foreground" />
                                        <FormControl>
                                            <Input placeholder="https://twitter.com/..." {...field} />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="instagram"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2">
                                        <Instagram className="h-5 w-5 text-muted-foreground" />
                                        <FormControl>
                                            <Input placeholder="https://instagram.com/..." {...field} />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="linkedin"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2">
                                        <Linkedin className="h-5 w-5 text-muted-foreground" />
                                        <FormControl>
                                            <Input placeholder="https://linkedin.com/in/..." {...field} />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
              </FormItem>

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
                    <FormLabel>Website / Portfolio Link</FormLabel>
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
