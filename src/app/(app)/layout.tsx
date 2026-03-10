import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />
      
      {/* px-6: MARGEM DE SEGURANÇA NO CELULAR (Resolve o corte de palavras).
        lg:px-12: Margem no Desktop.
      */}
      <main className="flex justify-center w-full px-6 lg:px-12 pt-6 pb-32">
        
        {/* Usamos flex-col para que a página seja tratada como um bloco único.
          Isso impede que o layout "puxe" os elementos para as bordas.
        */}
        <div className="w-full max-w-[1100px] flex flex-col items-center">
          {children}
        </div>
      </main>
    </div>
  );
}
