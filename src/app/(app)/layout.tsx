import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />
      
      {/* Mantivemos o seu px-6 e lg:px-20. 
        O segredo é o w-full e flex para garantir a centralização.
      */}
      <main className="flex justify-center w-full px-6 lg:px-20 pt-6 pb-32">
        
        <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Envolvemos o children em uma div com 'col-span-full'.
            Isso obriga o conteúdo da página a respeitar os limites do seu container,
            impedindo que os textos encostem na beira da tela.
          */}
          <div className="col-span-full w-full space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
