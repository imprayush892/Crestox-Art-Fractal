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
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
  avatar: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ArtistSettingsForm({ artist }: ArtistSettingsFormProps) {
  const { updateArtistProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: artist.name || "",
      bio: artist.bio || "",
      avatar: artist.avatar || "",
    },
    mode: "onChange",
  });

  const avatarUrl = form.watch('avatar');

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
        avatar: data.avatar || 'https://placehold.co/100x100.png',
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
        <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl} alt={artist.name} data-ai-hint="artist avatar" />
                <AvatarFallback>{artist.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                <FormItem className="flex-1">
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                    <Input placeholder="https://example.com/avatar.png" {...field} />
                    </FormControl>
                    <FormDescription>
                    Update your public avatar. Use a square image for best results.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
