
import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/context/auth-context';
import { getInitialArtists, getInitialFractals } from '@/lib/server-data';
import { PageTransition } from '@/components/page-transition';
import { ThemeProvider } from '@/components/theme-provider';

const monogramUrl = 'https://firebasestorage.googleapis.com/v0/b/crestox-giok1.firebasestorage.app/o/public%2Fassets%2Fcrestox-monogram.png?alt=media';

export const metadata: Metadata = {
  title: 'Crestox - Digital Fractal Art Marketplace',
  description: 'Explore, collect, and trade unique AI-assisted fractal art.',
  icons: {
    icon: monogramUrl,
    shortcut: monogramUrl,
    apple: monogramUrl,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialArtists = await getInitialArtists();
  const initialFractals = await getInitialFractals();

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body text-foreground antialiased" suppressHydrationWarning>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <AuthProvider initialArtists={initialArtists} initialFractals={initialFractals}>
            <div className="flex min-h-screen flex-col bg-transparent">
              <Header />
              <main className="flex-1">
                <PageTransition>
                  {children}
                </PageTransition>
              </main>
              <Footer />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
