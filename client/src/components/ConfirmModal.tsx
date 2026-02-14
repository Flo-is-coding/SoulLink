interface Props {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export default function ConfirmModal({
  title,
  description,
  confirmLabel,
  variant = "default",
  onConfirm,
  onCancel,
  children,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface-800 rounded-2xl w-full max-w-xs border border-surface-600 overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 text-center">
          <h3 className="text-sm font-bold mb-1">{title}</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        {children && (
          <div className="px-5 pb-3">{children}</div>
        )}

        <div className="flex gap-2 p-4 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 bg-surface-700 hover:bg-surface-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
