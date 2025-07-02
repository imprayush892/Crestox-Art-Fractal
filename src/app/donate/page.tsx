
'use client';

import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
}

const TabContentWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`mt-6 w-full max-w-4xl mx-auto p-4 md:p-8 rounded-lg bg-card border ${className}`}>
        {children}
    </div>
);

export default function DonatePage() {
  const founders = foundersData.map((founder) => ({
      ...founder,
      imageSrc: getPublicUrl(founder.imagePath)
  }));

  return (
    <div className="container mx-auto max-w-6xl py-12 md:py-20">
        <div className="text-center mb-12">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">About Crestox</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                Learn more about our mission, our team, and our vision for the future of art.
            </p>
        </div>

        <Tabs defaultValue="what-why-how" className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-5">
                <TabsTrigger value="what-why-how">Crestox</TabsTrigger>
                <TabsTrigger value="partners">Founding Partners</TabsTrigger>
                <TabsTrigger value="advisory">Advisory Board</TabsTrigger>
                <TabsTrigger value="careers">Careers</TabsTrigger>
                <TabsTrigger value="legal">Tax & Legal</TabsTrigger>
            </TabsList>

            <TabsContent value="what-why-how">
                <TabContentWrapper>
                    <h2 className="font-headline text-3xl font-bold mb-4">What, Why, and How</h2>
                    <div className="space-y-4 text-foreground/80">
                        <p><strong>What:</strong> Crestox is a pioneering platform designed to democratize the art market through fractional ownership and AI-powered valuation. We transform individual artworks into a portfolio of collectible "fractals," making high-value art accessible to everyone.</p>
                        <p><strong>Why:</strong> The traditional art world can be opaque and exclusive. We believe in transparency, accessibility, and empowering both artists and collectors. By breaking down barriers, we unlock new opportunities for investment, appreciation, and community building around art.</p>
                        <p><strong>How:</strong> Artists list their work on our platform, where it undergoes a rigorous evaluation by our proprietary AI to establish a fair market valuation and quality grade. This valuation determines the price of the artwork's fractals, which can then be bought, sold, and traded by collectors on our marketplace.</p>
                    </div>
                </TabContentWrapper>
            </TabsContent>

            <TabsContent value="partners">
                 <TabContentWrapper>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        {founders.map((founder) => (
                        <Card key={founder.name} className="p-8 shadow-none border-0">
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
                </TabContentWrapper>
            </TabsContent>

            <TabsContent value="advisory">
                <TabContentWrapper>
                    <h2 className="font-headline text-3xl font-bold mb-4">Advisory Board</h2>
                    <p className="text-muted-foreground">Our advisory board is composed of leading experts in art, finance, and technology. Their guidance ensures Crestox remains at the forefront of innovation while maintaining the highest standards of integrity. (Full board member details coming soon.)</p>
                </TabContentWrapper>
            </TabsContent>

            <TabsContent value="careers">
                <TabContentWrapper>
                    <h2 className="font-headline text-3xl font-bold mb-4">Careers</h2>
                    <p className="text-muted-foreground">Join us in revolutionizing the art world. We are always looking for passionate, talented individuals to join our team. If you are excited by our mission, please check back for future job openings.</p>
                </TabContentWrapper>
            </TabsContent>

            <TabsContent value="legal">
                <TabContentWrapper>
                    <h2 className="font-headline text-3xl font-bold mb-4">Tax & Legal</h2>
                     <div className="space-y-8">
                        <div className="text-center">
                            <p className="font-semibold text-foreground">G.S.T. Number</p>
                            <p className="text-lg text-muted-foreground font-mono mt-1">
                                24ATTPS1287M1ZT
                            </p>
                        </div>
                        <Separator />
                        <div className="flex justify-center">
                            <Image
                                src={getPublicUrl('public/assets/crestox-wordmark.png')}
                                alt="Crestox Wordmark"
                                width={564}
                                height={370}
                                className="h-20 w-auto"
                                data-ai-hint="company logo"
                            />
                        </div>
                    </div>
                </TabContentWrapper>
            </TabsContent>

        </Tabs>
    </div>
  );
}
