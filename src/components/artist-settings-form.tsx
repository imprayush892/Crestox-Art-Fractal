
'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
import { Loader2, User, PlusCircle, Trash2, Twitter, Instagram, Linkedin, Upload, Image as ImageIcon } from 'lucide-react';
import type { Artist } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card } from './ui/card';
import Image from 'next/image';

interface ArtistSettingsFormProps {
  artist: Artist;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50),
  bio: z.string().max(500, "Bio must be at most 500 characters.").min(10, "Bio must be at least 10 characters."),
  artistMessage: z.string().max(1000, "Message must be at most 1000 characters.").optional(),
  avatar: z.any().optional(),
  location: z.string().max(100).optional(),
  university: z.string().max(100).optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  style: z.string().max(100).optional(),
  awards: z.array(z.object({ 
      value: z.string().min(1, "Award cannot be empty."),
      image: z.any().optional()
  })),
  exhibitions: z.array(z.object({ 
      value: z.string().min(1, "Exhibition cannot be empty."),
      images: z.array(z.any()).max(2, "Maximum of 2 images per exhibition.").optional()
  })),
  twitter: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ArtistSettingsForm({ artist }: ArtistSettingsFormProps) {
  const { updateArtistProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(artist.avatar);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
  });
  
  useEffect(() => {
    form.reset({
      name: artist.name || "",
      bio: artist.bio || "",
      artistMessage: artist.artistMessage || "",
      avatar: artist.avatar || "",
      location: artist.location || "",
      university: artist.university || "",
      website: artist.website || "",
      style: artist.style || "",
      awards: artist.awards?.map(award => ({ value: award.value, image: award.image })) || [],
      exhibitions: artist.exhibitions?.map(ex => ({ value: ex.value, images: ex.images })) || [],
      twitter: artist.twitter || "",
      instagram: artist.instagram || "",
      linkedin: artist.linkedin || "",
    });
    setAvatarPreview(artist.avatar || null);
  }, [artist, form.reset]);

  const { fields: awardFields, append: appendAward, remove: removeAward } = useFieldArray({ control: form.control, name: "awards" });
  const { fields: exhibitionFields, append: appendExhibition, remove: removeExhibition } = useFieldArray({ control: form.control, name: "exhibitions" });

  async function onSubmit(data: ProfileFormValues) {
    if (!updateArtistProfile) {
        toast({ variant: 'destructive', title: 'Error', description: 'Update function not available.'});
        return;
    }
    setIsSubmitting(true);
    try {
      await updateArtistProfile(data);
      toast({
        title: "Profile Updated!",
        description: "Your changes have been saved successfully.",
      });
      form.reset(form.getValues()); // Resets the dirty state
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

  return (
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
                            <AvatarImage src={avatarPreview ?? undefined} alt={artist.name} data-ai-hint="artist avatar" />
                            <AvatarFallback><User className="w-10 h-10" /></AvatarFallback>
                        </Avatar>
                        <FormControl>
                            <Input
                                type="file"
                                className="hidden"
                                id="avatar-update-upload"
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
                         <Button type="button" variant="outline" onClick={() => document.getElementById('avatar-update-upload')?.click()}>
                            Change Image
                          </Button>
                    </div>
                    <FormDescription>
                        Update your public avatar. Use a square image (PNG/JPG, max 2MB) for best results.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Artist Name / Pseudonym</FormLabel><FormControl><Input placeholder="e.g., Aether Synthesis" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Artist Bio</FormLabel><FormControl><Textarea placeholder="Tell us a little bit about yourself and your art..." className="resize-y min-h-[120px]" {...field} /></FormControl><FormDescription>Share your story, your process, and what inspires you.</FormDescription><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="artistMessage" render={({ field }) => (<FormItem><FormLabel>Message to Your Collectors</FormLabel><FormControl><Textarea placeholder="Write a personal message that will be shared with people who collect your art..." className="resize-y min-h-[120px]" {...field} /></FormControl><FormDescription>This message is exclusive to your fractal holders and will appear on their Certificate of Holding.</FormDescription><FormMessage /></FormItem>)}/>

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
                                <div className="flex items-center gap-2">
                                  {form.watch(`awards.${index}.image`) && (
                                    <Image src={typeof form.watch(`awards.${index}.image`) === 'string' ? form.watch(`awards.${index}.image`) as string : URL.createObjectURL(form.watch(`awards.${index}.image`))} alt="preview" width={64} height={64} className="rounded-md object-cover h-16 w-16" />
                                  )}
                                  <FormField control={form.control} name={`awards.${index}.image`} render={({ field: { onChange, value, ...rest }}) => (
                                      <FormItem className="flex-grow">
                                        <FormControl>
                                          <Input type="file" className="text-xs" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                  )}/>
                                </div>
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
                                <div className="flex items-start gap-2">
                                  <div className="flex gap-2">
                                    {form.watch(`exhibitions.${index}.images`)?.map((img, imgIndex) => (
                                      <Image key={imgIndex} src={typeof img === 'string' ? img : URL.createObjectURL(img)} alt="preview" width={64} height={64} className="rounded-md object-cover h-16 w-16" />
                                    ))}
                                  </div>
                                  <FormField control={form.control} name={`exhibitions.${index}.images`} render={({ field: { onChange, value, ...rest } }) => (
                                    <FormItem className="flex-grow">
                                      <FormControl>
                                        <Input type="file" multiple className="text-xs" accept="image/*" onChange={(e) => onChange(Array.from(e.target.files || []).slice(0,2))} {...rest} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}/>
                                </div>
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
                <FormField control={form.control} name="twitter" render={({ field }) => ( <FormItem><div className="flex items-center gap-2"><Twitter className="h-5 w-5 text-muted-foreground" /><FormControl><Input placeholder="https://twitter.com/..." {...field} /></FormControl></div><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="instagram" render={({ field }) => (<FormItem><div className="flex items-center gap-2"><Instagram className="h-5 w-5 text-muted-foreground" /><FormControl><Input placeholder="https://instagram.com/..." {...field} /></FormControl></div><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="linkedin" render={({ field }) => (<FormItem><div className="flex items-center gap-2"><Linkedin className="h-5 w-5 text-muted-foreground" /><FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl></div><FormMessage /></FormItem>)}/>
            </div>
        </FormItem>

        <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Berlin, Germany" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="university" render={({ field }) => (<FormItem><FormLabel>University (Optional)</FormLabel><FormControl><Input placeholder="e.g., National Institute of Design" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Website / Portfolio Link</FormLabel><FormControl><Input placeholder="https://your-portfolio.com" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="style" render={({ field }) => (<FormItem><FormLabel>Artistic Style</FormLabel><FormControl><Input placeholder="e.g., Generative, Abstract, Algorithmic" {...field} /></FormControl><FormDescription> Comma-separated keywords describing your art. </FormDescription><FormMessage /></FormItem>)}/>

        <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
