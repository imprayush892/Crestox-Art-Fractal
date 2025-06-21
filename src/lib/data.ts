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
  price: number;
  priceHistory: { date: string; price: number }[];
  totalEditions: number;
  availableEditions: number;
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
    aiHint: 'nebula space',
    price: 1500,
    totalEditions: 100,
    availableEditions: 82,
    priceHistory: [
      { date: '2023-01-15', price: 500 },
      { date: '2023-04-20', price: 750 },
      { date: '2023-08-01', price: 1200 },
      { date: '2024-01-10', price: 1500 },
    ]
  },
  {
    id: 'fractal-002',
    title: 'Crystalline Web',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-1',
    description: 'An intricate lattice of light that spiders across the canvas. It represents the interconnectedness of all things in a digital, geometric form.',
    aiHint: 'crystal lattice',
    price: 2200,
    totalEditions: 50,
    availableEditions: 34,
    priceHistory: [
      { date: '2023-02-10', price: 1000 },
      { date: '2023-06-15', price: 1500 },
      { date: '2023-11-25', price: 1800 },
      { date: '2024-02-18', price: 2200 },
    ]
  },
  {
    id: 'fractal-003',
    title: 'Solar Flare',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-2',
    description: 'A moment of intense energy erupting from a star, captured in fractal form. The colors are hot, the forms are wild and untamed.',
    aiHint: 'sun fire',
    price: 950,
    totalEditions: 200,
    availableEditions: 150,
    priceHistory: [
      { date: '2023-03-05', price: 300 },
      { date: '2023-07-12', price: 550 },
      { date: '2023-12-01', price: 800 },
      { date: '2024-03-01', price: 950 },
    ]
  },
  {
    id: 'fractal-004',
    title: 'Oceanic Depth',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-2',
    description: 'This piece plunges the viewer into the deep, mysterious blues of the ocean floor, revealing patterns that mimic bioluminescent creatures and coral reefs.',
    aiHint: 'deep ocean',
    price: 1800,
    totalEditions: 75,
    availableEditions: 61,
    priceHistory: [
      { date: '2023-01-25', price: 600 },
      { date: '2023-05-30', price: 900 },
      { date: '2023-10-10', price: 1400 },
      { date: '2024-02-20', price: 1800 },
    ]
  },
  {
    id: 'fractal-005',
    title: 'Veridian Maze',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-1',
    description: 'A complex, labyrinthine pattern in shades of green and gold. It evokes the feeling of being lost in an ancient, enchanted forest.',
    aiHint: 'green maze',
    price: 3100,
    totalEditions: 25,
    availableEditions: 11,
    priceHistory: [
      { date: '2023-04-01', price: 1500 },
      { date: '2023-08-11', price: 2000 },
      { date: '2023-12-19', price: 2600 },
      { date: '2024-03-15', price: 3100 },
    ]
  },
  {
    id: 'fractal-006',
    title: 'Axiom\'s Edge',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-2',
    description: 'Sharp, clean lines define this fractal, which explores the stark beauty of mathematical proofs and the certainty of axioms.',
    aiHint: 'geometric shapes',
    price: 700,
    totalEditions: 250,
    availableEditions: 243,
    priceHistory: [
      { date: '2023-02-01', price: 250 },
      { date: '2023-06-08', price: 400 },
      { date: '2023-10-14', price: 650 },
      { date: '2024-01-22', price: 700 },
    ]
  },
  {
    id: 'fractal-007',
    title: 'Digital Petal',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-1',
    description: 'A delicate, unfolding form that resembles the petal of a flower from another dimension. Soft pastels and gentle curves define this artwork.',
    aiHint: 'flower petal',
    price: 1100,
    totalEditions: 150,
    availableEditions: 101,
    priceHistory: [
      { date: '2023-03-20', price: 400 },
      { date: '2023-07-28', price: 600 },
      { date: '2023-11-05', price: 900 },
      { date: '2024-02-14', price: 1100 },
    ]
  },
  {
    id: 'fractal-008',
    title: 'Chaos Theory',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-2',
    description: 'A visual representation of the butterfly effect. Seemingly random swirls coalesce into a grand, unpredictable, but beautiful structure.',
    aiHint: 'abstract chaos',
    price: 4500,
    totalEditions: 10,
    availableEditions: 3,
    priceHistory: [
      { date: '2023-01-01', price: 2000 },
      { date: '2023-05-15', price: 2800 },
      { date: '2023-09-20', price: 3500 },
      { date: '2024-01-25', price: 4500 },
    ]
  },
  {
    id: 'fractal-009',
    title: 'Frozen Flame',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-1',
    description: 'Contrasting cool blues and fiery oranges battle for dominance in a pattern that is both icy and incandescent.',
    aiHint: 'fire ice',
    price: 1900,
    totalEditions: 80,
    availableEditions: 55,
    priceHistory: [
      { date: '2023-04-10', price: 800 },
      { date: '2023-08-18', price: 1100 },
      { date: '2023-12-28', price: 1600 },
      { date: '2024-03-21', price: 1900 },
    ]
  },
  {
    id: 'fractal-010',
    title: 'Nautilus Spiral',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-2',
    description: 'Inspired by the logarithmic spirals found in nature, this piece is a calming, hypnotic journey into a shell-like form.',
    aiHint: 'shell spiral',
    price: 850,
    totalEditions: 300,
    availableEditions: 210,
    priceHistory: [
      { date: '2023-02-15', price: 400 },
      { date: '2023-06-22', price: 550 },
      { date: '2023-11-01', price: 700 },
      { date: '2024-02-28', price: 850 },
    ]
  },
  {
    id: 'fractal-011',
    title: 'Ruby Matrix',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-1',
    description: 'A geometric landscape dominated by deep red hues, resembling a network of interconnected crystals.',
    aiHint: 'red crystal',
    price: 2500,
    totalEditions: 40,
    availableEditions: 19,
    priceHistory: [
      { date: '2023-03-12', price: 1200 },
      { date: '2023-07-19', price: 1600 },
      { date: '2023-11-29', price: 2100 },
      { date: '2024-03-08', price: 2500 },
    ]
  },
  {
    id: 'fractal-012',
    title: 'Celestial Mechanics',
    image: 'https://placehold.co/600x600.png',
    artistId: 'artist-2',
    description: 'This fractal maps the orbital paths of unknown planets and stars, creating a beautiful and complex astronomical chart.',
    aiHint: 'planets orbit',
    price: 3800,
    totalEditions: 15,
    availableEditions: 8,
    priceHistory: [
      { date: '2023-01-30', price: 1800 },
      { date: '2023-06-05', price: 2400 },
      { date: '2023-10-11', price: 3100 },
      { date: '2024-02-05', price: 3800 },
    ]
  }
];
