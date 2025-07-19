
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, User, X, Wallet, Loader2, Shield, Bell } from 'lucide-react';
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
import { SafeImage as Image } from '@/components/ui/safe-image';
import { motion } from 'framer-motion';
import { ThemeToggle } from './theme-toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Notification, AdminNotification } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

const iconVariants = {
  hidden: { scale: 0.5, opacity: 0, rotate: -30 },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.1,
    },
  },
};

const getPublicUrl = (path: string) => {
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
        return 'https://placehold.co/56x56.png';
    }
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
}
const monogramUrl = getPublicUrl('public/assets/crestox-monogram.png');

const NotificationItem = ({ notification, onSelect }: { notification: Notification, onSelect: () => void }) => {
  return (
    <Link href={notification.relatedContent.url} className="block hover:bg-muted/50 p-3 rounded-md transition-colors" onClick={onSelect}>
        <div className="flex items-start gap-3">
            {!notification.read && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
            <div className={cn("flex-1", notification.read ? "pl-5" : "")}>
                <p className="text-sm font-medium">{notification.relatedContent.title}</p>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</p>
            </div>
        </div>
    </Link>
  );
};

const AdminNotificationItem = ({ notification, onMarkAsResolved }: { notification: AdminNotification, onMarkAsResolved: (id: string) => void }) => {
  return (
    <div className="p-3 rounded-md transition-colors">
        <div className="flex items-start gap-3">
            <div className="flex-1">
                <Link href={notification.relatedContent.url} className="block hover:bg-muted/50 -m-2 p-2 rounded-md">
                    <p className="text-sm font-medium">{notification.relatedContent.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</p>
                </Link>
                 <Button size="sm" variant="outline" className="mt-2" onClick={() => onMarkAsResolved(notification.id)}>
                    Mark as Resolved
                </Button>
            </div>
        </div>
    </div>
  );
};


export function Header() {
  const { 
      user, 
      isLoggedIn, 
      logout, 
      artistProfile, 
      isLoading, 
      isAdmin, 
      notifications, 
      markNotificationsAsRead,
      adminNotifications,
      markNotificationAsResolved,
  } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const router = useRouter();

  const hasUnread = notifications.some(n => !n.read);

  const navLinks = [
    { href: '/explore', label: 'Explore' },
    { href: '/suggestions', label: 'AI Curator' },
  ];
  
  const profileLink = { href: '/profile', label: 'My Profile' };

  const handleLogout = async () => {
    await logout();
    closeMenu();
    router.push('/');
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleNotificationsOpenChange = (open: boolean) => {
    setIsNotificationsOpen(open);
    if (open && hasUnread) {
        markNotificationsAsRead();
    }
  }

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
            {isLoggedIn && !isAdmin && (
              <Link href={profileLink.href} className="transition-colors text-foreground/60 hover:text-primary">
                {profileLink.label}
              </Link>
            )}
            {isAdmin && (
               <Link href="/explore" className="transition-colors text-primary font-semibold hover:text-primary/80 flex items-center gap-2">
                <Shield className="h-4 w-4" /> Admin Mode
              </Link>
            )}
             <Link href="/donate" className="transition-colors text-foreground/60 hover:text-primary">
                About Crestox
              </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
             {isLoggedIn && !isAdmin && (
                 <Popover open={isNotificationsOpen} onOpenChange={handleNotificationsOpenChange}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {hasUnread && <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-primary" />}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-2">
                        <div className="p-2">
                          <h3 className="font-medium">Notifications</h3>
                        </div>
                        <ScrollArea className="h-96">
                          {notifications.length > 0 ? (
                              notifications.map(n => <NotificationItem key={n.id} notification={n} onSelect={() => setIsNotificationsOpen(false)} />)
                          ) : (
                              <p className="text-sm text-muted-foreground p-4 text-center">No notifications yet.</p>
                          )}
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
             )}
            {isAdmin && (
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {adminNotifications.length > 0 && <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-primary" />}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-2">
                        <div className="p-2">
                          <h3 className="font-medium">Admin Notifications</h3>
                        </div>
                        <ScrollArea className="h-96">
                          {adminNotifications.length > 0 ? (
                              adminNotifications.map(n => <AdminNotificationItem key={n.id} notification={n} onMarkAsResolved={markNotificationAsResolved} />)
                          ) : (
                              <p className="text-sm text-muted-foreground p-4 text-center">No pending reviews.</p>
                          )}
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
             )}
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin"/>
            ) : isLoggedIn && user ? (
              <>
                {!isAdmin && (
                  <div className="flex items-center gap-2">
                      <motion.div variants={iconVariants} initial="hidden" animate="visible"><Wallet className="w-5 h-5 text-primary"/></motion.div>
                      <span className="font-semibold">{user.walletBalance.toLocaleString('en-IN')}</span>
                      <span className="text-sm text-muted-foreground">CreCoins</span>
                  </div>
                )}
                <Button onClick={handleLogout} variant="secondary">Logout</Button>
                <Avatar>
                  <AvatarImage src={artistProfile?.avatar} alt="User" data-ai-hint="user avatar" />
                  <AvatarFallback><motion.div variants={iconVariants} initial="hidden" animate="visible"><User className="w-4 h-4"/></motion.div></AvatarFallback>
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
          <ThemeToggle />
           {isLoggedIn && (
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {hasUnread && <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-primary" />}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-2">
                         <div className="p-2">
                          <h3 className="font-medium">Notifications</h3>
                        </div>
                        <ScrollArea className="h-96">
                          {notifications.length > 0 ? (
                              notifications.map(n => <NotificationItem key={n.id} notification={n} onSelect={() => {}} />)
                          ) : (
                              <p className="text-sm text-muted-foreground p-4 text-center">No notifications yet.</p>
                          )}
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
             )}
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
                  {isLoggedIn && !isAdmin && (
                    <Link href={profileLink.href} onClick={closeMenu} className="text-lg font-medium transition-colors hover:text-primary">
                      {profileLink.label}
                    </Link>
                  )}
                  {isAdmin && (
                     <Link href="/explore" onClick={closeMenu} className="text-lg font-medium transition-colors text-primary flex items-center gap-2">
                       <Shield className="h-5 w-5" /> Admin Mode
                    </Link>
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
                        {!isAdmin && (
                          <div className="flex items-center gap-2 text-lg font-medium">
                              <motion.div variants={iconVariants} initial="hidden" animate="visible"><Wallet className="w-5 w-5"/></motion.div>
                              <span>{user.walletBalance.toLocaleString('en-IN')} CreCoins</span>
                          </div>
                        )}
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
