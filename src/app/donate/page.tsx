
import Image from 'next/image';
import { Wordmark } from '@/components/wordmark';
import { Separator } from '@/components/ui/separator';

const founders = [
  {
    name: 'Prayush Shah',
    imageSrc: '/founder_prayush.jpg',
    description: "A CEPT alum with a tech-savvy, entrepreneurial spirit, Prayush drives Crestox’s product vision. From crafting seamless user journeys to building robust digital tools, he’s the brains behind our platform’s innovation. With a deep passion for Indian art and its future, Prayush ensures every feature empowers artists and collectors alike.",
    contact: '9978902743',
    aiHint: 'man portrait',
  },
  {
    name: 'Udit Shah',
    imageSrc: '/founder_udit.jpg',
    description: "A CEPT graduate, Udit brings a strong business pedigree rooted in his family’s ventures. He excels at forging partnerships, growing networks, and overseeing logistics. Udit’s knack for Indian art and culture fuels Crestox’s community building—connecting creators, collectors, and collaborators across the country.",
    contact: '98796 08470',
    aiHint: 'man portrait',
  }
];

export default function DonatePage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">Meet the Founders</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          The team dedicated to democratizing art.
        </p>
      </div>

      <div className="space-y-16">
        {founders.map((founder) => (
          <div key={founder.name} className="grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-1">
              <Image
                src={founder.imageSrc}
                alt={`Portrait of ${founder.name}`}
                width={400}
                height={400}
                className="rounded-lg shadow-lg object-cover aspect-square"
                data-ai-hint={founder.aiHint}
              />
            </div>
            <div className="md:col-span-2 text-left">
              <h2 className="font-headline text-3xl font-bold">{founder.name}</h2>
              <p className="mt-4 text-base md:text-lg text-foreground/80 leading-relaxed">
                {founder.description}
              </p>
              <p className="mt-4 font-semibold text-primary">
                Contact: {founder.contact}
              </p>
            </div>
          </div>
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
