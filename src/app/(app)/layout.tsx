import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden flex flex-col">
      <Navbar />
      
      {/* O segredo: Adicionamos px-6 (mobile) e lg:px-20 (desktop).
        O item-center garante que o grid fique no meio e o padding 
        crie a "parede" de respiro que você quer.
      */}
      <main className="flex-1 flex justify-center w-full px-6 lg:px-20 pt-6 pb-32 box-border">
        
        <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {children}
        </div>
      </main>
    </div>
  );
}
