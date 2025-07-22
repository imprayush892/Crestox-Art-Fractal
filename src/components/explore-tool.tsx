
'use client';

import { useState, useMemo } from 'react';
import type { Fractal, Artist } from '@/lib/data';
import { FractalCard } from '@/components/fractal-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

const iconVariants = {
  hidden: { scale: 0.5, opacity: 0, rotate: -30 },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.1,
    },
  },
};

interface ExploreToolProps {
    fractals: Fractal[];
    artists: Artist[];
}

export function ExploreTool({ fractals, artists }: ExploreToolProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [artistFilter, setArtistFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('relevance');

  const artistsMap = useMemo(() => new Map(artists.map(a => [a.id, a])), [artists]);

  const filteredAndSortedFractals = useMemo(() => {
    let filtered = fractals.filter(f => f.status !== 'pending_review');

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(fractal =>
        fractal.title.toLowerCase().includes(lowercasedTerm) ||
        fractal.description.toLowerCase().includes(lowercasedTerm) ||
        artistsMap.get(fractal.artistId)?.name.toLowerCase().includes(lowercasedTerm)
      );
    }

    if (artistFilter !== 'all') {
      filtered = filtered.filter(fractal => fractal.artistId === artistFilter);
    }
    
    const sorted = [...filtered];

    switch (sortOrder) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
         sorted.sort((a, b) => {
            const dateA = new Date(a.priceHistory[0]?.date || 0).getTime();
            const dateB = new Date(b.priceHistory[0]?.date || 0).getTime();
            return dateB - dateA;
        });
        break;
      case 'relevance':
      default:
        // Do nothing, preserving the random order from props
        break;
    }

    return sorted;
  }, [searchTerm, artistFilter, sortOrder, artistsMap, fractals]);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-muted/50 rounded-lg border sticky top-16 z-40">
        <div className="relative flex-1">
          <motion.div variants={iconVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search className="h-5 w-5 text-muted-foreground" />
          </motion.div>
          <Input
            type="search"
            placeholder="Search by title, artist, or description..."
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <Select value={artistFilter} onValueChange={setArtistFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by Artist" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Artists</SelectItem>
              {artists.map(artist => (
                <SelectItem key={artist.id} value={artist.id}>
                  {artist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-8">
        {filteredAndSortedFractals.map((fractal) => {
          const artist = artistsMap.get(fractal.artistId);
          if (!artist) return null;
          return (
            <div key={fractal.id} className="break-inside-avoid mb-4 sm:mb-8">
              <FractalCard fractal={fractal} artist={artist} />
            </div>
          );
        })}
      </div>
    </>
  );
}
