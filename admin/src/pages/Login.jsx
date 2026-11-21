import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordInput } from "../components/PasswordInput";
import { Button, Field } from "../components/ui";
import { describedBy } from "../lib/util";
import { PageLoader } from "../components/Shell";
import { errorText } from "../api";
import { useAuth } from "../lib/auth-context";
import { useTitle } from "../lib/hooks";
import { loadRecaptcha } from "../lib/recaptcha";

export default function Login() {
    useTitle("Sign in");
    useEffect(() => { loadRecaptcha(); }, []);
    const { status, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = typeof location.state?.from === "string" && location.state.from.startsWith("/") ? location.state.from : "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [pending, setPending] = useState(false);

    if (status === "loading") return <PageLoader />;
    if (status === "authed" && !pending) return <Navigate to={from} replace />;

    const submit = async (e) => {
        e.preventDefault();
        const next = {};
        if (!email.trim()) next.email = "Enter your email address.";
        if (!password) next.password = "Enter your password.";
        setErrors(next);
        setFormError("");
        if (Object.keys(next).length) return;

        setPending(true);
        try {
            await login(email.trim(), password);
            navigate(from, { replace: true });
        } catch (err) {
            setFormError(errorText(err));
            setPending(false);
        }
    };

    return (
        <AuthLayout title="Sign in" subtitle="Use your admin account to manage books, categories and top picks.">
            <form onSubmit={submit} noValidate className="space-y-5">
                {formError && (
                    <p role="alert" className="rounded-lg border border-danger/30 bg-red-50 px-3 py-2.5 text-sm font-medium text-danger">
                        {formError}
                    </p>
                )}
                <Field id="email" label="Email" error={errors.email}>
                    <input
                        id="email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={describedBy("email", null, errors.email)}
                        className="input"
                    />
                </Field>
                <Field id="password" label="Password" error={errors.password}>
                    <PasswordInput
                        id="password"
                        value={password}
                        onChange={setPassword}
                        autoComplete="current-password"
                        invalid={!!errors.password}
                        describedBy={describedBy("password", null, errors.password)}
                    />
                </Field>
                <Button type="submit" pending={pending} className="w-full">
                    {pending ? "Signing in" : "Sign in"}
                </Button>
                <p className="text-xs text-muted">
                        This site is protected by reCAPTCHA and the Google{" "}
                        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline">Privacy Policy</a> and{" "}
                        <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline">Terms of Service</a> apply.
                    </p>
            </form>
            <p className="mt-6 text-sm">
                <Link to="/forgot-password" className="font-semibold text-primaryDark underline underline-offset-2 hover:text-secondary">
                    Forgot your password?
                </Link>
            </p>
        </AuthLayout>
    );
}
