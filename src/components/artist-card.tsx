
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Artist } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const availablePercentage = artist.totalEditions > 0 ? (artist.availableEditions / artist.totalEditions) * 100 : 0;

  return (
    <motion.div
      className="group h-full"
      whileHover={{ y: -5, scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="overflow-hidden h-full transition-all duration-300 shadow-md border-2 border-transparent group-hover:border-primary/20 group-hover:shadow-xl group-hover:shadow-primary/10 flex flex-col">
        <CardContent className="p-6 flex flex-col items-center text-center flex-grow">
          <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
            <AvatarImage src={artist.avatar} alt={artist.name} data-ai-hint="artist avatar" />
            <AvatarFallback className="text-3xl">{artist.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <h2 className="font-headline text-2xl font-bold">{artist.name}</h2>
          <p className="mt-2 text-muted-foreground text-sm line-clamp-3 flex-grow">{artist.bio}</p>
          
          <div className="w-full mt-6 text-left">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
              <span>Fractals Available</span>
              <span>{artist.availableEditions.toLocaleString()} / {artist.totalEditions.toLocaleString()}</span>
            </div>
            <Progress value={availablePercentage} className="h-2" />
          </div>

        </CardContent>
        <CardContent className="pt-0">
           <Button asChild variant="outline" className="w-full mt-2">
              <Link href={`/artist/${artist.id}`}>View Profile</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
