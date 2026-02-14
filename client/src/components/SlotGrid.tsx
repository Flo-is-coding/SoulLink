import { useState } from "react";
import type { Player, Slot } from "../types";
import SlotCard from "./SlotCard";
import ConfirmModal from "./ConfirmModal";

interface Props {
  players: Player[];
  onSlotClick: (slot: Slot) => void;
  onRemovePlayer: (playerId: string) => void;
  onClearAll: () => void;
}

const LINK_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#a855f7", // purple
  "#f97316", // orange
  "#eab308", // yellow
];

export default function SlotGrid({
  players,
  onSlotClick,
  onRemovePlayer,
  onClearAll,
}: Props) {
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Player | null>(null);

  // Assign a color per link_group (not per slot position).
  // Collect all link_groups in team, sort for stability, map to color.
  const linkGroupSet = new Set<string>();
  for (const p of players) {
    for (const s of p.slots) {
      if (s.pokemon) linkGroupSet.add(s.pokemon.link_group);
    }
  }
  const linkColorMap = new Map<string, string>();
  [...linkGroupSet].sort().forEach((lg, i) => {
    linkColorMap.set(lg, LINK_COLORS[i % LINK_COLORS.length]);
  });

  if (players.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-sm text-slate-400">
          Add players to start your Soul Link
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Each player has 6 team slots — linked slots share the same fate
        </p>
      </div>
    );
  }

  const filledSlotCount = players.reduce(
    (acc, p) => acc + p.slots.filter((s) => s.pokemon).length,
    0
  );

  return (
    <div>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Team
          </h2>
          <p className="text-[10px] text-slate-600 mt-0.5">
            Click a slot to manage it, or drag Pokemon from the box below
          </p>
        </div>
        {filledSlotCount > 0 && (
          <button
            onClick={() => setConfirmClearAll(true)}
            className="text-[10px] text-slate-500 hover:text-red-400 transition-colors shrink-0"
          >
            Clear all
          </button>
        )}
      </div>

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${players.length}, minmax(200px, 1fr))`,
        }}
      >
        {players.map((player) => (
          <div key={player.id} className="space-y-1.5">
            {/* Player Header */}
            <div className="flex items-center justify-between px-2 pb-1.5 border-b border-surface-500/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500/80" />
                <span className="font-bold text-sm tracking-wide">
                  {player.name}
                </span>
              </div>
              <button
                onClick={() => setRemoveTarget(player)}
                className="text-[10px] text-slate-600 hover:text-red-400 transition-colors"
              >
                remove
              </button>
            </div>

            {/* Slots */}
            <div className="space-y-1">
              {player.slots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  linkColor={
                    slot.pokemon
                      ? linkColorMap.get(slot.pokemon.link_group) || "#555"
                      : "#333"
                  }
                  onClick={() => onSlotClick(slot)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Clear All Confirm */}
      {confirmClearAll && (
        <ConfirmModal
          title="Clear all teams?"
          description={`This will remove all ${filledSlotCount} Pokemon from team slots. They'll stay in the box and can be re-assigned later.`}
          confirmLabel="Clear All"
          variant="danger"
          onConfirm={() => {
            onClearAll();
            setConfirmClearAll(false);
          }}
          onCancel={() => setConfirmClearAll(false)}
        />
      )}

      {/* Remove Player Confirm */}
      {removeTarget && (
        <ConfirmModal
          title={`Remove ${removeTarget.name}?`}
          description={`This will remove ${removeTarget.name} from the session. Their team slots will be cleared.`}
          confirmLabel="Remove"
          variant="danger"
          onConfirm={() => {
            onRemovePlayer(removeTarget.id);
            setRemoveTarget(null);
          }}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}
