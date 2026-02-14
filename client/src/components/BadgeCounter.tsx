import { GENERATIONS } from "../generations";
import { TYPE_COLORS } from "../typeUtils";

interface Props {
  generation: number;
  badges: number;
  onUpdateBadges: (badges: number) => void;
}

const BADGE_SPRITE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/";

export default function BadgeCounter({
  generation,
  badges,
  onUpdateBadges,
}: Props) {
  const gen = GENERATIONS.find((g) => g.id === generation);
  if (!gen) return null;

  function toggleBadge(index: number) {
    onUpdateBadges(badges ^ (1 << index));
  }

  const earnedCount = gen.badges.filter((_, i) => badges & (1 << i)).length;

  const nextBadgeIndex = gen.badges.findIndex((_, i) => !(badges & (1 << i)));
  const nextBadge = nextBadgeIndex !== -1 ? gen.badges[nextBadgeIndex] : null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold shrink-0">
        {earnedCount}/{gen.badges.length}
      </span>
      <div className="flex gap-1.5">
        {gen.badges.map((badge, i) => {
          const earned = !!(badges & (1 << i));
          const typeColor = TYPE_COLORS[badge.type] || "#888";

          return (
            <button
              key={i}
              onClick={() => toggleBadge(i)}
              title={`${badge.name} Badge (${badge.type}) — Lv ${badge.levelCap}`}
              className="group relative"
            >
              {badge.spriteId ? (
                <img
                  src={`${BADGE_SPRITE_URL}${badge.spriteId}.png`}
                  alt={`${badge.name} Badge`}
                  className={`w-9 h-9 object-contain transition-all ${
                    earned
                      ? "drop-shadow-[0_0_6px_var(--glow)]"
                      : "grayscale opacity-25 hover:opacity-40 hover:grayscale-[50%]"
                  }`}
                  style={{
                    "--glow": typeColor + "80",
                  } as React.CSSProperties}
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-full transition-all ${
                    earned
                      ? "drop-shadow-[0_0_6px_var(--glow)]"
                      : "opacity-25 grayscale hover:opacity-40"
                  }`}
                  style={{
                    "--glow": typeColor + "80",
                    background: earned
                      ? `linear-gradient(135deg, ${typeColor}, ${typeColor}88)`
                      : "#475569",
                  } as React.CSSProperties}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Level Cap */}
      {nextBadge ? (
        <div className="flex items-center gap-2 ml-2 px-2.5 py-1 rounded-lg bg-surface-700/60 border border-surface-500/40">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            Lv Cap
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-amber-400 tabular-nums" title="Lead Pokemon">
              {nextBadge.levelCap}
            </span>
            <span className="text-[9px] text-slate-600">/</span>
            <span className="text-sm font-bold text-amber-400/60 tabular-nums" title="Rest of team">
              {nextBadge.levelCap - 2}
            </span>
          </div>
          <span className="text-[9px] text-slate-600" title={`${nextBadge.name} Badge`}>
            ({nextBadge.name})
          </span>
        </div>
      ) : earnedCount > 0 ? (
        <div className="flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-lg bg-surface-700/60 border border-surface-500/40">
          <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">
            All Badges
          </span>
        </div>
      ) : null}
    </div>
  );
}
