import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./icons";
import { Button } from "./ui";

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({ open, onClose, title, children, footer, size = "md", dismissible = true }) {
    const ref = useRef(null);
    const titleId = useId();
    const closeRef = useRef(onClose);
    useEffect(() => {
        closeRef.current = onClose;
    });

    useEffect(() => {
        if (!open) return undefined;
        const previous = document.activeElement;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const node = ref.current;
        const first = node?.querySelector("[data-autofocus]") || node?.querySelector(FOCUSABLE);
        (first || node)?.focus();

        const onKey = (e) => {
            if (e.key === "Escape" && dismissible) {
                e.stopPropagation();
                closeRef.current?.();
                return;
            }
            if (e.key !== "Tab" || !node) return;
            const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
            if (!items.length) {
                e.preventDefault();
                return;
            }
            const firstEl = items[0];
            const lastEl = items[items.length - 1];
            const active = document.activeElement;
            if (e.shiftKey && (active === firstEl || active === node)) {
                e.preventDefault();
                lastEl.focus();
            } else if (!e.shiftKey && active === lastEl) {
                e.preventDefault();
                firstEl.focus();
            } else if (!node.contains(active)) {
                e.preventDefault();
                firstEl.focus();
            }
        };
        document.addEventListener("keydown", onKey, true);
        return () => {
            document.removeEventListener("keydown", onKey, true);
            document.body.style.overflow = prevOverflow;
            if (previous instanceof HTMLElement && document.contains(previous)) previous.focus();
        };
    }, [open, dismissible]);

    if (!open) return null;
    const width = size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-md" : "max-w-lg";

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-spine/55" onClick={dismissible ? onClose : undefined} aria-hidden="true" />
            <div
                ref={ref}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-paper shadow-lift focus:outline-hidden sm:rounded-2xl ${width}`}
            >
                <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                    <h2 id={titleId} className="text-lg font-extrabold text-secondary">{title}</h2>
                    {dismissible && (
                        <button type="button" onClick={onClose} aria-label="Close dialog" className="-m-1 rounded-md p-1 text-muted hover:bg-sand">
                            <CloseIcon />
                        </button>
                    )}
                </div>
                <div className="overflow-y-auto px-5 py-4">{children}</div>
                {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
            </div>
        </div>,
        document.body,
    );
}

export function ConfirmDialog({
    open, onClose, onConfirm, title, children, confirmLabel = "Confirm",
    cancelLabel = "Cancel", danger = false, pending = false, error,
}) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            dismissible={!pending}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="quiet" onClick={onClose} disabled={pending} data-autofocus>{cancelLabel}</Button>
                    <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} pending={pending}>{confirmLabel}</Button>
                </>
            }
        >
            <div className="text-[15px] leading-relaxed text-ink">{children}</div>
            {error && <p role="alert" className="err mt-3">{error}</p>}
        </Dialog>
    );
}
