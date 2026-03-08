import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />
      
      {/* px-6: Aumentamos o respiro lateral externo.
        max-w-[440px]: Ajuste fino para telas mobile modernas.
      */}
      <main className="flex justify-center w-full px-6 pt-6 pb-32">
        <div className="w-full max-w-[440px] flex flex-col gap-6">
          {children}
        </div>
      </main>
    </div>
  );
}
