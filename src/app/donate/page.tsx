
'use client';

import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Palette, Star, DollarSign, Search, TrendingUp, ArrowRightLeft,
    GalleryVertical, Users, Globe, LineChart, PieChart, Heart, Key
} from 'lucide-react';
import React from 'react';
import { storage } from '@/lib/firebase';

const getPublicUrl = (path: string) => {
    // This is the robust way. It gets the bucket from the initialized firebase app,
    // which avoids issues with environment variables not being set on the server.
    const storageBucket = storage.app.options.storageBucket;
    if (!storageBucket) {
        console.error("Firebase storage bucket is not configured. Images will not load.");
        // Return a path that will clearly fail, rather than a silent placeholder.
        return `https://placehold.co/160x160.png?text=Error:BucketMissing`;
    }
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
}

const foundersData = [
  {
    name: 'Prayush Shah',
    imageSrc: getPublicUrl('founders/founder_prayush.jpeg'),
    description: "A CEPT alum with a tech-savvy, entrepreneurial spirit, Prayush drives Crestox’s product vision. From crafting seamless user journeys to building robust digital tools, he’s the brains behind our platform’s innovation. With a deep passion for Indian art and its future, Prayush ensures every feature empowers artists and collectors alike.",
    contact: '9978902743',
    aiHint: 'man portrait',
  },
  {
    name: 'Udit Shah',
    imageSrc: getPublicUrl('founders/founder_udit.jpeg'),
    description: "A CEPT graduate, Udit brings a strong business pedigree rooted in his family’s ventures. He excels at forging partnerships, growing networks, and overseeing logistics. Udit’s knack for Indian art and culture fuels Crestox’s community building—connecting creators, collectors, and collaborators across the country.",
    contact: '9879608470',
    aiHint: 'man portrait',
  }
];

const TabContentWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`mt-6 w-full max-w-4xl mx-auto p-4 md:p-8 rounded-lg bg-card border ${className}`}>
        {children}
    </div>
);

const InfoCard = ({ icon: Icon, title, description, step }: { icon: React.ElementType, title: string, description: string, step?: number }) => (
    <div className="flex flex-col items-center p-4 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Icon className="w-10 h-10 text-primary" />
        </div>
        {step && (
            <p className="text-xs font-semibold bg-primary/10 text-primary rounded-full inline-block px-3 py-1 mb-2">Step {step}</p>
        )}
        <h3 className="font-bold text-xl">{title}</h3>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
    </div>
);

const WhatIsCrestoxDiagram = () => (
    <div className="w-full max-w-5xl mx-auto p-8 md:p-12 rounded-lg bg-card text-card-foreground border mt-6">
        <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold">What is Crestox?</h2>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
                A revolutionary platform democratizing art investment.
            </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
            <InfoCard 
                icon={GalleryVertical}
                title="Art Portfolio Tokenization"
                description="We transform an artist's entire body of work into a single, investable asset represented by digital tokens called 'Fractals'."
            />
             <InfoCard 
                icon={Users}
                title="Fractional Ownership"
                description="Investors can buy and sell Fractals, making it possible to own a piece of a valuable art portfolio without purchasing an entire artwork."
            />
             <InfoCard 
                icon={ArrowRightLeft}
                title="A Liquid Art Market"
                description="Our platform provides a dynamic secondary market for trading Fractals, unlocking the value of art and providing liquidity."
            />
        </div>
    </div>
);

