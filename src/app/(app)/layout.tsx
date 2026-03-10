import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />
      
      {/* Ajuste de Margem: 
        px-6 no mobile garante que o card NUNCA encoste na beira.
        lg:px-20 no desktop dá o respiro de "App Premium".
      */}
      <main className="flex justify-center w-full px-6 lg:px-20 pt-6 pb-32">
        
        {/* Container Responsivo:
          max-w-[1100px]: Evita que os cards fiquem esticados demais em monitores grandes.
          md:grid-cols-2: Divide em 2 colunas apenas quando houver espaço real.
          gap-8: Aumentei o espaço entre cards para 32px para evitar a sensação de "aperto".
        */}
        <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {children}
        </div>
      </main>
    </div>
  );
}
