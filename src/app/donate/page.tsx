
import Image from 'next/image';
import { Wordmark } from '@/components/wordmark';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';

const foundersData = [
  {
    name: 'Prayush Shah',
    imagePath: 'founders/founder_prayush.jpeg',
    description: "A CEPT alum with a tech-savvy, entrepreneurial spirit, Prayush drives Crestox’s product vision. From crafting seamless user journeys to building robust digital tools, he’s the brains behind our platform’s innovation. With a deep passion for Indian art and its future, Prayush ensures every feature empowers artists and collectors alike.",
    contact: '9978902743',
    aiHint: 'man portrait',
  },
  {
    name: 'Udit Shah',
    imagePath: 'founders/founder_udit.jpeg',
    description: "A CEPT graduate, Udit brings a strong business pedigree rooted in his family’s ventures. He excels at forging partnerships, growing networks, and overseeing logistics. Udit’s knack for Indian art and culture fuels Crestox’s community building—connecting creators, collectors, and collaborators across the country.",
    contact: '9879608470',
    aiHint: 'man portrait',
  }
];

const getPublicUrl = (path: string) => {
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
        console.warn("Firebase Storage Bucket is not configured in environment variables. Falling back to placeholder.");
        return 'https://placehold.co/160x160.png';
    }
    // Manually construct the public URL. This only works for publicly readable files.
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
}

export default function DonatePage() {
  const founders = foundersData.map((founder) => ({
      ...founder,
      imageSrc: getPublicUrl(founder.imagePath)
  }));

  return (
    <div className="container mx-auto max-w-5xl py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">Meet the Founders</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          The team behind Crestox, dedicated to revolutionizing the art market.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {founders.map((founder) => (
          <Card key={founder.name} className="p-8">
            <div className="flex justify-center mb-6">
                <Image
                    src={founder.imageSrc}
                    alt={`Portrait of ${founder.name}`}
                    width={160}
                    height={160}
                    className="rounded-full object-cover aspect-square shadow-md border"
                    data-ai-hint={founder.aiHint}
                />
            </div>
            <h2 className="text-center font-headline text-2xl font-bold">{founder.name}</h2>
            <div className="mt-4 text-left">
              <p className="text-base text-foreground/80 leading-relaxed">
                {founder.description}
              </p>
              <p className="mt-4 font-semibold text-primary">
                Contact: {founder.contact}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Separator className="my-16" />

      <div className="text-center space-y-8">
        <p className="text-xs text-muted-foreground">
          G.S.T. Number: 24ATTPS1287M1ZT
        </p>
        <div className="flex justify-center">
            <Wordmark className="h-20 w-auto" />
        </div>
      </div>
    </div>
  );
}
