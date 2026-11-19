import { useCallback, useEffect, useState } from "react";
import { api } from "../api";

export function useDebounced(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export function useTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} · GreatRead Admin` : "GreatRead Admin";
    }, [title]);
}

export function useFetch(path) {
    const [state, setState] = useState({ data: null, error: null, loading: !!path });
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!path) return undefined;
        const ctrl = new AbortController();
        setState((s) => ({ ...s, loading: true, error: null }));
        api.get(path, { signal: ctrl.signal })
            .then((data) => setState({ data, error: null, loading: false }))
            .catch((error) => {
                if (error?.name !== "AbortError") setState((s) => ({ ...s, error, loading: false }));
            });
        return () => ctrl.abort();
    }, [path, tick]);

    const reload = useCallback(() => setTick((t) => t + 1), []);
    return { ...state, reload };
}
