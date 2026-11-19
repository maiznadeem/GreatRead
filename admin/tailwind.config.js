/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    // Button variants are built dynamically (`btn-${variant}`), so Tailwind can't see them in the source.
    safelist: ["btn-primary", "btn-quiet", "btn-danger", "btn-ghost", "btn-sm"],
    theme: {
        extend: {
            fontFamily: { sans: ['"Manrope Variable"', "system-ui", "sans-serif"] },
            colors: {
                primary: "#956829",
                primaryDark: "#8D5E20",
                secondary: "#623A06",
                paper: "#FFF8EC",
                sand: "#F2EADF",
                ink: "#2B1A08",
                muted: "#6B5A45",
                line: "#E6D9C5",
                spine: "#3A2306",
                danger: "#A32A1C",
                ok: "#2F6B3B",
            },
            boxShadow: {
                lift: "0 1px 2px rgba(60,35,6,.08), 0 8px 24px -12px rgba(60,35,6,.25)",
            },
        },
    },
    plugins: [],
};
