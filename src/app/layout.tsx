import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

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

function TrialAlert() {
  if (typeof window === "undefined") return null;

  const trialStart = localStorage.getItem("mindcash_trial_start");
  if (!trialStart) return null;

  const start = Number(trialStart);
  const now = Date.now();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const remaining = 7 - diffDays;

  if (remaining <= 0) {
    return (
      <div className="w-full bg-red-900/40 text-red-200 text-sm text-center py-2">
        Seu período gratuito terminou. Cadastre-se para continuar usando.
      </div>
    );
  }

  if (remaining <= 2) {
    return (
      <div className="w-full bg-yellow-900/40 text-yellow-200 text-sm text-center py-2">
        Faltam {remaining} dia(s) para o fim do acesso gratuito.
      </div>
    );
  }

  return null;
}

function VerdictButton() {
  return (
    <button
      className="fixed top-4 right-4 z-50 bg-white text-black text-sm px-4 py-2 rounded-full shadow-lg hover:scale-105 transition"
      onClick={() => (window.location.href = "/dashboard")}
    >
      Veredito
    </button>
  );
}

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
