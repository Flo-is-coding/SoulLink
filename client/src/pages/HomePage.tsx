import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GENERATIONS } from "../generations";
import { API_BASE } from "../config";
import ConfirmModal from "../components/ConfirmModal";

interface SessionSummary {
  id: string;
  name: string;
  created_at: string;
  generation: number;
}

export default function HomePage() {
  const [name, setName] = useState("");
  const [generation, setGeneration] = useState(3);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SessionSummary | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/api/sessions`)
      .then((r) => r.json())
      .then(setSessions);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch(`${API_BASE}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), generation }),
    });
    const session = await res.json();
    navigate(`/session/${session.id}`);
  }

  async function handleDelete(id: string) {
    await fetch(`${API_BASE}/api/sessions/${id}`, { method: "DELETE" });
    setSessions((s) => s.filter((x) => x.id !== id));
    setDeleteTarget(null);
  }

  return (
    <div className="min-h-screen pokeball-bg">
      <div className="max-w-xl mx-auto px-4 py-20">
        {/* Logo area */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full relative overflow-hidden border-[2.5px] border-zinc-800 shadow-[0_0_12px_rgba(239,68,68,0.25)]">
              {/* Red top half */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-red-500" />
              {/* White bottom half */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white" />
              {/* Black band */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-zinc-800 z-10" />
              {/* Center button */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-zinc-800 z-20 flex items-center justify-center">
                <div className="w-[8px] h-[8px] rounded-full bg-white border-[1.5px] border-zinc-800" />
              </div>
              {/* Subtle shine */}
              <div className="absolute top-[3px] left-[5px] w-[6px] h-[6px] rounded-full bg-white/40 z-10" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">
              <span className="text-red-500">Soul</span>
              <span className="text-blue-400">Link</span>
            </h1>
          </div>
          <p className="text-sm text-slate-500 tracking-widest uppercase">
            Nuzlocke Tracker
          </p>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="mb-10">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Session name (e.g. Emerald Run #3)"
              className="flex-1 px-4 py-2.5 rounded-lg bg-surface-700 border border-surface-500 focus:border-red-500/60 focus:outline-none text-white placeholder-slate-600 text-sm"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap"
            >
              New Session
            </button>
          </div>

          {/* Generation selector */}
          <div className="flex flex-wrap gap-1.5">
            {GENERATIONS.map((gen) => (
              <button
                key={gen.id}
                type="button"
                onClick={() => setGeneration(gen.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                  generation === gen.id
                    ? "bg-red-600/20 border-red-500/50 text-red-400"
                    : "bg-surface-800 border-surface-600 text-slate-500 hover:border-surface-400 hover:text-slate-300"
                }`}
              >
                <span className="font-bold">{gen.name}</span>{" "}
                <span className="text-[10px] opacity-70">{gen.region}</span>
              </button>
            ))}
          </div>
        </form>

        {/* Sessions list */}
        {sessions.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Continue Session
            </h2>
            <div className="space-y-1.5">
              {sessions.map((s) => {
                const gen = GENERATIONS.find((g) => g.id === s.generation);
                return (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/session/${s.id}`)}
                    className="w-full text-left px-4 py-3 rounded-lg bg-surface-800 hover:bg-surface-700 border border-surface-700 hover:border-surface-500 transition-all flex justify-between items-center group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{s.name}</span>
                      {gen && (
                        <span className="text-[10px] text-slate-600">
                          {gen.name} &middot; {gen.region}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-600">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(s);
                        }}
                        className="text-xs text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        delete
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Delete Session Confirm */}
        {deleteTarget && (
          <ConfirmModal
            title={`Delete "${deleteTarget.name}"?`}
            description="This will permanently delete the session including all players, teams, and caught Pokemon. This cannot be undone."
            confirmLabel="Delete Session"
            variant="danger"
            onConfirm={() => handleDelete(deleteTarget.id)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}

        {/* Footer */}
        <div className="mt-20 flex flex-col items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
          <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Mate bottle */}
            <rect x="10" y="16" width="12" height="18" rx="3" fill="#4a7c59" />
            <rect x="11.5" y="12" width="9" height="5" rx="1.5" fill="#5c8a6a" />
            <rect x="13" y="14" width="6" height="1" rx="0.5" fill="#3d6b4c" />
            {/* Bombilla (straw) */}
            <line x1="19" y1="8" x2="16" y2="18" stroke="#c0a060" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="19" cy="7.5" r="1.5" fill="#c0a060" />
            {/* Leaf */}
            <g transform="translate(27, 10) scale(0.9)">
              <path d="M7 18 C7 18 3 14 3 9 C3 4 7 0 7 0 C7 0 11 4 11 9 C11 14 7 18 7 18Z" fill="#5a9e3e" />
              <line x1="7" y1="3" x2="7" y2="17" stroke="#3d7a28" strokeWidth="0.8" />
              <line x1="7" y1="6" x2="4.5" y2="8.5" stroke="#3d7a28" strokeWidth="0.6" />
              <line x1="7" y1="9" x2="9.5" y2="7" stroke="#3d7a28" strokeWidth="0.6" />
              <line x1="7" y1="11" x2="4.5" y2="13" stroke="#3d7a28" strokeWidth="0.6" />
              <line x1="7" y1="13" x2="9.5" y2="11.5" stroke="#3d7a28" strokeWidth="0.6" />
            </g>
            {/* Smoke wisps */}
            <path d="M13 12 Q11 9 13 6" stroke="#9ca3af" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.5" />
            <path d="M16 11 Q14.5 8.5 16 5.5" stroke="#9ca3af" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.4" />
          </svg>
          <span className="text-[10px] text-slate-600 tracking-widest uppercase">
            made by dubisoft
          </span>
        </div>
      </div>
    </div>
  );
}
