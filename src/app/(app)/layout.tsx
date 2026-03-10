import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Adicionamos 'antialiased' para melhorar a leitura das fontes finas/itálicas
    <div className="min-h-screen bg-black text-white overflow-x-hidden flex flex-col antialiased">
      <Navbar />
      
      {/* 1. px-6 no mobile: Margem de segurança vital para não cortar texto nas bordas físicas do celular.
        2. lg:px-20 no desktop: Mantém o visual 'Premium' e centralizado.
        3. box-border: Garante que o padding seja contado dentro da largura total.
      */}
      <main className="flex-1 flex justify-center w-full px-6 lg:px-20 pt-6 pb-32 box-border">
        
        {/* - md:grid-cols-2: Agora que limpamos as páginas, isso vai dividir Atividade e Metas corretamente.
          - gap-8: Espaço generoso entre os cards (32px).
          - items-start: Evita que um card curto estique para ficar do tamanho do vizinho.
          - No grid, usamos 'w-full' e 'max-w' para segurar a largura em monitores gigantes.
        */}
        <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {children}
        </div>
      </main>
    </div>
  );
}
