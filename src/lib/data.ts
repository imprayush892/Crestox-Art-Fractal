export interface Artist {
  id: string;
  name: string;
  avatar: string;
  bio: string;
}

export interface Fractal {
  id: string;
  title: string;
  image: string;
  artistId: string;
  description: string;
  aiHint: string;
}

export const artists: Artist[] = [
  {
    id: 'artist-1',
    name: 'Helena Synthesis',
    avatar: 'https://placehold.co/100x100.png',
    bio: 'An algorithmic artist exploring the chaotic beauty of mathematical structures. Helena\'s work is a dance between order and randomness, creating digital tapestries that feel both alien and deeply familiar.',
  },
  {
    id: 'artist-2',
    name: 'Julian Recursion',
    avatar: 'https://placehold.co/100x100.png',
    bio: 'With a background in computer graphics and a passion for nature, Julian generates fractals that mimic organic forms. From galactic spirals to microscopic life, his art finds the universe in the equations.',
  },
];

export const fractals: Fractal[] = [
  {
    id: 'fractal-001',
    title: 'Galactic Bloom',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-1',
    description: 'A swirling nebula of color, where new universes seem to blossom from a central point of infinite density. This piece captures the explosive energy of creation.',
    aiHint: 'nebula space'
  },
  {
    id: 'fractal-002',
    title: 'Crystalline Web',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-1',
    description: 'An intricate lattice of light that spiders across the canvas. It represents the interconnectedness of all things in a digital, geometric form.',
    aiHint: 'crystal lattice'
  },
  {
    id: 'fractal-003',
    title: 'Solar Flare',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-2',
    description: 'A moment of intense energy erupting from a star, captured in fractal form. The colors are hot, the forms are wild and untamed.',
    aiHint: 'sun fire'
  },
  {
    id: 'fractal-004',
    title: 'Oceanic Depth',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-2',
    description: 'This piece plunges the viewer into the deep, mysterious blues of the ocean floor, revealing patterns that mimic bioluminescent creatures and coral reefs.',
    aiHint: 'deep ocean'
  },
  {
    id: 'fractal-005',
    title: 'Veridian Maze',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-1',
    description: 'A complex, labyrinthine pattern in shades of green and gold. It evokes the feeling of being lost in an ancient, enchanted forest.',
    aiHint: 'green maze'
  },
  {
    id: 'fractal-006',
    title: 'Axiom\'s Edge',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-2',
    description: 'Sharp, clean lines define this fractal, which explores the stark beauty of mathematical proofs and the certainty of axioms.',
    aiHint: 'geometric shapes'
  },
  {
    id: 'fractal-007',
    title: 'Digital Petal',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-1',
    description: 'A delicate, unfolding form that resembles the petal of a flower from another dimension. Soft pastels and gentle curves define this artwork.',
    aiHint: 'flower petal'
  },
  {
    id: 'fractal-008',
    title: 'Chaos Theory',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-2',
    description: 'A visual representation of the butterfly effect. Seemingly random swirls coalesce into a grand, unpredictable, but beautiful structure.',
    aiHint: 'abstract chaos'
  },
  {
    id: 'fractal-009',
    title: 'Frozen Flame',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-1',
    description: 'Contrasting cool blues and fiery oranges battle for dominance in a pattern that is both icy and incandescent.',
    aiHint: 'fire ice'
  },
  {
    id: 'fractal-010',
    title: 'Nautilus Spiral',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-2',
    description: 'Inspired by the logarithmic spirals found in nature, this piece is a calming, hypnotic journey into a shell-like form.',
    aiHint: 'shell spiral'
  },
  {
    id: 'fractal-011',
    title: 'Ruby Matrix',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-1',
    description: 'A geometric landscape dominated by deep red hues, resembling a network of interconnected crystals.',
    aiHint: 'red crystal'
  },
  {
    id: 'fractal-012',
    title: 'Celestial Mechanics',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-2',
    description: 'This fractal maps the orbital paths of unknown planets and stars, creating a beautiful and complex astronomical chart.',
    aiHint: 'planets orbit'
  }
];
