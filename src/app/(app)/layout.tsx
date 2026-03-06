import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Navbar fixa ou no topo */}
      <Navbar />
      
      {/* Container de respiro:
        px-6: Margem lateral no celular (para não colar no vidro)
        py-8: Margem superior e inferior
        max-w-6xl: Largura máxima para não esticar demais em tablets/PCs
        mx-auto: Centraliza tudo na tela
      */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-10 py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
