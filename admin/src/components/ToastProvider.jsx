import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "../lib/toast-context";
import { AlertIcon, CheckIcon, CloseIcon } from "./icons";

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(1);

    const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
    const push = useCallback(
        (kind, message) => {
            const id = nextId.current++;
            setToasts((t) => [...t.slice(-3), { id, kind, message }]);
            setTimeout(() => dismiss(id), kind === "error" ? 8000 : 4500);
        },
        [dismiss],
    );
    const value = useMemo(
        () => ({ success: (m) => push("success", m), error: (m) => push("error", m) }),
        [push],
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                className="pointer-events-none fixed inset-x-0 bottom-4 z-60 flex flex-col items-center gap-2 px-4"
                role="region"
                aria-label="Notifications"
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role={t.kind === "error" ? "alert" : "status"}
                        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lift ${
                            t.kind === "error" ? "bg-danger" : "bg-spine"
                        }`}
                    >
                        <span className="mt-0.5 shrink-0">
                            {t.kind === "error" ? <AlertIcon size={18} /> : <CheckIcon size={18} />}
                        </span>
                        <span className="min-w-0 flex-1 wrap-break-word">{t.message}</span>
                        <button
                            type="button"
                            onClick={() => dismiss(t.id)}
                            aria-label="Dismiss notification"
                            className="shrink-0 rounded-sm p-0.5 hover:bg-white/15"
                        >
                            <CloseIcon size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
