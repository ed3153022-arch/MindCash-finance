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
  LogOut,
  Sparkles,
  Zap,        // Ícone para Veredito
  TrendingUp  // Ícone para Investimentos
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
  isSpecial?: boolean; 
}

const privateNavItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    requiresAuth: true,
  },
  {
    href: '/ia',
    label: 'Cérebro',
    icon: Sparkles,
    requiresAuth: true,
    isSpecial: true,
  },
  {
    href: '/veredito', // Substituído Ajustes por Veredito
    label: 'Veredito',
    icon: Zap,
    requiresAuth: true,
  },
  {
    href: '/investimentos', // Nova rota adicionada
    label: 'Investir',
    icon: TrendingUp,
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
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex h-20 items-center justify-between">

          {/* LOGO MINDCASH */}
          <Link href="/dashboard" className="flex items-center space-x-2 active:scale-95 transition">
            <div className="h-9 w-9 rounded-xl bg-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.2)]">
              <span className="text-black font-black text-sm italic">M</span>
            </div>
            <span className="font-black text-xl text-white italic uppercase tracking-tighter">
              MindCash
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all",
                    item.isSpecial && !isActive ? "text-purple-400 border border-purple-500/30 bg-purple-500/5 shadow-[0_0_10px_rgba(168,85,247,0.1)]" : "",
                    isActive
                      ? "bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]"
                      : !item.isSpecial ? "text-zinc-500 hover:text-white hover:bg-white/5" : ""
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", item.isSpecial && "animate-pulse")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* DESKTOP USER AREA */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="h-9 w-20 bg-neutral-900 animate-pulse rounded-xl" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-zinc-600 hover:text-red-500 font-black uppercase text-[9px] tracking-widest transition-colors"
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
              className="md:hidden text-white bg-white/5 rounded-xl w-10 h-10"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>

        {/* MOBILE NAV */}
        {isOpen && user && (
          <div className="md:hidden border-t border-white/5 py-6 animate-in slide-in-from-top-2">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-5 py-4 rounded-[1.2rem] text-[11px] font-black uppercase italic tracking-widest transition-all",
                      isActive
                        ? "bg-yellow-400 text-black shadow-lg"
                        : item.isSpecial 
                          ? "bg-purple-500/10 border border-purple-500/20 text-purple-400" 
                          : "bg-white/5 text-zinc-400"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={cn("h-4 w-4", item.isSpecial && !isActive && "animate-pulse")} />
                      <span>{item.label}</span>
                    </div>
                    {isActive ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-black" />
                    ) : item.isSpecial && (
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                    )}
                  </Link>
                );
              })}

              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start px-5 py-6 text-zinc-600 font-black uppercase text-[10px] tracking-widest mt-4"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Encerrar Sessão
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
