"use client";

export default function VerdictButton() {
  return (
    <button
      className="fixed top-4 right-4 z-50 bg-white text-black text-sm px-4 py-2 rounded-full shadow-lg hover:scale-105 transition"
      onClick={() => (window.location.href = "/dashboard")}
    >
      Veredito
    </button>
  );
}
