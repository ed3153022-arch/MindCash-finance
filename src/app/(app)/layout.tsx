import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />
      
      {/* px-4 (Celular) e md:px-10 (Desktop) garantem que o card não encoste no vidro */}
      <main className="flex justify-center w-full px-4 md:px-10 pt-6 pb-32">
        
        {/* O 'gap-6' é o mestre aqui: ele separa tudo com 24px de distância */}
        <div className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {children}
        </div>
      </main>
    </div>
  );
}
