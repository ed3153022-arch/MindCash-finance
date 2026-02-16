import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import TrialAlert from "@/components/TrialAlert";
import VerdictButton from "@/components/VerdictButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MindCash Finance",
  description:
    "Controle financeiro inteligente com foco em consciência, veredito mensal e tomada de decisão.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <Script src="/lasy-bridge.js" strategy="beforeInteractive" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white`}
      >
        <TrialAlert />
        <VerdictButton />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
