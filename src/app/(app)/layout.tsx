import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex justify-center w-full pt-6 pb-32">
        {/* REMOVI o padding do container pai e apliquei uma largura máxima 
           com 'w-[92%]' para garantir que nunca encoste no vidro do celular.
        */}
        <div className="w-[92%] md:w-[85%] max-w-[1100px] box-border">
          
          {/* O Grid agora trabalha dentro dessa área segura de 92%.
             O 'gap-y-6' garante o respiro entre os cards empilhados.
          */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 items-start">
            {children}
          </div>

        </div>
      </main>
    </div>
  );
}
