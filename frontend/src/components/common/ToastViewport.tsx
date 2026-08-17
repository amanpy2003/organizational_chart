import { CheckCircle2, Info, XCircle, X } from "lucide-react";
import clsx from "clsx";

import { useToastStore } from "@/store/toastStore";

const ICONS = {
  success: <CheckCircle2 size={18} className="text-emerald-600" />,
  error: <XCircle size={18} className="text-red-600" />,
  info: <Info size={18} className="text-brand-600" />,
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            "flex items-start gap-2.5 rounded-lg border bg-white px-3.5 py-3 shadow-panel animate-in slide-in-from-bottom-2 fade-in",
            t.variant === "error" ? "border-red-100" : t.variant === "success" ? "border-emerald-100" : "border-brand-100"
          )}
        >
          {ICONS[t.variant]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-900">{t.title}</p>
            {t.description && <p className="mt-0.5 text-xs text-ink-500">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-ink-300 hover:text-ink-600">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
