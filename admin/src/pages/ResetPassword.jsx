import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordInput } from "../components/PasswordInput";
import { Button, Field, LinkButton } from "../components/ui";
import { describedBy } from "../lib/util";
import { api, errorText } from "../api";
import { useTitle } from "../lib/hooks";
import { getRecaptchaToken, loadRecaptcha } from "../lib/recaptcha";

// Read the link params once, then remove them from the address bar so the
// token never stays in history, screenshots or a copied URL.
// The result is cached at module level because React StrictMode runs state
// initializers twice in development and the second run would see an empty URL.
let cachedLink = { token: "", id: "" };
function readLinkParams() {
    if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        cachedLink = { token: params.get("token") || "", id: params.get("id") || "" };
        window.history.replaceState(window.history.state, "", window.location.pathname);
    }
    return cachedLink;
}

export default function ResetPassword() {
    useTitle("Choose a new password");
    useEffect(() => { loadRecaptcha(); }, []);
    const [link] = useState(readLinkParams);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [pending, setPending] = useState(false);
    const [done, setDone] = useState(false);

    const invalidLink = !link.token || !link.id;

    const submit = async (e) => {
        e.preventDefault();
        const next = {};
        if (password.length < 8) next.password = "Use at least 8 characters.";
        else if (password.length > 128) next.password = "Use 128 characters or fewer.";
        if (confirm !== password) next.confirm = "The passwords don't match.";
        setErrors(next);
        setFormError("");
        if (Object.keys(next).length) return;

        setPending(true);
        try {
            await api.post("/auth/password/reset", { userId: link.id, token: link.token, password, recaptchaToken: await getRecaptchaToken("reset_password") });
            setDone(true);
        } catch (err) {
            if (err.status === 400) {
                setFormError(err.message || "This link is invalid or has expired.");
            } else {
                setFormError(errorText(err));
            }
        } finally {
            setPending(false);
        }
    };

    if (done) {
        return (
            <AuthLayout title="Password updated" subtitle="You can now sign in with your new password.">
                <LinkButton to="/login" className="w-full">Go to sign in</LinkButton>
            </AuthLayout>
        );
    }

    if (invalidLink) {
        return (
            <AuthLayout title="This link doesn't work" subtitle="The reset link is missing information. Request a new one and use the link from the latest email.">
                <LinkButton to="/forgot-password" className="w-full">Request a new link</LinkButton>
                <p className="mt-6 text-sm">
                    <Link to="/login" className="font-semibold text-primaryDark underline underline-offset-2">Back to sign in</Link>
                </p>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Choose a new password" subtitle="Use 8 to 128 characters.">
            <form onSubmit={submit} noValidate className="space-y-5">
                {formError && (
                    <div role="alert" className="rounded-lg border border-danger/30 bg-red-50 px-3 py-2.5 text-sm font-medium text-danger">
                        {formError}{" "}
                        <Link to="/forgot-password" className="underline">Request a new link</Link>
                    </div>
                )}
                <Field id="password" label="New password" error={errors.password}>
                    <PasswordInput
                        id="password"
                        value={password}
                        onChange={setPassword}
                        autoComplete="new-password"
                        invalid={!!errors.password}
                        describedBy={describedBy("password", null, errors.password)}
                    />
                </Field>
                <Field id="confirm" label="Confirm new password" error={errors.confirm}>
                    <PasswordInput
                        id="confirm"
                        value={confirm}
                        onChange={setConfirm}
                        autoComplete="new-password"
                        invalid={!!errors.confirm}
                        describedBy={describedBy("confirm", null, errors.confirm)}
                    />
                </Field>
                <Button type="submit" pending={pending} className="w-full">Update password</Button>
                <p className="text-xs text-muted">
                        This site is protected by reCAPTCHA and the Google{" "}
                        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline">Privacy Policy</a> and{" "}
                        <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline">Terms of Service</a> apply.
                    </p>
            </form>
        </AuthLayout>
    );
}
