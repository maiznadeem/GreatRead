import { LinkButton } from "../components/ui";
import { useTitle } from "../lib/hooks";

export default function NotFound() {
    useTitle("Page not found");
    return (
        <main className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-6xl font-extrabold text-primary">404</p>
            <h1 className="text-2xl font-extrabold text-secondary">That page isn&apos;t on the shelf</h1>
            <p className="max-w-sm text-[15px] text-muted">The address may be mistyped, or the page was moved.</p>
            <LinkButton to="/" className="mt-3">Back to the dashboard</LinkButton>
        </main>
    );
}
