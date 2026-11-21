import { RECAPTCHA_SITE_KEY } from "../config";

let loading = null;

// Injects the reCAPTCHA Enterprise script once. Resolves to false if it can't load.
export function loadRecaptcha() {
    loading ??= new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
    return loading;
}

// Returns a fresh single-use token for the action, or null if reCAPTCHA is unavailable.
export async function getRecaptchaToken(action) {
    try {
        if (!(await loadRecaptcha())) return null;
        const { enterprise } = window.grecaptcha;
        await new Promise((resolve) => enterprise.ready(resolve));
        return await enterprise.execute(RECAPTCHA_SITE_KEY, { action });
    } catch {
        return null;
    }
}
