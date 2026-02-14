import { useState } from "react";

interface Props {
  onAdd: (name: string) => void;
  disabled: boolean;
}

export default function AddPlayerForm({ onAdd, disabled }: Props) {
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Player name..."
        disabled={disabled}
        className="px-3 py-1.5 rounded-lg bg-surface-700 border border-surface-500 focus:border-red-500/60 focus:outline-none text-white placeholder-slate-600 text-sm disabled:opacity-30 w-36"
      />
      <button
        type="submit"
        disabled={disabled}
        className="px-3 py-1.5 bg-surface-600 hover:bg-surface-500 rounded-lg text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-surface-500"
      >
        + Player
      </button>
    </form>
  );
}
