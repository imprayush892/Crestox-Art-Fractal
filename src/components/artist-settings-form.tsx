
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
import { Loader2, User, PlusCircle, Trash2, Twitter, Instagram, Linkedin } from 'lucide-react';
import type { Artist } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card } from './ui/card';

interface ArtistSettingsFormProps {
  artist: Artist;
}

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50),
  bio: z.string().max(500, "Bio must be at most 500 characters.").min(10, "Bio must be at least 10 characters."),
  avatar: z.any().optional(),
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

export function ArtistSettingsForm({ artist }: ArtistSettingsFormProps) {
  const { updateArtistProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(artist.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
  });
  
  useEffect(() => {
    if (artist) {
      form.reset({
        name: artist.name || "",
        bio: artist.bio || "",
        avatar: artist.avatar || "",
        location: artist.location || "",
        website: artist.website || "",
        style: artist.style || "",
        awards: artist.awards?.map(value => ({ value })) || [],
        exhibitions: artist.exhibitions?.map(value => ({ value })) || [],
        twitter: artist.twitter || "",
        instagram: artist.instagram || "",
        linkedin: artist.linkedin || "",
      });
      setAvatarPreview(artist.avatar || null);
    }
  }, [artist, form.reset]);

  const { fields: awardFields, append: appendAward, remove: removeAward } = useFieldArray({ control: form.control, name: "awards" });
  const { fields: exhibitionFields, append: appendExhibition, remove: removeExhibition } = useFieldArray({ control: form.control, name: "exhibitions" });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setAvatarPreview(reader.result as string);
              form.setValue('avatar', reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!updateArtistProfile) {
        toast({ variant: 'destructive', title: 'Error', description: 'Update function not available.'});
        return;
    }
    setIsSubmitting(true);
    try {
      await updateArtistProfile({
        ...data,
        avatar: (data.avatar as string) || 'https://placehold.co/100x100.png',
        awards: data.awards.map(item => item.value),
        exhibitions: data.exhibitions.map(item => item.value),
      });
      toast({
        title: "Profile Updated!",
        description: "Your changes have been saved successfully.",
      });
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <FormField
            control={form.control}
            name="avatar"
            render={() => (
                <FormItem>
                    <FormLabel>Avatar</FormLabel>
                    <div className="flex items-center gap-6">
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={avatarPreview} alt={artist.name} data-ai-hint="artist avatar" />
                            <AvatarFallback><User className="w-10 h-10" /></AvatarFallback>
                        </Avatar>
                        <FormControl>
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                Upload Image
                            </Button>
                        </FormControl>
                        <Controller
                          name="avatar"
                          control={form.control}
                          render={() => (
                            <Input 
                              type="file" 
                              className="hidden" 
                              ref={fileInputRef} 
                              onChange={handleAvatarChange}
                              accept="image/png, image/jpeg"
                            />
                          )}
                        />
                    </div>
                    <FormDescription>
                        Update your public avatar. Use a square image (PNG/JPG) for best results.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artist Name / Pseudonym</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Aether Synthesis" {...field} />
              </FormControl>
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

        <FormItem>
            <FormLabel>Awards</FormLabel>
            <div className="space-y-2">
                {awardFields.map((field, index) => (
                    <Card key={field.id} className="p-3 flex items-center justify-between">
                        <FormField
                            control={form.control}
                            name={`awards.${index}.value`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl><Input placeholder="e.g., Digital Art Prize 2024" {...field} className="border-none shadow-none focus-visible:ring-0" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAward(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </Card>
                ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendAward({ value: '' })}> <PlusCircle className="mr-2 h-4 w-4" /> Add Award </Button>
        </FormItem>

        <FormItem>
            <FormLabel>Exhibitions</FormLabel>
            <div className="space-y-2">
                {exhibitionFields.map((field, index) => (
                    <Card key={field.id} className="p-3 flex items-center justify-between">
                        <FormField
                            control={form.control}
                            name={`exhibitions.${index}.value`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl><Input placeholder="e.g., 'Future Visions' at Modern Gallery" {...field} className="border-none shadow-none focus-visible:ring-0" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeExhibition(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </Card>
                ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendExhibition({ value: '' })}> <PlusCircle className="mr-2 h-4 w-4" /> Add Exhibition </Button>
        </FormItem>

        <FormItem>
          <FormLabel>Social Links</FormLabel>
            <div className="space-y-4">
                <FormField control={form.control} name="twitter" render={({ field }) => (
                    <FormItem><div className="flex items-center gap-2"><Twitter className="h-5 w-5 text-muted-foreground" /><FormControl><Input placeholder="https://twitter.com/..." {...field} /></FormControl></div><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="instagram" render={({ field }) => (
                    <FormItem><div className="flex items-center gap-2"><Instagram className="h-5 w-5 text-muted-foreground" /><FormControl><Input placeholder="https://instagram.com/..." {...field} /></FormControl></div><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="linkedin" render={({ field }) => (
                    <FormItem><div className="flex items-center gap-2"><Linkedin className="h-5 w-5 text-muted-foreground" /><FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl></div><FormMessage /></FormItem>
                )} />
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
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
