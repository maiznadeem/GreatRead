import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { api, setUnauthorizedHandler } from "../api";
import { AuthContext } from "../lib/auth-context";
import { getRecaptchaToken } from "../lib/recaptcha";
import { ToastProvider } from "./ToastProvider";

const NO_SESSION_CHECK = ["/forgot-password", "/reset-password"];

export function Providers() {
    const { pathname } = useLocation();
    const [state, setState] = useState(() => ({
        status: NO_SESSION_CHECK.includes(pathname) ? "anon" : "loading",
        user: null,
    }));

    // Check the session once on first load. Later changes come from login, logout or a 401.
    useEffect(() => {
        if (NO_SESSION_CHECK.includes(window.location.pathname)) return undefined;
        const ctrl = new AbortController();
        api.get("/auth/session", { signal: ctrl.signal })
            .then((d) => setState({ status: "authed", user: d.user }))
            .catch((err) => {
                if (err?.name !== "AbortError") setState({ status: "anon", user: null });
            });
        return () => ctrl.abort();
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(() => setState({ status: "anon", user: null }));
        return () => setUnauthorizedHandler(null);
    }, []);

    const login = useCallback(async (email, password) => {
        const d = await api.post("/auth/login", { email, password, recaptchaToken: await getRecaptchaToken("login") });
        setState({ status: "authed", user: d.user });
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            setState({ status: "anon", user: null });
        }
    }, []);

    const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            <ToastProvider>
                <Outlet />
            </ToastProvider>
        </AuthContext.Provider>
    );
}
