import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      {/* Centraliza o conteúdo e dá o respiro lateral de 16px (px-4) */}
      <main className="flex justify-center w-full px-4 pt-6 pb-32">
        {/* max-w-md é o tamanho ideal para parecer um App Nativo no celular */}
        <div className="w-full max-w-md space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
