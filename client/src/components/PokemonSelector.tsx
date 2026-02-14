import { useState } from "react";
import type { Slot, BoxEntry, BoxLink } from "../types";
import { TYPE_COLORS, getDefensiveMatchups } from "../typeUtils";
import ConfirmModal from "./ConfirmModal";

interface Props {
  slot: Slot;
  box: BoxLink[];
  playerId: string;
  onAssign: (boxEntryId: string) => void;
  onClear: () => void;
  onKillLink: (linkGroup: string) => void;
  onClose: () => void;
}

const SPRITE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
const ARTWORK_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";

export default function PokemonSelector({
  slot,
  box,
  playerId,
  onAssign,
  onClear,
  onKillLink,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showKillConfirm, setShowKillConfirm] = useState(false);
  const p = slot.pokemon;

  // Detail view for filled slot
  if (p) {
    const types = p.pokemon_types?.split(",") || [];
    const matchups = types.length > 0 ? getDefensiveMatchups(types) : null;

    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-surface-800 rounded-2xl w-full max-w-sm border border-surface-600 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pokemon header */}
          <div className="p-4 text-center border-b border-surface-700 bg-surface-900/50">
            <img
              src={`${ARTWORK_URL}${p.pokemon_id}.png`}
              alt={p.pokemon_name}
              className={`w-20 h-20 mx-auto object-contain mb-2 ${
                p.is_dead ? "grayscale opacity-40" : ""
              }`}
            />
            <div className="text-base font-bold capitalize">
              {p.nickname || p.pokemon_name}
            </div>
            {p.nickname && (
              <div className="text-[10px] text-slate-500 capitalize">
                {p.pokemon_name}
              </div>
            )}
            <div className="text-[10px] text-slate-600 mb-2">
              #{p.pokemon_id}
              {p.route && <span> &middot; {p.route}</span>}
            </div>
            {types.length > 0 && (
              <div className="flex gap-1.5 justify-center">
                {types.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] font-bold uppercase px-1.5 py-[2px] rounded text-white/90"
                    style={{ backgroundColor: TYPE_COLORS[t] || "#888" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Type matchups */}
          {matchups && (
            <div className="px-4 py-3 border-b border-surface-700 space-y-2">
              {matchups.weaknesses.length > 0 && (
                <div>
                  <span className="text-[9px] text-red-400 uppercase tracking-wider font-semibold">
                    Weak to
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {matchups.weaknesses.map(({ type, multiplier }) => (
                      <span
                        key={type}
                        className="text-[9px] font-bold uppercase px-1.5 py-[2px] rounded text-white/90"
                        style={{ backgroundColor: TYPE_COLORS[type] || "#888" }}
                      >
                        {type}
                        {multiplier === 4 && (
                          <span className="ml-0.5 text-[7px]">x4</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {matchups.resistances.length > 0 && (
                <div>
                  <span className="text-[9px] text-green-400 uppercase tracking-wider font-semibold">
                    Resists
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {matchups.resistances.map(({ type, multiplier }) => (
                      <span
                        key={type}
                        className="text-[9px] font-bold uppercase px-1.5 py-[2px] rounded text-white/50"
                        style={{
                          backgroundColor: TYPE_COLORS[type] || "#888",
                          opacity: 0.6,
                        }}
                      >
                        {type}
                        {multiplier === 0.25 && (
                          <span className="ml-0.5 text-[7px]">x.25</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {matchups.immunities.length > 0 && (
                <div>
                  <span className="text-[9px] text-blue-400 uppercase tracking-wider font-semibold">
                    Immune to
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {matchups.immunities.map((type) => (
                      <span
                        key={type}
                        className="text-[9px] font-bold uppercase px-1.5 py-[2px] rounded text-white/40 border border-slate-600"
                        style={{
                          backgroundColor: `${TYPE_COLORS[type]}33`,
                        }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="p-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setShowKillConfirm(true)}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 text-red-500 hover:bg-red-900/50 border border-red-800/30 transition-colors"
            >
              &#x2620; Kill Link
            </button>
            <button
              onClick={() => {
                onClear();
                onClose();
              }}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-surface-700 hover:bg-surface-600 transition-colors"
            >
              Back to Box
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 bg-surface-700 hover:bg-surface-600 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Kill Link Confirm */}
          {showKillConfirm && (
            <ConfirmModal
              title="Kill this link?"
              description="All linked Pokemon in this group will be marked as dead and removed from teams. This cannot be undone."
              confirmLabel="Kill Link"
              variant="danger"
              onConfirm={() => {
                onKillLink(p.link_group);
                onClose();
              }}
              onCancel={() => setShowKillConfirm(false)}
            >
              <div className="flex items-center justify-center gap-3 py-2">
                {box
                  .find((l) => l.link_group === p.link_group)
                  ?.entries.map((entry) => (
                    <div key={entry.id} className="text-center">
                      <img
                        src={`${SPRITE_URL}${entry.pokemon_id}.png`}
                        alt={entry.pokemon_name}
                        className="w-12 h-12 object-contain mx-auto"
                      />
                      <div className="text-[10px] font-medium capitalize truncate max-w-[80px]">
                        {entry.nickname || entry.pokemon_name}
                      </div>
                    </div>
                  ))}
              </div>
            </ConfirmModal>
          )}
        </div>
      </div>
    );
  }

  // Pick from box — show available (alive, not in team) Pokemon for this player
  const available: BoxEntry[] = [];
  for (const link of box) {
    for (const entry of link.entries) {
      if (
        entry.player_id === playerId &&
        !entry.is_dead &&
        !entry.in_team
      ) {
        available.push(entry);
      }
    }
  }

  const q = search.toLowerCase();
  const filtered = q
    ? available.filter(
        (e) =>
          e.pokemon_name.toLowerCase().includes(q) ||
          (e.nickname && e.nickname.toLowerCase().includes(q)) ||
          String(e.pokemon_id).includes(q)
      )
    : available;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-800 rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col border border-surface-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2.5 border-b border-surface-700 flex items-center justify-between gap-2">
          {showSearch ? (
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-surface-700 border border-surface-500 rounded-md px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          ) : (
            <span className="text-xs font-semibold text-slate-400">
              Slot {slot.position} — Choose from Box
            </span>
          )}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setSearch("");
              }}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                showSearch
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-slate-600 hover:text-slate-300 hover:bg-surface-600"
              }`}
              title="Search"
            >
              <svg
                className="w-3.5 h-3.5"
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
            </button>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-300 transition-colors text-sm"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center text-slate-600 py-10 text-xs">
              {available.length === 0 ? (
                <>
                  No available Pokemon in box.
                  <br />
                  <span className="text-slate-700">
                    Catch new Pokemon with "New Encounter".
                  </span>
                </>
              ) : (
                "No matches found."
              )}
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {filtered.map((entry) => {
                const types = entry.pokemon_types?.split(",") || [];
                return (
                  <button
                    key={entry.id}
                    onClick={() => {
                      onAssign(entry.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-surface-600 transition-colors text-left"
                  >
                    <img
                      src={`${SPRITE_URL}${entry.pokemon_id}.png`}
                      alt={entry.pokemon_name}
                      className="w-8 h-8 object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium capitalize truncate">
                        {entry.nickname || entry.pokemon_name}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {types.map((t) => (
                          <span
                            key={t}
                            className="text-[7px] font-bold uppercase px-1 py-[0.5px] rounded-sm text-white/80"
                            style={{
                              backgroundColor: TYPE_COLORS[t] || "#888",
                            }}
                          >
                            {t.slice(0, 3)}
                          </span>
                        ))}
                        {entry.route && (
                          <span className="text-[9px] text-slate-600">
                            {entry.route}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-600 tabular-nums">
                      #{entry.pokemon_id}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
