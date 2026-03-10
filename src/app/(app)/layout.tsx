import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden flex flex-col">
      <Navbar />
      
      {/* CORREÇÃO: 
        1. px-6 garante que no mobile o card NUNCA encoste no vidro.
        2. lg:px-20 garante o respiro amplo em telas grandes.
        3. O flex e justify-center garantem que tudo fique no meio.
      */}
      <main className="flex-1 flex justify-center w-full pt-6 pb-32">
        <div className="w-full px-6 lg:px-20 flex flex-col items-center">
          
          {/* Container de Conteúdo:
            max-w-[1100px] segura a largura no desktop.
            grid-cols-1 md:grid-cols-2 permite as 2 colunas que você quer.
            gap-8 mantém a distância entre os cards.
          */}
          <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {children}
          </div>

        </div>
      </main>
    </div>
  );
}

