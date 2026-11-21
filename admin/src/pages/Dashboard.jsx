import { Link } from "react-router-dom";
import { Cover, ErrorState, LinkButton, PageHeader } from "../components/ui";
import { useAuth } from "../lib/auth-context";
import { useFetch, useTitle } from "../lib/hooks";
import { MONTHS } from "../lib/util";

function Stat({ label, value, to }) {
    return (
        <Link to={to} className="card block px-5 py-4 transition-shadow hover:shadow-lift">
            <p className="text-sm font-semibold text-muted">{label}</p>
            <p className="mt-1 text-3xl font-extrabold text-secondary">{value ?? <span className="skeleton inline-block h-8 w-12 align-middle" />}</p>
        </Link>
    );
}

export default function Dashboard() {
    useTitle("Dashboard");
    const { user } = useAuth();
    const stats = useFetch("/admin/stats");
    const picks = useFetch("/admin/toppicks");

    const s = stats.data;
    const books = picks.data?.books ?? [];
    const period = picks.data?.month && picks.data?.year
        ? `${MONTHS[picks.data.month - 1]} ${picks.data.year}`
        : s?.topPicks
            ? `${MONTHS[s.topPicks.month - 1]} ${s.topPicks.year}`
            : null;
    const firstName = (user?.name || "").split(" ")[0];

    return (
        <>
            <PageHeader
                title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
                subtitle="A quick look at the library and what readers see first."
                actions={
                    <>
                        <LinkButton to="/books/new">Add book</LinkButton>
                        <LinkButton to="/categories?new=1" variant="quiet">Add category</LinkButton>
                    </>
                }
            />

            {stats.error ? (
                <ErrorState error={stats.error} onRetry={stats.reload} />
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Stat label="Books" value={s?.books} to="/books" />
                    <Stat label="Categories" value={s?.categories} to="/categories" />
                </div>
            )}

            <section aria-labelledby="picks-title" className="mt-8">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 id="picks-title" className="text-xl font-extrabold text-secondary">Current top picks</h2>
                        <p className="text-sm text-muted">{period ? `Showing for ${period}.` : "No picks have been chosen yet."}</p>
                    </div>
                    <LinkButton to="/top-picks" variant="quiet" size="sm">Change top picks</LinkButton>
                </div>

                {picks.error ? (
                    <ErrorState error={picks.error} onRetry={picks.reload} />
                ) : (
                    <div className="rounded-xl bg-sand px-4 pt-6 sm:px-8">
                        {picks.loading && !picks.data ? (
                            <div className="grid grid-cols-3 gap-3 pb-6 sm:gap-8">
                                {[0, 1, 2].map((i) => <div key={i} className="skeleton aspect-2/3" />)}
                            </div>
                        ) : books.length === 0 ? (
                            <p className="pb-6 text-[15px] text-muted">Choose three books to feature on the site.</p>
                        ) : (
                            <ol className="grid grid-cols-3 gap-3 pb-6 sm:gap-8">
                                {books.map((b) => (
                                    <li key={b._id} className="min-w-0">
                                        <Link to={`/books/${b._id}`} className="group block">
                                            <Cover src={b.image} alt={`Cover of ${b.title}`} />
                                            <p className="mt-2 truncate text-sm font-bold text-secondary group-hover:underline">{b.title}</p>
                                            <p className="truncate text-[13px] text-muted">{b.author}</p>
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        )}
                        <div aria-hidden="true" className="-mx-4 h-2.5 rounded-b-xl bg-secondary/80 sm:-mx-8" />
                    </div>
                )}
            </section>
        </>
    );
}
