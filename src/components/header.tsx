'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Logo } from './logo';

export function Header() {
  const { isLoggedIn, logout, artistProfile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const navLinks = [
    { href: '/explore', label: 'Explore Art' },
    { href: '/artists', label: 'Artists' },
    { href: '/suggestions', label: 'AI Curator' },
  ];

  const loggedInCollectorLinks = [
    { href: '/collection', label: 'My Collection' },
  ];
  
  const loggedInArtistLinks = [
      { href: '/portfolio', label: 'My Portfolio' },
  ];

  const handleLogout = () => {
    logout();
    closeMenu();
    router.push('/');
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center gap-2">
          <Logo className="h-14 w-14" />
          <span className="font-bold text-lg font-headline">Crestox</span>
        </Link>
        <div className="hidden md:flex flex-1 items-center justify-between">
          <nav className="flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground/80 text-foreground/60">
                {link.label}
              </Link>
            ))}
            {isLoggedIn && (
              <>
                {loggedInCollectorLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground/80 text-foreground/60">
                    {link.label}
                  </Link>
                ))}
                {loggedInArtistLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground/80 text-foreground/60">
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </nav>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
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
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b p-4">
                    <Link href="/" onClick={closeMenu} className="flex items-center gap-2">
                      <Logo className="h-14 w-14" />
                      <span className="font-bold font-headline">Crestox</span>
                    </Link>
                    <SheetTrigger asChild>
                       <Button variant="ghost" size="icon">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close Menu</span>
                      </Button>
                    </SheetTrigger>
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
                </nav>
                <div className="mt-auto border-t p-4">
                 {isLoggedIn ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 font-medium">
                            <Avatar>
                              <AvatarImage src={artistProfile?.avatar} alt="User" data-ai-hint="user avatar" />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <span>User Profile</span>
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
