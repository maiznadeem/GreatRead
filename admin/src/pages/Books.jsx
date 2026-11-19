import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, errorText } from "../api";
import { ConfirmDialog } from "../components/Dialog";
import { EditIcon, PlusIcon, TrashIcon } from "../components/icons";
import { Cover, EmptyState, ErrorState, LinkButton, PageHeader, SearchBox } from "../components/ui";
import { useDebounced, useFetch, useTitle } from "../lib/hooks";
import { useToast } from "../lib/toast-context";
import { plural } from "../lib/util";

const PAGE_SIZE = 24;
const SORTS = { title: "Title A–Z", newest: "Newest first" };

// Page numbers to show: first, last, and a window around the current page, with gaps as null.
function pageList(page, pages) {
    const keep = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
    const list = [];
    [...keep].sort((a, b) => a - b).forEach((n, i, arr) => {
        if (i > 0 && n - arr[i - 1] > 1) list.push(null);
        list.push(n);
    });
    return list;
}

function Pagination({ page, pages, onPage }) {
    if (pages <= 1) return null;
    return (
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
            <button type="button" className="btn btn-quiet btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
                Previous
            </button>
            {pageList(page, pages).map((n, i) =>
                n === null ? (
                    <span key={`gap-${i}`} className="px-1 text-muted" aria-hidden="true">…</span>
                ) : (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onPage(n)}
                        aria-current={n === page ? "page" : undefined}
                        aria-label={`Page ${n}`}
                        className={`btn btn-sm min-w-9 justify-center ${n === page ? "btn-primary" : "btn-ghost"}`}
                    >
                        {n}
                    </button>
                ),
            )}
            <button type="button" className="btn btn-quiet btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
                Next
            </button>
        </nav>
    );
}

function BookCard({ book, onDelete }) {
    return (
        <li className="card flex gap-4 p-3 sm:p-4">
            <Link to={`/books/${book._id}`} className="w-20 shrink-0 sm:w-24" tabIndex={-1} aria-hidden="true">
                <Cover src={book.image} />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
                <h2 className="text-base font-extrabold leading-snug text-secondary">
                    <Link to={`/books/${book._id}`} className="hover:underline">{book.title}</Link>
                </h2>
                <p className="text-sm text-muted">
                    {book.author}
                    {book.publishingYear != null && `, ${book.publishingYear}`}
                </p>
                {book.categories?.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Categories">
                        {book.categories.slice(0, 4).map((c) => <li key={c} className="chip">{c}</li>)}
                        {book.categories.length > 4 && <li className="chip">+{book.categories.length - 4}</li>}
                    </ul>
                )}
                <div className="mt-auto flex gap-2 pt-3">
                    <LinkButton to={`/books/${book._id}`} variant="quiet" size="sm" aria-label={`Edit ${book.title}`}>
                        <EditIcon size={16} /> Edit
                    </LinkButton>
                    <button type="button" className="btn btn-ghost btn-sm text-danger hover:!bg-red-50" onClick={() => onDelete(book)} aria-label={`Delete ${book.title}`}>
                        <TrashIcon size={16} /> Delete
                    </button>
                </div>
            </div>
        </li>
    );
}

export default function Books() {
    useTitle("Books");
    const toast = useToast();
    // Search, page and sort live in the URL so returning from the editor keeps your place.
    const [params, setParams] = useSearchParams();
    const q = params.get("q") ?? "";
    const sort = Object.hasOwn(SORTS, params.get("sort") ?? "") ? params.get("sort") : "title";
    const requestedPage = Math.max(Number.parseInt(params.get("page"), 10) || 1, 1);
    const [term, setTerm] = useState(q);
    const debounced = useDebounced(term.trim(), 300);

    const update = (changes) =>
        setParams((prev) => {
            const next = new URLSearchParams(prev);
            Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, String(v)) : next.delete(k)));
            return next;
        }, { replace: true });

    useEffect(() => {
        if (debounced !== q) update({ q: debounced, page: null });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced search text
    }, [debounced]);

    const query = new URLSearchParams({ page: String(requestedPage), limit: String(PAGE_SIZE), sort });
    if (q) query.set("term", q);
    const { data, error, loading, reload } = useFetch(`/admin/books?${query}`);
    const page = data?.page ?? requestedPage;
    const total = data?.total ?? 0;

    const goToPage = (n) => {
        update({ page: n > 1 ? n : null });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const [target, setTarget] = useState(null);
    const [pending, setPending] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const books = data?.books ?? [];

    const closeDelete = () => {
        setTarget(null);
        setDeleteError("");
    };

    const confirmDelete = async () => {
        setPending(true);
        setDeleteError("");
        try {
            await api.del(`/admin/books/${target._id}`);
            toast.success(`Deleted "${target.title}"`);
            setTarget(null);
            reload();
        } catch (err) {
            setDeleteError(
                err.code === "TOP_PICK"
                    ? "This book is one of the current top picks. Choose a different pick first, then delete it."
                    : errorText(err),
            );
        } finally {
            setPending(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Books"
                subtitle="Search, edit or remove the books on the site."
                actions={<LinkButton to="/books/new"><PlusIcon size={18} /> Add book</LinkButton>}
            />
            <div className="mb-5 flex items-center justify-between gap-3">
                <SearchBox value={term} onChange={setTerm} placeholder="Search by title or author" label="Search books" />
                <div className="flex items-center gap-3">
                    {data && total > 0 && (
                        <p className="hidden text-sm text-muted sm:block" aria-live="polite">
                            {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + books.length} of {plural(total, "book")}
                        </p>
                    )}
                    <label htmlFor="sort" className="sr-only">Sort books</label>
                    <select id="sort" value={sort} onChange={(e) => update({ sort: e.target.value === "title" ? null : e.target.value, page: null })} className="input w-auto py-2">
                        {Object.entries(SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </div>
            </div>

            {error && !data ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading && !data ? (
                <ul className="grid gap-3 md:grid-cols-2" aria-busy="true" aria-label="Loading books">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <li key={i} className="card flex gap-4 p-4">
                            <div className="skeleton aspect-[2/3] w-24 shrink-0" />
                            <div className="flex-1 space-y-2 pt-1">
                                <div className="skeleton h-4 w-3/4" />
                                <div className="skeleton h-3 w-1/2" />
                                <div className="skeleton h-5 w-2/3" />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : books.length === 0 ? (
                q ? (
                    <EmptyState title="No books match that search">Check the spelling or try a shorter title or author.</EmptyState>
                ) : (
                    <EmptyState title="No books yet" action={<LinkButton to="/books/new">Add the first book</LinkButton>}>
                        Books you add appear here and on the public site.
                    </EmptyState>
                )
            ) : (
                <>
                    <ul className={`grid gap-3 md:grid-cols-2 ${loading ? "opacity-60" : ""} transition-opacity`}>
                        {books.map((b) => <BookCard key={b._id} book={b} onDelete={setTarget} />)}
                    </ul>
                    <Pagination page={page} pages={data?.pages ?? 1} onPage={goToPage} />
                </>
            )}

            <ConfirmDialog
                open={!!target}
                onClose={closeDelete}
                onConfirm={confirmDelete}
                pending={pending}
                danger
                title="Delete this book?"
                confirmLabel="Delete book"
                error={deleteError}
            >
                <p>
                    <strong>{target?.title}</strong> and its notes will be removed from the site. This can&apos;t be undone.
                </p>
            </ConfirmDialog>
        </>
    );
}
