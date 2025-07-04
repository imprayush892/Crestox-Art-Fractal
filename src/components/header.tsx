'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, User, X, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const getPublicUrl = (path: string) => {
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
        return 'https://placehold.co/56x56.png';
    }
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
}
const monogramUrl = getPublicUrl('public/assets/crestox-monogram.png');

export function Header() {
  const { user, isLoggedIn, logout, artistProfile, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const navLinks = [
    { href: '/explore', label: 'Explore' },
    { href: '/suggestions', label: 'AI Curator' },
  ];

  const loggedInCollectorLinks = [
    { href: '/collection', label: 'My Collection' },
  ];
  
  const loggedInArtistLinks = [
      { href: '/portfolio', label: 'My Portfolio' },
  ];

  const handleLogout = async () => {
    await logout();
    closeMenu();
    router.push('/');
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center gap-2">
          <Image src={monogramUrl} alt="Crestox Logo" width={56} height={56} className="h-10 w-10 md:h-14 md:w-14" data-ai-hint="logo monogram" />
        </Link>
        <div className="hidden md:flex flex-1 items-center justify-between">
          <nav className="flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors text-foreground/60 hover:text-primary">
                {link.label}
              </Link>
            ))}
            {isLoggedIn && (
              <>
                {loggedInCollectorLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="transition-colors text-foreground/60 hover:text-primary">
                    {link.label}
                  </Link>
                ))}
                {loggedInArtistLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="transition-colors text-foreground/60 hover:text-primary">
                    {link.label}
                  </Link>
                ))}
              </>
            )}
             <Link href="/donate" className="transition-colors text-foreground/60 hover:text-primary">
                About Crestox
              </Link>
          </nav>
          <div className="flex items-center gap-4">
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin"/>
            ) : isLoggedIn && user ? (
              <>
                <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary"/>
                    <span className="font-semibold">{user.walletBalance.toLocaleString('en-IN')}</span>
                    <span className="text-sm text-muted-foreground">CreCoins</span>
                </div>
                <Button onClick={handleLogout} variant="secondary">Logout</Button>
                <Avatar>
                  <AvatarImage src={artistProfile?.avatar} alt="User" data-ai-hint="user avatar" />
                  <AvatarFallback><User className="w-4 h-4"/></AvatarFallback>
                </Avatar>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full">
              <SheetHeader className="sr-only">
                <SheetTitle>Mobile Menu</SheetTitle>
                <SheetDescription>Navigation links for the Crestox platform.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b p-4">
                    <Link href="/" onClick={closeMenu} className="flex items-center gap-2">
                      <Image src={monogramUrl} alt="Crestox Logo" width={56} height={56} className="h-10 w-10" data-ai-hint="logo monogram" />
                    </Link>
                    <SheetClose asChild>
                       <Button variant="ghost" size="icon">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close Menu</span>
                      </Button>
                    </SheetClose>
                </div>
                <nav className="flex flex-col gap-4 p-4">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={closeMenu} className="text-lg font-medium transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  ))}
                  {isLoggedIn && (
                    <>
                      {loggedInCollectorLinks.map((link) => (
                        <Link key={link.href} href={link.href} onClick={closeMenu} className="text-lg font-medium transition-colors hover:text-primary">
                          {link.label}
                        </Link>
                      ))}
                      {loggedInArtistLinks.map((link) => (
                        <Link key={link.href} href={link.href} onClick={closeMenu} className="text-lg font-medium transition-colors hover:text-primary">
                          {link.label}
                        </Link>
                      ))}
                    </>
                  )}
                  <Link href="/donate" onClick={closeMenu} className="text-lg font-medium transition-colors hover:text-primary">
                    About Crestox
                  </Link>
                </nav>
                <div className="mt-auto border-t p-4">
                 {isLoading ? (
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                 ) : isLoggedIn && user ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-lg font-medium">
                            <Wallet className="w-5 h-5"/>
                            <span>{user.walletBalance.toLocaleString('en-IN')} CreCoins</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                            <Avatar>
                              <AvatarImage src={artistProfile?.avatar} alt="User" data-ai-hint="user avatar" />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <span>{user.firstName} {user.lastName}</span>
                        </div>
                        <Button onClick={handleLogout} variant="secondary">Logout</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button asChild><Link href="/login" onClick={closeMenu}>Login</Link></Button>
                      <Button asChild><Link href="/signup" onClick={closeMenu}>Sign Up</Link></Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
