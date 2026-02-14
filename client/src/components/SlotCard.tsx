import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { Slot } from "../types";
import { TYPE_COLORS } from "../typeUtils";

interface Props {
  slot: Slot;
  linkColor: string;
  onClick: () => void;
}

const SPRITE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

export default function SlotCard({ slot, linkColor, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `slot:${slot.id}`,
    disabled: !slot.pokemon,
    data: { type: "slot", pokemon: slot.pokemon },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `slot:${slot.id}`,
  });

  const combinedRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  const p = slot.pokemon;
  const types = p?.pokemon_types?.split(",") || [];

  return (
    <div
      ref={combinedRef}
      {...attributes}
      {...listeners}
      className={`relative flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all group select-none
        ${isDragging ? "opacity-20 scale-95" : ""}
        ${isOver ? "ring-2 ring-blue-400/60 border-blue-400/40 bg-blue-500/5" : ""}
        ${
          p?.is_dead
            ? "bg-red-950/20 border-red-900/40 opacity-50 cursor-pointer"
            : p
            ? "bg-surface-700/80 border-surface-500 hover:border-surface-400 cursor-grab active:cursor-grabbing"
            : "bg-surface-800/30 border-surface-600/50 border-dashed hover:border-surface-400 cursor-pointer"
        }`}
      onClick={onClick}
    >
      {/* Link color — based on link_group, same for both partners */}
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: linkColor }}
      />

      {/* Sprite */}
      <div className="w-9 h-9 shrink-0 flex items-center justify-center">
        {p ? (
          <img
            src={`${SPRITE_URL}${p.pokemon_id}.png`}
            alt={p.pokemon_name}
            className={`w-9 h-9 object-contain ${
              p.is_dead
                ? "grayscale"
                : "drop-shadow-[0_0_4px_rgba(255,255,255,0.06)]"
            }`}
          />
        ) : (
          <div className="w-7 h-7 rounded-full border border-dashed border-surface-400/60 flex items-center justify-center">
            <span className="text-surface-400 text-[10px]">+</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {p ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold truncate leading-tight capitalize">
              {p.nickname || p.pokemon_name}
            </span>
            {p.nickname && (
              <span className="text-[9px] text-slate-500 capitalize truncate hidden group-hover:inline">
                ({p.pokemon_name})
              </span>
            )}
            {p.is_dead && (
              <span className="text-[10px] text-red-500">&#x2620;</span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-slate-500">Empty</span>
        )}
        {types.length > 0 && (
          <div className="flex gap-1 mt-0.5">
            {types.map((t) => (
              <span
                key={t}
                className="text-[8px] font-bold uppercase px-1.5 py-[1px] rounded-sm text-white/90 leading-tight"
                style={{ backgroundColor: TYPE_COLORS[t] || "#888" }}
              >
                {t.slice(0, 3)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Route tooltip */}
      {p?.route && (
        <div className="shrink-0 relative">
          <span
            className="text-[10px] text-slate-500 cursor-default"
            title={p.route}
          >
            &#x1F4CD;
          </span>
          <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-surface-600 rounded text-[10px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-surface-500">
            {p.route}
          </div>
        </div>
      )}

      {/* Dex number */}
      {p && (
        <span className="text-[9px] text-slate-600 tabular-nums shrink-0">
          #{p.pokemon_id}
        </span>
      )}
    </div>
  );
}
