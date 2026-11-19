import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Button, Field } from "../components/ui";
import { describedBy } from "../lib/util";
import { api, errorText } from "../api";
import { useTitle } from "../lib/hooks";

export default function ForgotPassword() {
    useTitle("Forgot password");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setError("Enter your email address.");
            return;
        }
        setError("");
        setPending(true);
        try {
            const d = await api.post("/auth/password/forgot", { email: email.trim() });
            setMessage(d?.message || "If that email belongs to an admin account, a reset link is on its way.");
        } catch (err) {
            setError(errorText(err));
        } finally {
            setPending(false);
        }
    };

    const back = (
        <Link to="/login" className="font-semibold text-primaryDark underline underline-offset-2 hover:text-secondary">
            Back to sign in
        </Link>
    );

    return (
        <AuthLayout
            title="Reset your password"
            subtitle="Enter your email and we'll send a link to choose a new password."
            footer={back}
        >
            {message ? (
                <p role="status" className="rounded-lg border border-line bg-white px-4 py-3 text-[15px] leading-relaxed">
                    {message}
                </p>
            ) : (
                <form onSubmit={submit} noValidate className="space-y-5">
                    <Field id="email" label="Email" error={error}>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={describedBy("email", null, error)}
                            className="input"
                        />
                    </Field>
                    <Button type="submit" pending={pending} className="w-full">
                        Send reset link
                    </Button>
                </form>
            )}
        </AuthLayout>
    );
}
