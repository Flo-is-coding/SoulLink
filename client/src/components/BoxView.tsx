import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { BoxLink, BoxEntry, Player } from "../types";
import { TYPE_COLORS } from "../typeUtils";
import ConfirmModal from "./ConfirmModal";

interface Props {
  box: BoxLink[];
  players: Player[];
  onKillLink: (linkGroup: string) => void;
}

const SPRITE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

function DraggableEntry({
  entry,
  children,
}: {
  entry: BoxEntry;
  children: React.ReactNode;
}) {
  const canDrag = !entry.is_dead && !entry.in_team;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `box:${entry.id}`,
    disabled: !canDrag,
    data: { type: "box", pokemon: entry },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex-1 min-w-0 ${isDragging ? "opacity-20" : ""} ${
        canDrag ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      {children}
    </div>
  );
}

export default function BoxView({ box, players, onKillLink }: Props) {
  const [showDead, setShowDead] = useState(false);
  const [search, setSearch] = useState("");
  const [killTarget, setKillTarget] = useState<BoxLink | null>(null);

  const q = search.toLowerCase();
  const matchesSearch = (link: BoxLink) => {
    if (!q) return true;
    return link.entries.some(
      (e) =>
        e.pokemon_name.toLowerCase().includes(q) ||
        (e.nickname && e.nickname.toLowerCase().includes(q)) ||
        (e.route && e.route.toLowerCase().includes(q)) ||
        String(e.pokemon_id).includes(q)
    );
  };

  // Hide links where all entries are in team
  const notFullyInTeam = (link: BoxLink) =>
    link.entries.some((e) => !e.in_team);

  const aliveLinks = box.filter(
    (l) => !l.is_dead && notFullyInTeam(l) && matchesSearch(l)
  );
  const deadLinks = box.filter((l) => l.is_dead && matchesSearch(l));

  if (box.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8 text-xs">
        No Pokemon caught yet.
        <br />
        <span className="text-slate-600">
          Use "New Encounter" above to catch your first Pokemon!
        </span>
      </div>
    );
  }

  function renderEntry(entry: BoxEntry) {
    if (!entry) {
      return (
        <div className="flex-1 text-[10px] text-slate-600">-</div>
      );
    }
    const types = entry.pokemon_types?.split(",") || [];
    const content = (
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        <img
          src={`${SPRITE_URL}${entry.pokemon_id}.png`}
          alt={entry.pokemon_name}
          className={`w-7 h-7 object-contain shrink-0 ${
            entry.is_dead ? "grayscale" : ""
          }`}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium capitalize truncate">
              {entry.nickname || entry.pokemon_name}
            </span>
            {entry.in_team && (
              <span className="text-[8px] text-blue-400 font-semibold uppercase">
                team
              </span>
            )}
            {entry.is_dead && (
              <span className="text-[9px] text-red-500">&#x2620;</span>
            )}
          </div>
          {types.length > 0 && (
            <div className="flex gap-0.5">
              {types.map((t) => (
                <span
                  key={t}
                  className="text-[7px] font-bold uppercase px-1 py-[0.5px] rounded-sm text-white/80 leading-tight"
                  style={{ backgroundColor: TYPE_COLORS[t] || "#888" }}
                >
                  {t.slice(0, 3)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );

    return (
      <DraggableEntry key={entry.id} entry={entry}>
        {content}
      </DraggableEntry>
    );
  }

  function renderLink(link: BoxLink) {
    return (
      <div
        key={link.link_group}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          link.is_dead
            ? "bg-red-950/10 border-red-900/30 opacity-50"
            : "bg-surface-700/60 border-surface-500/80"
        }`}
      >
        {/* Route */}
        <div className="w-24 shrink-0">
          {link.route ? (
            <span className="text-[10px] text-slate-400 truncate block">
              {link.route}
            </span>
          ) : (
            <span className="text-[10px] text-slate-600">Unknown</span>
          )}
        </div>

        {/* Pokemon entries */}
        <div className="flex-1 flex items-center gap-3">
          {players.map((player) => {
            const entry = link.entries.find((e) => e.player_id === player.id);
            if (!entry) {
              return (
                <div
                  key={player.id}
                  className="flex-1 text-[10px] text-slate-600"
                >
                  -
                </div>
              );
            }
            return renderEntry(entry);
          })}
        </div>

        {/* Kill button */}
        {!link.is_dead && (
          <button
            onClick={() => setKillTarget(link)}
            className="text-[9px] text-slate-600 hover:text-red-400 transition-colors shrink-0"
            title="Kill this link"
          >
            &#x2620;
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Pokemon, route, or nickname..."
          className="w-full pl-8 pr-3 py-1.5 bg-surface-800/60 border border-surface-500/50 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-surface-400"
        />
      </div>

      {/* Alive links */}
      {aliveLinks.map(renderLink)}

      {aliveLinks.length === 0 && q && (
        <div className="text-center text-slate-600 py-4 text-xs">
          No matches found.
        </div>
      )}

      {/* Graveyard */}
      {deadLinks.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowDead(!showDead)}
            className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span>{showDead ? "\u25BC" : "\u25B6"}</span>
            <span>&#x2620; Graveyard ({deadLinks.length})</span>
          </button>
          {showDead && (
            <div className="space-y-1.5 mt-2">{deadLinks.map(renderLink)}</div>
          )}
        </div>
      )}

      {/* Kill Link Confirm Modal */}
      {killTarget && (
        <ConfirmModal
          title="Kill this link?"
          description="All linked Pokemon in this group will be marked as dead and removed from teams. This cannot be undone."
          confirmLabel="Kill Link"
          variant="danger"
          onConfirm={() => {
            onKillLink(killTarget.link_group);
            setKillTarget(null);
          }}
          onCancel={() => setKillTarget(null)}
        >
          <div className="flex items-center justify-center gap-3 py-2">
            {killTarget.entries.map((entry) => {
              const player = players.find((p) => p.id === entry.player_id);
              return (
                <div key={entry.id} className="text-center">
                  <img
                    src={`${SPRITE_URL}${entry.pokemon_id}.png`}
                    alt={entry.pokemon_name}
                    className="w-12 h-12 object-contain mx-auto"
                  />
                  <div className="text-[10px] font-medium capitalize truncate max-w-[80px]">
                    {entry.nickname || entry.pokemon_name}
                  </div>
                  {player && (
                    <div className="text-[9px] text-slate-500">
                      {player.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {killTarget.route && (
            <div className="text-center text-[10px] text-slate-500">
              Route: {killTarget.route}
            </div>
          )}
        </ConfirmModal>
      )}
    </div>
  );
}
