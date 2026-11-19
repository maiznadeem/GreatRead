import { API_BASE_URL } from "./config";

export class ApiError extends Error {
    constructor(message, { status = 0, code, retryAfter } = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.retryAfter = retryAfter;
    }
}

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
    onUnauthorized = fn;
}

const NO_REDIRECT_ON_401 = ["/auth/session", "/auth/login"];

function parseRetryAfter(res) {
    const raw = res.headers.get("Retry-After") ?? res.headers.get("RateLimit-Reset");
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
    const date = raw ? Date.parse(raw) : NaN;
    return Number.isNaN(date) ? undefined : Math.max(1, Math.ceil((date - Date.now()) / 1000));
}

async function request(path, { method = "GET", json, body, signal } = {}) {
    const headers = { Accept: "application/json" };
    let payload = body;
    if (json !== undefined) {
        headers["Content-Type"] = "application/json";
        payload = JSON.stringify(json);
    }

    let res;
    try {
        res = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers,
            body: payload,
            credentials: "include",
            signal,
        });
    } catch (err) {
        if (err?.name === "AbortError") throw err;
        throw new ApiError("Can't reach the server. Check your connection and try again.");
    }

    if (res.status === 204) return null;

    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (res.ok) return data;

    const error = new ApiError(data?.error || `Request failed (${res.status}).`, {
        status: res.status,
        code: data?.code,
        retryAfter: res.status === 429 ? parseRetryAfter(res) : undefined,
    });
    if (res.status === 401 && !NO_REDIRECT_ON_401.includes(path.split("?")[0])) {
        onUnauthorized?.();
    }
    throw error;
}

export const api = {
    get: (path, opts) => request(path, opts),
    post: (path, bodyOrJson) =>
        bodyOrJson instanceof FormData
            ? request(path, { method: "POST", body: bodyOrJson })
            : request(path, { method: "POST", json: bodyOrJson }),
    put: (path, bodyOrJson) =>
        bodyOrJson instanceof FormData
            ? request(path, { method: "PUT", body: bodyOrJson })
            : request(path, { method: "PUT", json: bodyOrJson }),
    del: (path) => request(path, { method: "DELETE" }),
};

export function retryMessage(err) {
    if (err?.status !== 429) return null;
    const mins = err.retryAfter ? Math.max(1, Math.ceil(err.retryAfter / 60)) : null;
    return mins
        ? `Too many attempts, try again in ${mins} ${mins === 1 ? "minute" : "minutes"}.`
        : "Too many attempts, try again in a few minutes.";
}

export function errorText(err) {
    return retryMessage(err) || err?.message || "Something went wrong. Try again.";
}
