'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  Menu,
  X,
  LayoutDashboard,
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
}

const privateNavItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    requiresAuth: true,
  },
  {
    href: '/dashboard/settings',
    label: 'Configurações',
    icon: Settings,
    requiresAuth: true,
  },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const navItems = user ? privateNavItems : [];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-black/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* 🔥 LOGO MINDCASH */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-400 flex items-center justify-center shadow-md">
              <span className="text-black font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-xl text-yellow-500 tracking-wide">
              MindCash
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-yellow-500 text-black"
                      : "text-gray-400 hover:text-white hover:bg-neutral-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* DESKTOP USER AREA */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="h-9 w-20 bg-neutral-800 animate-pulse rounded-md" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-neutral-900 px-3 py-1.5 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-black" />
                  </div>
                  <span className="text-sm text-gray-300 font-medium">
                    {user.email?.split('@')[0]}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-400 hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : null}
          </div>

          {/* MOBILE MENU BUTTON */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-300"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>

        {/* MOBILE NAV */}
        {isOpen && user && (
          <div className="md:hidden border-t border-neutral-800 py-4">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-yellow-500 text-black"
                        : "text-gray-400 hover:text-white hover:bg-neutral-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="border-t border-neutral-800 pt-4 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full justify-start text-gray-400 hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
