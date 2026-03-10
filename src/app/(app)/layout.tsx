import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden flex flex-col antialiased">
      <Navbar />
      
      {/* Ajuste Crucial: 
        1. Adicionamos 'w-full' e 'max-w-screen' para garantir que o container não estique além do limite.
        2. O 'px-6' e 'lg:px-20' agora são os ÚNICOS responsáveis pelo respiro das bordas.
      */}
      <main className="flex-1 w-full flex justify-center pt-6 pb-32">
        <div className="w-full px-6 lg:px-20 box-border flex justify-center">
          
          {/* Container de Conteúdo:
            Limitamos o max-w em 1200px para que no Desktop ele não fique colado,
            mas o 'gap-8' mantém o espaço entre os cards que você viu nos prints.
          */}
          <div className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {children}
          </div>

        </div>
      </main>
    </div>
  );
}
