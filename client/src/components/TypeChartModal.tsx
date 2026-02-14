import { TYPE_COLORS, EFFECTIVENESS } from "../typeUtils";

interface Props {
  onClose: () => void;
}

const TYPES = Object.keys(TYPE_COLORS);

function getEff(atk: string, def: string): number {
  return EFFECTIVENESS[atk]?.[def] ?? 1;
}

function cellLabel(mult: number): string {
  if (mult === 0) return "0";
  if (mult === 0.5) return "\u00BD";
  if (mult === 2) return "2";
  return "";
}

function cellClass(mult: number): string {
  if (mult === 0) return "bg-zinc-900 text-zinc-500";
  if (mult === 0.5) return "bg-red-950/60 text-red-300/70";
  if (mult === 2) return "bg-green-900/60 text-green-300";
  return "";
}

export default function TypeChartModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-800 rounded-2xl border border-surface-600 max-w-[95vw] max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-surface-700 flex items-center justify-between sticky top-0 bg-surface-800 z-10">
          <h2 className="text-sm font-semibold">Type Chart</h2>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-300 transition-colors text-sm"
          >
            &times;
          </button>
        </div>

        <div className="p-3">
          <div className="text-[9px] text-slate-500 mb-2">
            ATK &rarr; / DEF &darr;
          </div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-7 h-7" />
                {TYPES.map((t) => (
                  <th key={t} className="p-0">
                    <div
                      className="w-7 h-7 flex items-center justify-center text-[7px] font-bold uppercase text-white/90 rounded-sm m-px"
                      style={{ backgroundColor: TYPE_COLORS[t] }}
                    >
                      {t.slice(0, 3)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TYPES.map((def) => (
                <tr key={def}>
                  <td className="p-0">
                    <div
                      className="w-7 h-7 flex items-center justify-center text-[7px] font-bold uppercase text-white/90 rounded-sm m-px"
                      style={{ backgroundColor: TYPE_COLORS[def] }}
                    >
                      {def.slice(0, 3)}
                    </div>
                  </td>
                  {TYPES.map((atk) => {
                    const mult = getEff(atk, def);
                    return (
                      <td key={atk} className="p-0">
                        <div
                          className={`w-7 h-7 flex items-center justify-center text-[9px] font-bold rounded-sm m-px ${cellClass(mult)}`}
                        >
                          {cellLabel(mult)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-4 mt-3 text-[9px] text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-green-900/60" />
              <span>2x (super effective)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-red-950/60" />
              <span>&frac12;x (not very effective)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-zinc-900" />
              <span>0x (immune)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
