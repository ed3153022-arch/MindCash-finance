'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* 🔝 TOPBAR */}
      <header className="w-full bg-black border-b border-yellow-500 fixed top-0 left-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-yellow-500">
            MindCash
          </h1>

          <nav className="hidden md:flex gap-8 text-gray-300">
            <a href="#" className="hover:text-yellow-500 transition">
              Dashboard
            </a>
            <a href="#" className="hover:text-yellow-500 transition">
              Relatórios
            </a>
            <a href="#" className="hover:text-yellow-500 transition">
              Histórico
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {user.email}
            </span>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Espaço para compensar topbar fixa */}
      <div className="h-24"></div>

      <main className="container mx-auto px-6 py-10 space-y-10">

        {/* 💰 RESUMO FINANCEIRO */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <p className="text-gray-400">Receita do mês</p>
            <h2 className="text-2xl font-bold text-yellow-500 mt-2">
              R$ 0,00
            </h2>
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <p className="text-gray-400">Gastos do mês</p>
            <h2 className="text-2xl font-bold text-red-500 mt-2">
              R$ 0,00
            </h2>
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <p className="text-gray-400">Saldo atual</p>
            <h2 className="text-2xl font-bold text-green-500 mt-2">
              R$ 0,00
            </h2>
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <p className="text-gray-400">Economia</p>
            <h2 className="text-2xl font-bold text-yellow-500 mt-2">
              0%
            </h2>
          </div>
        </section>

        {/* ➕ REGISTRAR TRANSAÇÃO */}
        <section className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
          <h2 className="text-xl font-semibold text-yellow-500 mb-6">
            Registrar Transação
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-black border border-gray-700 p-3 rounded-lg focus:outline-none focus:border-yellow-500"
            >
              <option value="income">Receita</option>
              <option value="expense">Gasto</option>
            </select>

            <input
              type="number"
              placeholder="Valor"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-black border border-gray-700 p-3 rounded-lg focus:outline-none focus:border-yellow-500"
            />

            <input
              type="text"
              placeholder="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-black border border-gray-700 p-3 rounded-lg focus:outline-none focus:border-yellow-500"
            />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-black border border-gray-700 p-3 rounded-lg focus:outline-none focus:border-yellow-500"
            />
          </div>

          <button className="mt-6 bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition">
            Salvar Transação
          </button>
        </section>

        {/* 🔒 BLOCO PREMIUM */}
        <section className="bg-gray-900 p-8 rounded-2xl border border-dashed border-yellow-500">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Veredito Financeiro
            <span>🔒</span>
          </h2>

          <p className="text-gray-400 mt-3">
            Para visualizar seu veredito mensal, tendências e relatórios
            completos, é necessário ativar um plano.
          </p>

          <button
            onClick={() => router.push('/plans')}
            className="mt-4 bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition"
          >
            Desbloquear veredito
          </button>
        </section>

      </main>
    </div>
  );
}
