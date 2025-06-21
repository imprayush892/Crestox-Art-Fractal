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
  width: number;
  height: number;
  priceHistory: { date: string; price: number }[];
  totalEditions: number;
  availableEditions: number;
}

// --- Data Generation ---

const firstNames = ['Aether', 'Lux', 'Helena', 'Julian', 'Orion', 'Celeste', 'Kai', 'Lyra', 'Jasper', 'Seraphina', 'Axel', 'Aurora', 'Ronan', 'Elara', 'Silas', 'Nova', 'Felix', 'Astrid', 'Leo', 'Iris'];
const lastNames = ['Synthesis', 'Recursion', 'Flux', 'Prism', 'Vector', 'Matrix', 'Quasar', 'Nebula', 'Byte', 'Pixel', 'Cipher', 'Genesis', 'Echo', 'Mirage', 'Vertex', 'Core', 'Node', 'Render', 'Shader', 'Mesh'];
const bios = [
  'An algorithmic artist exploring chaotic beauty in mathematical structures.',
  'Finds the universe in equations, mimicking organic forms from nature.',
  'A digital painter who uses code as a brush to create vibrant, abstract landscapes.',
  'Focuses on the interplay of light and shadow in generative art.',
  'Explores the geometry of nature through recursive algorithms.',
  'Creates mesmerizing patterns that evoke a sense of infinite complexity.',
  'A pioneer in AI-assisted art, collaborating with machines to create new forms.',
  'Blends traditional art principles with cutting-edge technology.',
  'Their work is a meditation on the nature of reality and perception.',
  'Specializes in creating immersive, large-scale digital installations.'
];

const fractalAdjectives = ['Quantum', 'Cosmic', 'Galactic', 'Ephemeral', 'Crystalline', 'Solar', 'Veridian', 'Abyssal', 'Axiomatic', 'Digital', 'Chromatic', 'Ethereal', 'Chaotic', 'Frozen', 'Celestial', 'Prismatic', 'Lucid', 'Obsidian', 'Golden', 'Silent'];
const fractalNouns = ['Bloom', 'Web', 'Flare', 'Depth', 'Maze', 'Edge', 'Petal', 'Theory', 'Flame', 'Spiral', 'Matrix', 'Mechanics', 'Echo', 'Dream', 'Cascade', 'Rift', 'Monolith', 'Serenity', 'Vortex', 'Symmetry'];
const fractalDescriptions = [
  'A swirling nebula of color, where new universes blossom from a central point.',
  'An intricate lattice of light that spiders across the canvas, connecting all things.',
  'A moment of intense energy erupting from a star, captured in fractal form.',
  'Plunges the viewer into the deep, mysterious blues of an alien ocean floor.',
  'A complex, labyrinthine pattern that evokes the feeling of a digital forest.',
  'Sharp, clean lines that explore the stark beauty of mathematical proofs.',
  'A delicate, unfolding form resembling a flower petal from another dimension.',
  'A visual representation of the butterfly effect, where chaos finds order.',
  'Contrasting cool and fiery hues battle for dominance in a pattern of beautiful conflict.',
  'A calming, hypnotic journey into a logarithmic form found throughout nature.',
  'A geometric landscape dominated by deep hues, resembling a network of crystals.',
  'This fractal maps the orbital paths of unknown planets, an astronomical chart of the imagination.',
  'The visual sound of a single moment, rippling outwards through spacetime.',
  'A piece that seems to shift and change, a lucid dream caught in digital amber.',
  'An endless waterfall of light and color, frozen in a single, breathtaking instant.'
];
const aiHints = [
  'nebula space', 'crystal lattice', 'sun fire', 'deep ocean', 'green maze', 'geometric shapes', 'flower petal', 'abstract chaos', 'fire ice', 'shell spiral', 'red crystal', 'planets orbit', 'sound wave', 'dreamy abstract', 'waterfall light'
];

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const generateArtists = (count: number): Artist[] => {
  const artists: Artist[] = [];
  const usedNames = new Set<string>();

  while (artists.length < count) {
    const name = `${getRandom(firstNames)} ${getRandom(lastNames)}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      artists.push({
        id: `artist-${artists.length + 1}`,
        name,
        avatar: 'https://placehold.co/100x100.png',
        bio: getRandom(bios),
      });
    }
  }
  return artists;
};

const generatePriceHistory = (initialPrice: number): { date: string; price: number }[] => {
    const history: { date: string; price: number }[] = [];
    let currentDate = new Date('2023-01-01');
    let currentPrice = initialPrice * (Math.random() * 0.4 + 0.3); // Start price between 30% and 70% of final price

    for (let i = 0; i < 4; i++) {
        history.push({
            date: currentDate.toISOString().split('T')[0],
            price: Math.round(currentPrice),
        });
        currentDate.setMonth(currentDate.getMonth() + randomInt(2, 4));
        currentPrice *= (Math.random() * 0.5 + 1.1); // Increase price by 10-60%
    }
     history.push({ date: new Date().toISOString().split('T')[0], price: initialPrice });
    return history;
}

const generateFractals = (count: number, artists: Artist[]): Fractal[] => {
  const fractals: Fractal[] = [];
  const usedTitles = new Set<string>();

  while (fractals.length < count) {
    const title = `${getRandom(fractalAdjectives)} ${getRandom(fractalNouns)}`;
    if (!usedTitles.has(title)) {
      usedTitles.add(title);
      const width = randomInt(5, 9) * 100;
      const height = randomInt(5, 9) * 100;
      const price = randomInt(5, 50) * 100;
      const totalEditions = randomInt(1, 10) * (randomInt(1,3) === 1 ? 1 : 10);
      fractals.push({
        id: `fractal-${String(fractals.length + 1).padStart(3, '0')}`,
        title,
        image: `https://placehold.co/${width}x${height}.png`,
        artistId: getRandom(artists).id,
        description: getRandom(fractalDescriptions),
        aiHint: getRandom(aiHints),
        price,
        width,
        height,
        priceHistory: generatePriceHistory(price),
        totalEditions,
        availableEditions: randomInt(1, totalEditions),
      });
    }
  }
  return fractals;
};

export const artists: Artist[] = generateArtists(20);
export const fractals: Fractal[] = generateFractals(500, artists);
