import { useState, useMemo } from "react";
import type { BoxLink, Player, FailedEncounter } from "../types";
import { TYPE_COLORS } from "../typeUtils";

interface Props {
  box: BoxLink[];
  players: Player[];
  failedEncounters: FailedEncounter[];
  onAddEncounter: () => void;
  onRemoveFailedEncounter: (encounterId: string) => void;
}

const SPRITE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

type RouteStatus = "caught" | "dead" | "failed";

interface RouteEntry {
  route: string;
  link: BoxLink | null;
  failedEncounter: FailedEncounter | null;
  status: RouteStatus;
}

export default function RouteOverview({ box, players, failedEncounters, onAddEncounter, onRemoveFailedEncounter }: Props) {
  const [expanded, setExpanded] = useState(true);

  const routes = useMemo(() => {
    const result: RouteEntry[] = [];
    for (const link of box) {
      const route = link.route || "Unknown";
      result.push({
        route,
        link,
        failedEncounter: null,
        status: link.is_dead ? "dead" : "caught",
      });
    }
    for (const fe of failedEncounters) {
      result.push({
        route: fe.route,
        link: null,
        failedEncounter: fe,
        status: "failed",
      });
    }
    // Sort: alive first, then failed, then dead, then by route name
    const order: Record<RouteStatus, number> = { caught: 0, failed: 1, dead: 2 };
    result.sort((a, b) => {
      if (a.status !== b.status) return order[a.status] - order[b.status];
      return a.route.localeCompare(b.route);
    });
    return result;
  }, [box, failedEncounters]);

  if (routes.length === 0) return null;

  const alive = routes.filter((r) => r.status === "caught").length;
  const dead = routes.filter((r) => r.status === "dead").length;
  const failed = routes.filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <span className="text-[10px] text-slate-500">
          {expanded ? "\u25BC" : "\u25B6"}
        </span>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Encounters
        </h2>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="text-green-400">{alive} alive</span>
          {failed > 0 && <span className="text-slate-400">{failed} failed</span>}
          {dead > 0 && <span className="text-red-400">{dead} dead</span>}
          <span>{routes.length} total</span>
        </div>
      </button>

      {expanded && (
        <div className="space-y-1">
          {routes.map((entry) => (
            <div
              key={entry.link?.link_group || entry.failedEncounter?.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left transition-all ${
                entry.status === "dead"
                  ? "bg-red-950/10 border-red-900/20 opacity-40"
                  : entry.status === "failed"
                  ? "bg-surface-800/40 border-surface-600/40 opacity-50"
                  : "bg-surface-700/40 border-surface-500/50"
              }`}
            >
              {/* Status dot */}
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  entry.status === "dead"
                    ? "bg-red-500"
                    : entry.status === "failed"
                    ? "bg-slate-500"
                    : "bg-green-500"
                }`}
              />

              {/* Route name */}
              <div className="w-28 shrink-0">
                <span className="text-[11px] text-slate-300 font-medium truncate block">
                  {entry.route}
                </span>
              </div>

              {/* Pokemon linked on this route OR failed label */}
              {entry.link ? (
                <div className="flex-1 flex items-center gap-2">
                  {players.map((player) => {
                    const pEntry = entry.link!.entries.find(
                      (e) => e.player_id === player.id
                    );
                    if (!pEntry) {
                      return (
                        <div
                          key={player.id}
                          className="flex-1 text-[10px] text-slate-600"
                        >
                          —
                        </div>
                      );
                    }
                    const types = pEntry.pokemon_types?.split(",") || [];
                    return (
                      <div
                        key={pEntry.id}
                        className="flex-1 flex items-center gap-1 min-w-0"
                      >
                        <img
                          src={`${SPRITE_URL}${pEntry.pokemon_id}.png`}
                          alt={pEntry.pokemon_name}
                          className={`w-6 h-6 object-contain shrink-0 ${
                            pEntry.is_dead ? "grayscale" : ""
                          }`}
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-medium capitalize truncate block leading-tight">
                            {pEntry.nickname || pEntry.pokemon_name}
                          </span>
                          <div className="flex gap-0.5">
                            {types.map((t) => (
                              <span
                                key={t}
                                className="text-[6px] font-bold uppercase px-0.5 rounded-sm text-white/70 leading-tight"
                                style={{ backgroundColor: TYPE_COLORS[t] || "#888" }}
                              >
                                {t.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : entry.failedEncounter && entry.failedEncounter.pokemon.length > 0 ? (
                <div className="flex-1 flex items-center gap-2">
                  {players.map((player) => {
                    const fp = entry.failedEncounter!.pokemon.find(
                      (p) => p.player_id === player.id
                    );
                    if (!fp) {
                      return (
                        <div key={player.id} className="flex-1 text-[10px] text-slate-600">
                          —
                        </div>
                      );
                    }
                    const types = fp.pokemon_types?.split(",") || [];
                    return (
                      <div key={fp.id} className="flex-1 flex items-center gap-1 min-w-0">
                        <img
                          src={`${SPRITE_URL}${fp.pokemon_id}.png`}
                          alt={fp.pokemon_name}
                          className="w-6 h-6 object-contain shrink-0 grayscale opacity-60"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-medium capitalize truncate block leading-tight text-slate-500">
                            {fp.pokemon_name}
                          </span>
                          <div className="flex gap-0.5">
                            {types.map((t) => (
                              <span
                                key={t}
                                className="text-[6px] font-bold uppercase px-0.5 rounded-sm text-white/50 leading-tight"
                                style={{ backgroundColor: TYPE_COLORS[t] || "#888" }}
                              >
                                {t.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 italic">
                    Failed — no catch
                  </span>
                </div>
              )}

              {/* In-team / status indicators */}
              {entry.link?.entries.some((e) => e.in_team) && (
                <span className="text-[8px] text-blue-400 font-semibold shrink-0">
                  TEAM
                </span>
              )}
              {entry.status === "dead" && (
                <span className="text-[9px] text-red-500 shrink-0">&#x2620;</span>
              )}
              {entry.status === "failed" && entry.failedEncounter && (
                <button
                  onClick={() => onRemoveFailedEncounter(entry.failedEncounter!.id)}
                  className="text-[9px] text-slate-600 hover:text-red-400 transition-colors shrink-0"
                  title="Remove failed encounter"
                >
                  &times;
                </button>
              )}
            </div>
          ))}

          {/* Add encounter hint */}
          <button
            onClick={onAddEncounter}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-surface-500/50 text-[10px] text-slate-500 hover:text-slate-300 hover:border-surface-400 transition-colors"
          >
            <span>+</span>
            <span>New Encounter</span>
          </button>
        </div>
      )}
    </div>
  );
}
