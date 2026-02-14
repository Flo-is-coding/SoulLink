import { GENERATIONS } from "../generations";
import { TYPE_COLORS } from "../typeUtils";

interface Props {
  generation: number;
  badges: number;
  onUpdateBadges: (badges: number) => void;
}

// 8 distinctive clip-path shapes for badges
const BADGE_SHAPES: string[] = [
  // 1: Octagon
  "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
  // 2: Water drop / teardrop
  "polygon(50% 0%, 85% 35%, 100% 65%, 85% 85%, 65% 100%, 35% 100%, 15% 85%, 0% 65%, 15% 35%)",
  // 3: Lightning / angular
  "polygon(40% 0%, 80% 0%, 55% 40%, 90% 40%, 30% 100%, 45% 55%, 10% 55%)",
  // 4: Star / flower
  "polygon(50% 0%, 63% 30%, 98% 35%, 72% 57%, 79% 91%, 50% 73%, 21% 91%, 28% 57%, 2% 35%, 37% 30%)",
  // 5: Heart / shield
  "polygon(50% 15%, 70% 0%, 95% 0%, 100% 25%, 100% 50%, 50% 100%, 0% 50%, 0% 25%, 5% 0%, 30% 0%)",
  // 6: Hexagon
  "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
  // 7: Flame / pentagon-up
  "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
  // 8: Diamond
  "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
];

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
      <div className="flex gap-2">
        {gen.badges.map((badge, i) => {
          const earned = !!(badges & (1 << i));
          const typeColor = TYPE_COLORS[badge.type] || "#888";
          const shape = BADGE_SHAPES[i % BADGE_SHAPES.length];

          return (
            <button
              key={i}
              onClick={() => toggleBadge(i)}
              title={`${badge.name} Badge (${badge.type}) — Lv ${badge.levelCap}`}
              className="group relative flex flex-col items-center gap-0.5"
            >
              {/* Badge shape */}
              <div
                className={`w-8 h-8 transition-all ${
                  earned
                    ? "scale-100 drop-shadow-[0_0_6px_var(--glow)]"
                    : "scale-90 opacity-30 grayscale hover:opacity-50 hover:grayscale-0"
                }`}
                style={{
                  "--glow": typeColor + "80",
                } as React.CSSProperties}
              >
                <div
                  className="w-full h-full relative"
                  style={{ clipPath: shape }}
                >
                  {/* Gradient fill */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: earned
                        ? `linear-gradient(135deg, ${typeColor} 0%, ${typeColor}cc 50%, ${typeColor}88 100%)`
                        : `linear-gradient(135deg, #475569 0%, #334155 100%)`,
                    }}
                  />
                  {/* Shine overlay */}
                  {earned && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)",
                      }}
                    />
                  )}
                </div>
              </div>
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
