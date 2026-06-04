"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" className="dark">
      <body className="bg-black antialiased selection:bg-yellow-500/30 overflow-x-hidden">
        <Navbar />
        
        {/* Layout responsivo: mantém o comportamento mobile compacto e expande para desktop.
            - Mobile (até lg): max-w-3xl com padding controlado
            - Desktop (lg+): expande para largura máxima permitindo futuras layouts em sidebar
            - O menu mobile permanece oculto (md:hidden) e desktop menu aparece (hidden md:flex)
        */}
        <main className="min-h-screen w-full max-w-3xl mx-auto lg:max-w-none lg:w-full px-4 sm:px-6 lg:px-8 pt-20 pb-10">
          {children}
        </main>
      </body>
    </html>
  );
}
