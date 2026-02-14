import { useState, useRef, useEffect, useCallback } from "react";
import { usePokemonSearch, fetchPokemonTypes } from "../hooks/usePokemonSearch";
import type { Player, BoxLink, FailedEncounter } from "../types";
import { TYPE_COLORS } from "../typeUtils";

interface Props {
  players: Player[];
  box: BoxLink[];
  failedEncounters: FailedEncounter[];
  onAdd: (
    entries: {
      playerId: string;
      pokemonId: number;
      pokemonName: string;
      pokemonTypes: string | null;
      nickname: string | null;
    }[],
    route: string | null
  ) => void;
  onAddFailed: (
    route: string,
    pokemon: {
      playerId: string;
      pokemonId: number;
      pokemonName: string;
      pokemonTypes: string | null;
    }[]
  ) => void;
  onClose: () => void;
}

interface SelectedPokemon {
  pokemonId: number;
  pokemonName: string;
  pokemonTypes: string | null;
}

const SPRITE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

const GEN_LABELS: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V",
  6: "VI", 7: "VII", 8: "VIII", 9: "IX",
};

export default function AddEncounterModal({ players, box, failedEncounters, onAdd, onAddFailed, onClose }: Props) {
  const [route, setRoute] = useState("");
  const [selections, setSelections] = useState<
    Record<string, SelectedPokemon | null>
  >(() => Object.fromEntries(players.map((p) => [p.id, null])));
  const [activePlayer, setActivePlayer] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [genFilter, setGenFilter] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const { pokemon, loading, totalCount } = usePokemonSearch(query, genFilter, visibleCount);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(50);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [query, genFilter]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      setVisibleCount((prev) => prev + 50);
    }
  }, []);

  useEffect(() => {
    if (activePlayer) searchRef.current?.focus();
  }, [activePlayer]);

  // Build set of all species names already in the box (for dupes clause)
  const ownedSpecies = new Set<string>();
  for (const link of box) {
    for (const entry of link.entries) {
      ownedSpecies.add(entry.pokemon_name);
    }
  }

  // Also check route dupes (including failed encounters)
  const usedRoutes = new Set<string>();
  for (const link of box) {
    if (link.route) usedRoutes.add(link.route.toLowerCase());
  }
  for (const fe of failedEncounters) {
    usedRoutes.add(fe.route.toLowerCase());
  }
  const routeAlreadyUsed = route.trim()
    ? usedRoutes.has(route.trim().toLowerCase())
    : false;

  function handleMarkFailed() {
    if (!route.trim()) return;
    const pokemon = players
      .filter((p) => selections[p.id])
      .map((p) => ({
        playerId: p.id,
        pokemonId: selections[p.id]!.pokemonId,
        pokemonName: selections[p.id]!.pokemonName,
        pokemonTypes: selections[p.id]!.pokemonTypes,
      }));
    onAddFailed(route.trim(), pokemon);
    onClose();
  }

  async function handleSelectPokemon(pokemonId: number, pokemonName: string) {
    if (!activePlayer) return;
    const types = await fetchPokemonTypes(pokemonId);
    setSelections((prev) => ({
      ...prev,
      [activePlayer]: {
        pokemonId,
        pokemonName,
        pokemonTypes: types.join(","),
      },
    }));
    setActivePlayer(null);
    setQuery("");
  }

  function handleSubmit() {
    const entries = players
      .filter((p) => selections[p.id])
      .map((p) => ({
        playerId: p.id,
        pokemonId: selections[p.id]!.pokemonId,
        pokemonName: selections[p.id]!.pokemonName,
        pokemonTypes: selections[p.id]!.pokemonTypes,
        nickname: null,
      }));
    if (entries.length === 0) return;
    onAdd(entries, route.trim() || null);
    onClose();
  }

  const allSelected = players.every((p) => selections[p.id]);

  // If searching for a specific player
  if (activePlayer) {
    const player = players.find((p) => p.id === activePlayer)!;
    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        onClick={() => setActivePlayer(null)}
      >
        <div
          className="bg-surface-800 rounded-2xl w-full max-w-md max-h-[75vh] flex flex-col border border-surface-600"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2.5 border-b border-surface-700 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Choose for {player.name}
            </span>
            <button
              onClick={() => setActivePlayer(null)}
              className="text-slate-600 hover:text-slate-300 transition-colors text-sm"
            >
              &times;
            </button>
          </div>

          <div className="px-3 py-2.5 border-b border-surface-700 space-y-2">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or #number..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-900 border border-surface-600 focus:border-blue-500/60 focus:outline-none text-sm text-white placeholder-slate-600"
            />
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setGenFilter(null)}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                  genFilter === null
                    ? "bg-red-600 text-white"
                    : "bg-surface-600 text-slate-400 hover:bg-surface-500"
                }`}
              >
                All
              </button>
              {Object.entries(GEN_LABELS).map(([gen, label]) => (
                <button
                  key={gen}
                  onClick={() => setGenFilter(Number(gen))}
                  className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                    genFilter === Number(gen)
                      ? "bg-red-600 text-white"
                      : "bg-surface-600 text-slate-400 hover:bg-surface-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
            {loading ? (
              <div className="text-center text-slate-600 py-8 text-xs">
                Loading...
              </div>
            ) : pokemon.length === 0 ? (
              <div className="text-center text-slate-600 py-8 text-xs">
                No Pokemon found
              </div>
            ) : (
              <div className="p-1 space-y-px">
                {pokemon.map((p) => {
                  const isDupe = ownedSpecies.has(p.name);
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPokemon(p.id, p.name)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-600 transition-colors text-left ${
                        isDupe ? "opacity-60" : ""
                      }`}
                    >
                      <img
                        src={`${SPRITE_URL}${p.id}.png`}
                        alt={p.name}
                        className="w-7 h-7 object-contain"
                        loading="lazy"
                      />
                      <span className="text-xs capitalize flex-1">{p.name}</span>
                      {isDupe && (
                        <span className="text-[8px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                          DUPE
                        </span>
                      )}
                      <span className="text-[9px] text-slate-600 tabular-nums">
                        #{p.id}
                      </span>
                    </button>
                  );
                })}
                {pokemon.length < totalCount && (
                  <div className="text-center text-slate-600 py-2 text-[10px]">
                    Showing {pokemon.length} of {totalCount} — scroll for more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Check selections for dupes
  const selectedDupes = players
    .filter((p) => selections[p.id] && ownedSpecies.has(selections[p.id]!.pokemonName))
    .map((p) => ({
      playerName: p.name,
      pokemonName: selections[p.id]!.pokemonName,
    }));

  // Main encounter form
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-800 rounded-2xl w-full max-w-md border border-surface-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-surface-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold">New Encounter</h2>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-300 transition-colors text-sm"
          >
            &times;
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Route input */}
          <div>
            <label className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">
              Route / Location
            </label>
            <input
              type="text"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="Route 1, Viridian Forest..."
              className={`w-full px-2.5 py-1.5 rounded bg-surface-700 border focus:outline-none text-sm text-white placeholder-slate-600 ${
                routeAlreadyUsed
                  ? "border-amber-500/50 focus:border-amber-500/70"
                  : "border-surface-500 focus:border-blue-500/60"
              }`}
            />
            {routeAlreadyUsed && (
              <p className="text-[9px] text-amber-400 mt-1 flex items-center gap-1">
                <span>&#x26A0;</span>
                You already have an encounter from this route
              </p>
            )}
          </div>

          {/* Player selections */}
          <div className="space-y-2">
            {players.map((player) => {
              const sel = selections[player.id];
              const isDupe = sel && ownedSpecies.has(sel.pokemonName);
              return (
                <div key={player.id}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-20 truncate shrink-0">
                      {player.name}
                    </span>
                    {sel ? (
                      <button
                        onClick={() =>
                          setSelections((prev) => ({
                            ...prev,
                            [player.id]: null,
                          }))
                        }
                        className={`flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-colors ${
                          isDupe
                            ? "bg-amber-950/20 border-amber-500/30 hover:border-red-500/50"
                            : "bg-surface-700 border-surface-500 hover:border-red-500/50"
                        }`}
                      >
                        <img
                          src={`${SPRITE_URL}${sel.pokemonId}.png`}
                          alt={sel.pokemonName}
                          className="w-7 h-7 object-contain"
                        />
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-xs capitalize block truncate">
                            {sel.pokemonName}
                          </span>
                          {sel.pokemonTypes && (
                            <div className="flex gap-0.5 mt-0.5">
                              {sel.pokemonTypes.split(",").map((t) => (
                                <span
                                  key={t}
                                  className="text-[7px] font-bold uppercase px-1 py-[0.5px] rounded-sm text-white/80"
                                  style={{ backgroundColor: TYPE_COLORS[t] || "#888" }}
                                >
                                  {t.slice(0, 3)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {isDupe && (
                          <span className="text-[8px] font-semibold text-amber-400 shrink-0">
                            DUPE
                          </span>
                        )}
                        <span className="text-[9px] text-slate-600 shrink-0">
                          change
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setActivePlayer(player.id)}
                        className="flex-1 px-2.5 py-2.5 rounded-lg border border-dashed border-surface-500 text-xs text-slate-500 hover:text-slate-300 hover:border-surface-400 transition-colors"
                      >
                        Choose Pokemon...
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dupes Clause warning */}
          {selectedDupes.length > 0 && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-950/20 border border-amber-500/20">
              <span className="text-amber-400 text-sm leading-none mt-0.5">&#x26A0;</span>
              <div className="text-[10px] text-amber-300/80 leading-relaxed">
                <span className="font-semibold text-amber-400">Dupes Clause: </span>
                {selectedDupes.map((d) => (
                  <span key={d.playerName} className="capitalize">
                    {d.playerName}'s {d.pokemonName}
                  </span>
                )).reduce((prev, curr, i) => (
                  <>{prev}{i > 0 ? ", " : ""}{curr}</>
                ), <></>)}{" "}
                already in box. You may skip this encounter.
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-surface-700 flex gap-2 justify-between">
          <button
            onClick={handleMarkFailed}
            disabled={!route.trim() || routeAlreadyUsed}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-red-400 bg-surface-700 hover:bg-surface-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Mark this route as a failed encounter (fled, fainted, etc.)"
          >
            Failed Encounter
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 bg-surface-700 hover:bg-surface-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allSelected}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Add to Box
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
