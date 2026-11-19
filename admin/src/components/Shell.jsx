import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { useToast } from "../lib/toast-context";
import { BookIcon, CloseIcon, HomeIcon, LogoutIcon, MenuIcon, StarIcon, TagIcon } from "./icons";
import { Spinner } from "./ui";

const NAV = [
    { to: "/", label: "Dashboard", icon: HomeIcon, end: true },
    { to: "/books", label: "Books", icon: BookIcon },
    { to: "/categories", label: "Categories", icon: TagIcon },
    { to: "/top-picks", label: "Top picks", icon: StarIcon },
];

export function PageLoader() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-paper text-primaryDark" role="status" aria-label="Loading">
            <Spinner className="!h-6 !w-6" />
        </div>
    );
}

export function RequireAuth() {
    const { status } = useAuth();
    const location = useLocation();
    if (status === "loading") return <PageLoader />;
    if (status === "anon") return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    return <Shell />;
}

function NavList({ onNavigate }) {
    return (
        <nav aria-label="Main" className="flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-colors ${
                            isActive ? "bg-white/12 text-white shadow-[inset_3px_0_0_#E9C07A]" : "text-sand/80 hover:bg-white/8 hover:text-white"
                        }`
                    }
                >
                    <Icon />
                    {label}
                </NavLink>
            ))}
        </nav>
    );
}

function Brand() {
    return (
        <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="" width="36" height="28" className="h-7 w-auto brightness-0 invert" />
            <div className="leading-tight">
                <p className="text-[17px] font-extrabold text-white">GreatRead</p>
                <p className="text-xs text-sand/70">Admin</p>
            </div>
        </div>
    );
}

function UserBox() {
    const { user, logout } = useAuth();
    const toast = useToast();
    const [pending, setPending] = useState(false);

    const signOut = async () => {
        setPending(true);
        try {
            await logout();
        } catch {
            toast.error("Couldn't sign out. Try again.");
            setPending(false);
        }
    };

    return (
        <div className="border-t border-white/15 pt-4">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="truncate text-[13px] text-sand/70">{user?.email}</p>
            <button
                type="button"
                onClick={signOut}
                disabled={pending}
                className="mt-3 flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-sm font-semibold text-sand hover:bg-white/10 disabled:opacity-60"
            >
                <LogoutIcon size={18} />
                Sign out
            </button>
        </div>
    );
}

function Shell() {
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    return (
        <div className="min-h-screen lg:pl-64">
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold">
                Skip to content
            </a>

            <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between bg-spine px-4 py-6 lg:flex">
                <div className="flex flex-col gap-8">
                    <button type="button" onClick={() => navigate("/")} className="rounded-lg text-left" aria-label="GreatRead Admin home">
                        <Brand />
                    </button>
                    <NavList />
                </div>
                <UserBox />
            </aside>

            <header className="sticky top-0 z-30 flex items-center justify-between bg-spine px-4 py-3 lg:hidden">
                <Brand />
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Open menu"
                    aria-expanded={open}
                    className="rounded-lg p-2 text-white hover:bg-white/10"
                >
                    <MenuIcon />
                </button>
            </header>

            {open && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
                    <div role="dialog" aria-modal="true" aria-label="Menu" className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col justify-between bg-spine px-4 py-5">
                        <div className="flex flex-col gap-8">
                            <div className="flex items-center justify-between">
                                <Brand />
                                <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-white hover:bg-white/10" autoFocus>
                                    <CloseIcon />
                                </button>
                            </div>
                            <NavList onNavigate={() => setOpen(false)} />
                        </div>
                        <UserBox />
                    </div>
                </div>
            )}

            <main id="main" key={pathname.split("/")[1]} className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
                <Outlet />
            </main>
        </div>
    );
}