const WhyCrestoxDiagram = () => {
    const artistBenefits = [
      {
        icon: DollarSign,
        title: 'Access Capital',
        description:
          'Raise funds based on your entire portfolio, not just single pieces, giving you the freedom to create.',
      },
      {
        icon: Globe,
        title: 'Global Reach',
        description:
          'Connect with a worldwide network of collectors and investors who believe in your long-term vision.',
      },
      {
        icon: LineChart,
        title: 'Market Validation',
        description:
          'Receive a data-driven valuation and build a track record in the art market, boosting your career.',
      },
    ];

    const investorBenefits = [
      {
        icon: PieChart,
        title: 'Diversify Your Portfolio',
        description:
          'Invest in a new, resilient asset class that has historically been inaccessible to most.',
      },
      {
        icon: Heart,
        title: 'Support Emerging Talent',
        description:
          'Become a patron of the arts by directly funding the careers of promising artists you believe in.',
      },
      {
        icon: Key,
        title: 'Unlock a Liquid Market',
        description:
          'Easily buy, sell, and trade your art investments on our secondary market, unlike traditional art.',
      },
    ];

    return (
        <div className="w-full max-w-5xl mx-auto p-8 md:p-12 rounded-lg bg-card text-card-foreground border mt-6">
            <div className="text-center mb-12">
                <h2 className="font-headline text-4xl font-bold">Why Crestox?</h2>
                <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
                    A win-win ecosystem for creators and collectors.
                </p>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <h3 className="font-headline text-2xl font-bold text-center">For Artists</h3>
                    {artistBenefits.map((benefit, index) => (
                        <InfoCard
                            key={index}
                            icon={benefit.icon}
                            title={benefit.title}
                            description={benefit.description}
                        />
                    ))}
                </div>
                <div className="space-y-8">
                    <h3 className="font-headline text-2xl font-bold text-center">For Investors</h3>
                    {investorBenefits.map((benefit, index) => (
                        <InfoCard
                            key={index}
                            icon={benefit.icon}
                            title={benefit.title}
                            description={benefit.description}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};


const HowItWorksDiagram = () => {
    const artistSteps = [
      {
        icon: Palette,
        title: 'List Artwork',
        description:
          'Upload your portfolio with high-quality images and detailed descriptions of your artistic journey.',
      },
      {
        icon: Star,
        title: 'Get Rated',
        description:
          'Our expert panel evaluates your work based on artistic potential, technique, and market trends.',
      },
      {
        icon: DollarSign,
        title: 'Raise Funds',
        description:
          'Once approved, investors can purchase shares in your portfolio, providing you with capital to grow.',
      },
    ];

    const investorSteps = [
      {
        icon: Search,
        title: 'Browse',
        description:
          'Explore hundreds of curated artist portfolios with expert ratings and performance data.',
      },
      {
        icon: TrendingUp,
        title: 'Invest',
        description:
          'Purchase shares starting at just $50 in portfolios that match your investment strategy.',
      },
      {
        icon: ArrowRightLeft,
        title: 'Trade Shares',
        description:
          'Buy and sell shares on our secondary market as portfolio values appreciate over time.',
      },
    ];

    return (
        <div className="w-full max-w-5xl mx-auto p-8 md:p-12 rounded-lg bg-card text-card-foreground border mt-6">
            <div className="text-center mb-12">
                <h2 className="font-headline text-4xl font-bold">How Crestox Works</h2>
                <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
                    A simple, transparent process that connects emerging artists with investors worldwide
                </p>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <h3 className="font-headline text-2xl font-bold text-center">For Artists</h3>
                    {artistSteps.map((step, index) => (
                        <InfoCard
                            key={index}
                            step={index + 1}
                            icon={step.icon}
                            title={step.title}
                            description={step.description}
                        />
                    ))}
                </div>
                <div className="space-y-8">
                    <h3 className="font-headline text-2xl font-bold text-center">For Investors</h3>
                    {investorSteps.map((step, index) => (
                        <InfoCard
                            key={index}
                            step={index + 1}
                            icon={step.icon}
                            title={step.title}
                            description={step.description}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};


export default function DonatePage() {
  return (
    <div className="container mx-auto max-w-6xl py-12 md:py-20">
        <div className="text-center mb-12">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">About Crestox</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                Learn more about our mission, our team, and our vision for the future of art.
            </p>
        </div>

        <Tabs defaultValue="what-why-how" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
                <TabsTrigger value="what-why-how">Crestox</TabsTrigger>
                <TabsTrigger value="partners">Founding Partners</TabsTrigger>
                <TabsTrigger value="advisory">Advisory Board</TabsTrigger>
                <TabsTrigger value="careers">Careers</TabsTrigger>
                <TabsTrigger value="legal">Tax & Legal</TabsTrigger>
            </TabsList>

            <TabsContent value="what-why-how">
              <div className="space-y-12">
                <WhatIsCrestoxDiagram />
                <WhyCrestoxDiagram />
                <HowItWorksDiagram />
              </div>
            </TabsContent>

            <TabsContent value="partners">
                 <TabContentWrapper>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        {foundersData.map((founder) => (
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
