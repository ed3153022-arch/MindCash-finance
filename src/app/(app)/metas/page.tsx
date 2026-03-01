"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Goal = {
  id: string;
  title: string;
  type: string;
  category: string | null;
  amount: number;
  month: string | null;
};

export default function MetasPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setGoals(data);

    setLoading(false);
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">Metas</h1>

          <button
            onClick={() => setShowModal(true)}
            className="bg-yellow-400 hover:bg-yellow-300 text-black px-5 py-3 rounded-xl font-semibold transition"
          >
            + Nova Meta
          </button>
        </div>

        {/* LISTA */}
        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : goals.length === 0 ? (
          <p className="text-gray-500">Você ainda não possui metas.</p>
        ) : (
          <div className="space-y-6">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="bg-[#111111] p-6 rounded-2xl border border-white/5"
              >
                <p className="text-xs text-gray-400 uppercase mb-2">
                  {goal.type}
                </p>

                <h2 className="text-xl font-bold mb-2">
                  {goal.title}
                </h2>

                <p className="text-yellow-400 font-semibold">
                  R$ {goal.amount}
                </p>

                {goal.category && (
                  <p className="text-gray-500 text-sm mt-2">
                    Categoria: {goal.category}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
