
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
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef } from 'react';
import { Loader2, User } from 'lucide-react';
import type { Artist } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface ArtistSettingsFormProps {
  artist: Artist;
}

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
  avatar: z.any().optional(),
  location: z.string().max(100).optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  style: z.string().max(100).optional(),
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
    defaultValues: {
      name: artist.name || "",
      bio: artist.bio || "",
      avatar: artist.avatar || "",
      location: artist.location || "",
      website: artist.website || "",
      style: artist.style || "",
    },
    mode: "onChange",
  });
  
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
        name: data.name,
        bio: data.bio,
        avatar: (data.avatar as string) || 'https://placehold.co/100x100.png',
        location: data.location,
        website: data.website,
        style: data.style,
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
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
