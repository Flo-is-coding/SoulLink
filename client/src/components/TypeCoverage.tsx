import { useMemo, useState } from "react";
import type { Player } from "../types";
import { TYPE_COLORS, getDefensiveMatchups } from "../typeUtils";
import TypeChartModal from "./TypeChartModal";

interface Props {
  players: Player[];
}

const ALL_TYPES = Object.keys(TYPE_COLORS);

const SPRITE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

interface PokeRef {
  name: string;
  pokemonId: number;
}

interface PlayerAnalysis {
  player: Player;
  weakTo: Map<string, PokeRef[]>;
  resistTo: Map<string, PokeRef[]>;
  immuneTo: Map<string, PokeRef[]>;
  dangers: string[];
}

export default function TypeCoverage({ players }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const playerAnalyses = useMemo(() => {
    return players
      .map((player) => {
        const teamPokemon = player.slots
          .filter((s) => s.pokemon && !s.pokemon.is_dead)
          .map((s) => ({
            name: s.pokemon!.nickname || s.pokemon!.pokemon_name,
            pokemonId: s.pokemon!.pokemon_id,
            types: s.pokemon!.pokemon_types?.split(",") || [],
          }))
          .filter((p) => p.types.length > 0);

        if (teamPokemon.length === 0) return null;

        const weakTo = new Map<string, PokeRef[]>();
        const resistTo = new Map<string, PokeRef[]>();
        const immuneTo = new Map<string, PokeRef[]>();

        for (const poke of teamPokemon) {
          const ref: PokeRef = { name: poke.name, pokemonId: poke.pokemonId };
          const matchups = getDefensiveMatchups(poke.types);
          for (const w of matchups.weaknesses) {
            const arr = weakTo.get(w.type) || [];
            arr.push(ref);
            weakTo.set(w.type, arr);
          }
          for (const r of matchups.resistances) {
            const arr = resistTo.get(r.type) || [];
            arr.push(ref);
            resistTo.set(r.type, arr);
          }
          for (const imm of matchups.immunities) {
            const arr = immuneTo.get(imm) || [];
            arr.push(ref);
            immuneTo.set(imm, arr);
          }
        }

        const dangers = ALL_TYPES.filter(
          (t) =>
            (weakTo.get(t)?.length || 0) >= 2 &&
            !resistTo.has(t) &&
            !immuneTo.has(t)
        );

        return { player, weakTo, resistTo, immuneTo, dangers };
      })
      .filter(Boolean) as PlayerAnalysis[];
  }, [players]);

  if (playerAnalyses.length === 0) return null;

  const totalDangers = playerAnalyses.reduce(
    (sum, a) => sum + a.dangers.length,
    0
  );

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs"
        >
          <span className="text-slate-500">
            {expanded ? "\u25BC" : "\u25B6"}
          </span>
          <span className="font-semibold text-slate-400 uppercase tracking-wider">
            Type Coverage
          </span>
          {!expanded && totalDangers > 0 && (
            <span className="text-red-400 font-semibold">
              {totalDangers} unprotected
            </span>
          )}
          {!expanded && totalDangers === 0 && (
            <span className="text-green-400/60 font-medium">OK</span>
          )}
        </button>
        {expanded && (
          <>
            <button
              onClick={() => setDetails(!details)}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                details
                  ? "border-slate-500 text-slate-300 bg-surface-700/60"
                  : "border-surface-500/40 text-slate-500 hover:text-slate-400"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setShowChart(true)}
              className="text-[10px] px-2 py-0.5 rounded border border-surface-500/40 text-slate-500 hover:text-slate-400 transition-colors"
            >
              Type Chart
            </button>
          </>
        )}
      </div>

      {expanded && (
        <div
          className="mt-3 grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${playerAnalyses.length}, 1fr)`,
          }}
        >
          {playerAnalyses.map(
            ({ player, weakTo, resistTo, immuneTo, dangers }) => {
              const strongMap = new Map<string, PokeRef[]>();
              for (const t of ALL_TYPES) {
                const refs = [
                  ...(resistTo.get(t) || []),
                  ...(immuneTo.get(t) || []),
                ];
                const unique = refs.filter(
                  (r, i, arr) =>
                    arr.findIndex((x) => x.pokemonId === r.pokemonId) === i
                );
                if (unique.length > 0) {
                  strongMap.set(t, unique);
                }
              }
              const strongTypes = [...strongMap.keys()].sort(
                (a, b) => (strongMap.get(b)?.length || 0) - (strongMap.get(a)?.length || 0)
              );

              return (
                <div
                  key={player.id}
                  className="rounded-lg border border-surface-500/30 bg-surface-700/20 px-3 py-2.5 space-y-2"
                >
                  <span className="text-xs font-bold text-slate-300">
                    {player.name}
                  </span>

                  {/* Weak to */}
                  {weakTo.size > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-red-400/80 uppercase tracking-wider font-semibold">
                        Weak
                      </span>
                      {(() => {
                        const weakTypes = ALL_TYPES.filter((t) => weakTo.has(t))
                          .sort((a, b) => (weakTo.get(b)?.length || 0) - (weakTo.get(a)?.length || 0));
                        return details ? (
                          <div className="space-y-1">
                            {weakTypes.map((t) => {
                              const isDanger = dangers.includes(t);
                              const refs = weakTo.get(t)!;
                              return (
                                <div key={t} className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-bold uppercase w-9 text-center py-0.5 rounded text-white/90 shrink-0 ${
                                      isDanger ? "ring-1 ring-red-400/60" : ""
                                    }`}
                                    style={{ backgroundColor: TYPE_COLORS[t] }}
                                  >
                                    {t.slice(0, 3)}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {refs.map((p) => (
                                      <img
                                        key={p.pokemonId}
                                        src={`${SPRITE_URL}${p.pokemonId}.png`}
                                        alt={p.name}
                                        title={p.name}
                                        className="w-7 h-7"
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-[3px]">
                            {weakTypes.map((t) => {
                              const isDanger = dangers.includes(t);
                              const count = weakTo.get(t)!.length;
                              return (
                                <span
                                  key={t}
                                  className={`text-[9px] font-bold uppercase px-1 py-[1px] rounded leading-tight text-white/90 ${
                                    isDanger ? "ring-1 ring-red-400/50" : ""
                                  }`}
                                  style={{ backgroundColor: TYPE_COLORS[t] }}
                                >
                                  {t.slice(0, 3)}
                                  {count > 1 && (
                                    <span className="ml-0.5 text-[7px]">{count}</span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Strong against */}
                  {strongTypes.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-green-400/80 uppercase tracking-wider font-semibold">
                        Strong
                      </span>
                      {details ? (
                        <div className="space-y-1">
                          {strongTypes.map((t) => {
                            const refs = strongMap.get(t)!;
                            return (
                              <div key={t} className="flex items-center gap-2">
                                <span
                                  className="text-[10px] font-bold uppercase w-9 text-center py-0.5 rounded text-white/70 shrink-0"
                                  style={{ backgroundColor: TYPE_COLORS[t] }}
                                >
                                  {t.slice(0, 3)}
                                </span>
                                <div className="flex items-center gap-1">
                                  {refs.map((p) => (
                                    <img
                                      key={p.pokemonId}
                                      src={`${SPRITE_URL}${p.pokemonId}.png`}
                                      alt={p.name}
                                      title={p.name}
                                      className="w-7 h-7"
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-[3px]">
                          {strongTypes.map((t) => (
                            <span
                              key={t}
                              className="text-[9px] font-bold uppercase px-1 py-[1px] rounded leading-tight text-white/70"
                              style={{ backgroundColor: TYPE_COLORS[t] }}
                            >
                              {t.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Danger line */}
                  {dangers.length > 0 && (
                    <div className="text-[10px] text-red-400/90 font-medium">
                      &#x26A0; {dangers.join(", ")} unresisted
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}

      {showChart && <TypeChartModal onClose={() => setShowChart(false)} />}
    </div>
  );
}
