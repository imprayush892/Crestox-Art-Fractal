import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Artist } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="overflow-hidden h-full">
        <CardContent className="p-6 flex flex-col items-center text-center">
          <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
            <AvatarImage src={artist.avatar} alt={artist.name} data-ai-hint="artist avatar" />
            <AvatarFallback className="text-3xl">{artist.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <h2 className="font-headline text-2xl font-bold">{artist.name}</h2>
          <p className="mt-2 text-muted-foreground text-sm line-clamp-3 flex-grow">{artist.bio}</p>
          <Button asChild variant="outline" className="mt-6">
              <Link href={`/artist/${artist.id}`}>View Profile</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
