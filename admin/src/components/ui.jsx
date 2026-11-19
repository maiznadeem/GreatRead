import { Link } from "react-router-dom";
import { ImageIcon, SearchIcon } from "./icons";
import { safeImage } from "../lib/util";

export function Spinner({ className = "" }) {
    return (
        <span
            aria-hidden="true"
            className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
        />
    );
}

export function Button({ variant = "primary", size, pending, children, className = "", ...rest }) {
    return (
        <button
            type="button"
            className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`}
            {...rest}
            disabled={pending || rest.disabled}
        >
            {pending && <Spinner />}
            {children}
        </button>
    );
}

export function LinkButton({ variant = "primary", size, className = "", ...rest }) {
    return <Link className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`} {...rest} />;
}

export function Field({ id, label, hint, error, children }) {
    return (
        <div>
            <label htmlFor={id} className="label">{label}</label>
            {children}
            {hint && !error && <p id={`${id}-hint`} className="hint">{hint}</p>}
            {error && <p id={`${id}-err`} role="alert" className="err">{error}</p>}
        </div>
    );
}

export function Cover({ src, alt = "", className = "" }) {
    const url = safeImage(src);
    return (
        <div className={`relative aspect-[2/3] overflow-hidden rounded-md bg-sand shadow-lift ${className}`}>
            {url ? (
                <img src={url} alt={alt} loading="lazy" className="h-full w-full object-cover" />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-muted/60">
                    <ImageIcon size={28} />
                </div>
            )}
        </div>
    );
}

export function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
                <h1 className="text-2xl font-extrabold text-secondary sm:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 max-w-prose text-[15px] text-muted">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}

export function EmptyState({ title, children, action }) {
    return (
        <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
            <p className="text-lg font-bold text-secondary">{title}</p>
            {children && <p className="max-w-sm text-[15px] text-muted">{children}</p>}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}

export function ErrorState({ error, onRetry }) {
    return (
        <div role="alert" className="card flex flex-col items-center gap-3 border-danger/30 px-6 py-12 text-center">
            <p className="text-lg font-bold text-danger">This page didn&apos;t load</p>
            <p className="max-w-sm text-[15px] text-muted">{error?.message || "Something went wrong."}</p>
            {onRetry && <Button variant="quiet" onClick={onRetry}>Try again</Button>}
        </div>
    );
}

export function SearchBox({ value, onChange, placeholder, label = "Search" }) {
    return (
        <div className="relative w-full sm:max-w-sm">
            <label htmlFor="search" className="sr-only">{label}</label>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <SearchIcon size={18} />
            </span>
            <input
                id="search"
                type="search"
                value={value}
                maxLength={100}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="input pl-10"
                autoComplete="off"
            />
        </div>
    );
}
