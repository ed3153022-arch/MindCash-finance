import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata = {
  title: "MindCash Finance",
  description: "Controle financeiro inteligente",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-black text-white">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
