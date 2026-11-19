import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";

export function PasswordInput({ id, value, onChange, autoComplete, describedBy, invalid, maxLength = 128 }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete={autoComplete}
                maxLength={maxLength}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                className="input pr-11"
            />
            <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:bg-sand"
            >
                {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
        </div>
    );
}
