

export interface Artist {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  fractalPrice: number;
  priceHistory: { date: string; price: number }[];
  totalEditions: number;
  availableEditions: number;
}

export interface Fractal {
  id: string;
  title: string;
  image: string;
  artistId: string;
  description: string;
  aiHint: string;
  width: number;
  height: number;
  price: number;
  priceHistory: { date: string; price: number }[];
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

const fractalAdjectives = ['Quantum', 'Cosmic', 'Galactic', 'Ephemeral', 'Crystalline', 'Solar', 'Veridian', 'Abyssal', 'Axiomatic', 'Digital', 'Chromatic', 'Ethereal', 'Chaotic', 'Frozen', 'Celestial', 'Prismatic', 'Lucid', 'Obsidian', 'Golden', 'Silent', 'Pulsing', 'Nebulous', 'Luminous', 'Woven', 'Glimmering'];
const fractalNouns = ['Bloom', 'Web', 'Flare', 'Depth', 'Maze', 'Edge', 'Petal', 'Theory', 'Flame', 'Spiral', 'Matrix', 'Mechanics', 'Echo', 'Dream', 'Cascade', 'Rift', 'Monolith', 'Serenity', 'Vortex', 'Symmetry', 'Tapestry', 'Equation', 'Nebula', 'Singularity', 'Horizon'];
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

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const generatePriceHistory = (initialPrice: number): { date: string; price: number }[] => {
    const history: { date: string; price: number }[] = [];
    let currentDate = new Date('2023-01-01');
    let currentPrice = initialPrice * (Math.random() * 0.4 + 0.3);

    for (let i = 0; i < 4; i++) {
        history.push({
            date: currentDate.toISOString().split('T')[0],
            price: Math.round(currentPrice),
        });
        currentDate.setMonth(currentDate.getMonth() + randomInt(2, 4));
        currentPrice *= (Math.random() * 0.5 + 1.1);
    }
     history.push({ date: new Date().toISOString().split('T')[0], price: initialPrice });
    return history;
}

const generateArtists = (count: number): Artist[] => {
  const allPossibleNames: string[] = [];
  firstNames.forEach(firstName => {
    lastNames.forEach(lastName => {
      allPossibleNames.push(`${firstName} ${lastName}`);
    });
  });

  const shuffledNames = shuffleArray(allPossibleNames);
  const selectedNames = shuffledNames.slice(0, count);

  return selectedNames.map((name, index) => {
    const fractalPrice = randomInt(5, 50) * 10; // Price per portfolio share
    const totalEditions = randomInt(1, 10) * 1000;
    return {
        id: `artist-${index + 1}`,
        name,
        avatar: 'https://placehold.co/100x100.png',
        bio: getRandom(bios),
        fractalPrice,
        priceHistory: generatePriceHistory(fractalPrice * 100), // simulate portfolio value history
        totalEditions,
        availableEditions: randomInt(100, totalEditions),
    }
  });
};

const generateFractals = (count: number, artists: Artist[]): Fractal[] => {
  const allPossibleTitles = new Set<string>();
  while (allPossibleTitles.size < count) {
      const title = `${getRandom(fractalAdjectives)} ${getRandom(fractalNouns)}`;
      allPossibleTitles.add(title);
  }

  const shuffledTitles = Array.from(allPossibleTitles);

  return shuffledTitles.map((title, index) => {
    const width = randomInt(5, 9) * 100;
    const height = randomInt(5, 9) * 100;
    const price = randomInt(5, 150) * 10;
    return {
        id: `fractal-${String(index + 1).padStart(3, '0')}`,
        title,
        image: `https://placehold.co/${width}x${height}.png`,
        artistId: getRandom(artists).id,
        description: getRandom(fractalDescriptions),
        aiHint: getRandom(aiHints),
        width,
        height,
        price,
        priceHistory: generatePriceHistory(price),
    };
  });
};

export const artists: Artist[] = generateArtists(20);
export const fractals: Fractal[] = generateFractals(500, artists);
