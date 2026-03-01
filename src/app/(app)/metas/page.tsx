"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MetasPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setGoals(data);
    }

    setLoading(false);
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-bold mb-8">Metas</h1>

        {loading ? (
          <p className="text-gray-400">Carregando metas...</p>
        ) : goals.length === 0 ? (
          <p className="text-gray-500">Você ainda não criou nenhuma meta.</p>
        ) : (
          <div className="space-y-6">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="bg-[#111111] p-6 rounded-2xl border border-white/5"
              >
                <p className="text-xs uppercase text-gray-400 mb-2">
                  {goal.type}
                </p>
                <h2 className="text-xl font-bold mb-2">
                  {goal.title}
                </h2>
                <p className="text-yellow-400 font-semibold">
                  R$ {goal.amount}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
