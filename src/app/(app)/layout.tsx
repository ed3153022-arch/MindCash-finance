import { Navbar } from "@/components/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />
      
      {/* px-6: Margem obrigatória no celular (resolve o problema de encostar na borda).
        lg:px-12: Margem no desktop.
      */}
      <main className="flex justify-center w-full px-6 lg:px-12 pt-6 pb-32">
        
        {/* Removi o 'grid' daqui e coloquei 'flex-col'. 
          Isso garante que o container centralize e respeite os paddings (px-6).
        */}
        <div className="w-full max-w-[1100px] flex flex-col gap-8">
          {children}
        </div>
      </main>
    </div>
  );
}
