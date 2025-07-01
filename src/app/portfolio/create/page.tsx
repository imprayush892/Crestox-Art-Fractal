
'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { useEffect, useState, useRef } from 'react';
import { Loader2, PlusCircle, Trash2, Twitter, Instagram, Linkedin, User, Upload, Image as ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const profileFormSchema = z.object({
  name: z.string().min(2, "Artist name must be at least 2 characters.").max(50, "Artist name must not be longer than 50 characters."),
  bio: z.string().max(500, "Bio must not be longer than 500 characters.").min(10, "Bio must be at least 10 characters."),
  avatar: z.any().optional(),
  artistMessage: z.string().max(1000, "Message must be at most 1000 characters.").optional(),
  location: z.string().max(100).optional(),
  university: z.string().max(100).optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  style: z.string().max(100).optional(),
  awards: z.array(z.object({ 
      value: z.string().min(1, "Award cannot be empty."),
      image: z.any().optional()
        .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max file size is 2MB.`)
        .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), ".jpg, .jpeg, .png and .webp files are accepted.")
  })),
  exhibitions: z.array(z.object({ 
      value: z.string().min(1, "Exhibition cannot be empty."),
      images: z.array(z.any()).max(2, "Maximum of 2 images per exhibition.")
        .optional()
        .refine((files) => !files || files.every(file => file.size <= MAX_FILE_SIZE), `Max file size is 2MB.`)
        .refine((files) => !files || files.every(file => ACCEPTED_IMAGE_TYPES.includes(file.type)), ".jpg, .jpeg, .png and .webp files are accepted.")
  })),
  twitter: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function CreateArtistProfilePage() {
  const { user, isLoggedIn, createArtistProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user ? `${user.firstName} ${user.lastName}` : "",
      bio: "",
      artistMessage: "",
      location: "",
      university: "",
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
  
  const { fields: awardFields, append: appendAward, remove: removeAward } = useFieldArray({ control: form.control, name: "awards" });
  const { fields: exhibitionFields, append: appendExhibition, remove: removeExhibition } = useFieldArray({ control: form.control, name: "exhibitions" });

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/portfolio/create');
    }
  }, [isLoggedIn, router]);

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
      const typedError = error as Error;
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: typedError.message || "There was a problem with your request. Please try again.",
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
                  name="avatar"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Avatar</FormLabel>
                          <div className="flex items-center gap-6">
                              <Avatar className="w-24 h-24">
                                  <AvatarImage src={avatarPreview ?? undefined} alt="Avatar Preview" data-ai-hint="artist avatar" />
                                  <AvatarFallback><User className="w-10 h-10" /></AvatarFallback>
                              </Avatar>
                              <FormControl>
                                  <Input 
                                    type="file" 
                                    className="hidden" 
                                    id="avatar-upload"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        field.onChange(file);
                                        setAvatarPreview(URL.createObjectURL(file));
                                      }
                                    }}
                                    accept="image/png, image/jpeg"
                                  />
                              </FormControl>
                              <Button type="button" variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                Upload Image
                              </Button>
                          </div>
                          <FormDescription>
                              Choose a public avatar. Use a square image (PNG/JPG, max 2MB) for best results.
                          </FormDescription>
                          <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist Name / Pseudonym</FormLabel>
                    <FormControl><Input placeholder="e.g., Aether Synthesis" {...field} /></FormControl>
                    <FormDescription>This is your public display name.</FormDescription>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist Bio</FormLabel>
                    <FormControl><Textarea placeholder="Tell us a little bit about yourself and your art..." className="resize-y min-h-[120px]" {...field} /></FormControl>
                    <FormDescription>Share your story, your process, and what inspires you.</FormDescription>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="artistMessage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message to Your Collectors (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Write a personal message that will be shared with people who collect your art..." className="resize-y min-h-[120px]" {...field} /></FormControl>
                    <FormDescription>This message is exclusive to your fractal holders. It will be required before your first artwork can be collected.</FormDescription>
                    <FormMessage />
                  </FormItem>
              )}/>
              
              <FormItem>
                <FormLabel>Awards</FormLabel>
                <div className="space-y-4">
                  {awardFields.map((field, index) => (
                    <Card key={field.id} className="p-4 bg-muted/50">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-2">
                            <FormField control={form.control} name={`awards.${index}.value`} render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g., Digital Art Prize 2024" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name={`awards.${index}.image`} render={({ field: { onChange, value, ...rest }}) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="file" className="text-xs" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAward(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </Card>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendAward({ value: '' })}> <PlusCircle className="mr-2 h-4 w-4" /> Add Award </Button>
              </FormItem>

              <FormItem>
                <FormLabel>Exhibitions</FormLabel>
                <div className="space-y-4">
                  {exhibitionFields.map((field, index) => (
                    <Card key={field.id} className="p-4 bg-muted/50">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <FormField control={form.control} name={`exhibitions.${index}.value`} render={({ field }) => (
                            <FormItem><FormControl><Input placeholder="e.g., 'Future Visions' at Modern Gallery" {...field} /></FormControl><FormMessage /></FormItem>
                          )}/>
                          <FormField control={form.control} name={`exhibitions.${index}.images`} render={({ field: { onChange, value, ...rest } }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">Images (up to 2)</FormLabel>
                              <FormControl>
                                <Input type="file" multiple className="text-xs" accept="image/*" onChange={(e) => onChange(Array.from(e.target.files || []).slice(0,2))} {...rest} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}/>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeExhibition(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </Card>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendExhibition({ value: '', images: [] })}> <PlusCircle className="mr-2 h-4 w-4" /> Add Exhibition </Button>
              </FormItem>

              <FormItem>
                  <FormLabel>Social Links</FormLabel>
                   <div className="space-y-4">
                        <FormField control={form.control} name="twitter" render={({ field }) => (<FormItem><div className="flex items-center gap-2"><Twitter className="h-5 w-5 text-muted-foreground" /><FormControl><Input placeholder="https://twitter.com/..." {...field} /></FormControl></div><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="instagram" render={({ field }) => (<FormItem><div className="flex items-center gap-2"><Instagram className="h-5 w-5 text-muted-foreground" /><FormControl><Input placeholder="https://instagram.com/..." {...field} /></FormControl></div><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="linkedin" render={({ field }) => (<FormItem><div className="flex items-center gap-2"><Linkedin className="h-5 w-5 text-muted-foreground" /><FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl></div><FormMessage /></FormItem>)}/>
                    </div>
              </FormItem>

              <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Berlin, Germany" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="university" render={({ field }) => (<FormItem><FormLabel>University (Optional)</FormLabel><FormControl><Input placeholder="e.g., National Institute of Design" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Website / Portfolio Link</FormLabel><FormControl><Input placeholder="https://your-portfolio.com" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="style" render={({ field }) => (
                <FormItem>
                  <FormLabel>Artistic Style</FormLabel>
                  <FormControl><Input placeholder="e.g., Generative, Abstract, Algorithmic" {...field} /></FormControl>
                  <FormDescription>Comma-separated keywords describing your art.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}/>
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
