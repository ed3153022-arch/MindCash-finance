import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      {/* O segredo do respiro: Adicionamos o padding aqui e 
          garantimos que o conteúdo seja centralizado sem vazar */}
      <main className="w-full px-6 lg:px-20 pt-6 pb-32 flex justify-center">
        <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {children}
        </div>
      </main>
    </div>
  );
}
