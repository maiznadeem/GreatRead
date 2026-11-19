import { useEffect, useState } from "react";
import { api, errorText } from "../api";
import { Dialog } from "../components/Dialog";
import { PlusIcon } from "../components/icons";
import { Button, Cover, ErrorState, PageHeader, SearchBox } from "../components/ui";
import { useDebounced, useFetch, useTitle } from "../lib/hooks";
import { useToast } from "../lib/toast-context";
import { MONTHS } from "../lib/util";

function BookPicker({ open, onClose, onPick, takenIds }) {
    const [term, setTerm] = useState("");
    const debounced = useDebounced(term.trim(), 300);
    const { data, error, loading, reload } = useFetch(`/admin/books?limit=20${debounced ? `&term=${encodeURIComponent(debounced)}` : ""}`);

    useEffect(() => {
        if (open) setTerm("");
    }, [open]);

    const books = data?.books ?? [];

    return (
        <Dialog open={open} onClose={onClose} title="Choose a book" size="lg">
            <SearchBox value={term} onChange={setTerm} placeholder="Search by title or author" label="Search books" />
            <div className="mt-4 min-h-48">
                {error && !data ? (
                    <ErrorState error={error} onRetry={reload} />
                ) : loading && !data ? (
                    <div className="space-y-2" aria-busy="true">
                        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-14" />)}
                    </div>
                ) : books.length === 0 ? (
                    <p className="py-8 text-center text-[15px] text-muted">No books match that search.</p>
                ) : (
                    <ul className="space-y-2">
                        {books.map((b) => {
                            const taken = takenIds.includes(b._id);
                            return (
                                <li key={b._id}>
                                    <button
                                        type="button"
                                        disabled={taken}
                                        onClick={() => onPick(b)}
                                        className="flex w-full items-center gap-3 rounded-lg border border-line bg-white p-2 text-left hover:bg-sand disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Cover src={b.image} className="w-10 shrink-0" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-bold text-secondary">{b.title}</span>
                                            <span className="block truncate text-[13px] text-muted">{b.author}</span>
                                        </span>
                                        {taken && <span className="chip">Already picked</span>}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </Dialog>
    );
}

export default function TopPicks() {
    useTitle("Top picks");
    const toast = useToast();
    const { data, error, loading, reload } = useFetch("/admin/toppicks");
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [slots, setSlots] = useState([null, null, null]);
    const [picking, setPicking] = useState(null);
    const [pending, setPending] = useState(false);
    const [formError, setFormError] = useState("");
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        if (!data) return;
        if (data.month) setMonth(data.month);
        if (data.year) setYear(data.year);
        const list = (data.books || []).slice(0, 3);
        setSlots([list[0] || null, list[1] || null, list[2] || null]);
        setDirty(false);
    }, [data]);

    const years = [...new Set([now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2, year])].sort();
    const filled = slots.every(Boolean);
    const taken = slots.filter(Boolean).map((b) => b._id);

    const setSlot = (i, book) => {
        setSlots((s) => s.map((x, idx) => (idx === i ? book : x)));
        setDirty(true);
    };

    const save = async () => {
        setPending(true);
        setFormError("");
        try {
            await api.put("/admin/toppicks", { month, year, bookIds: slots.map((b) => b._id) });
            toast.success(`Top picks saved for ${MONTHS[month - 1]} ${year}`);
            setDirty(false);
        } catch (err) {
            setFormError(errorText(err));
        } finally {
            setPending(false);
        }
    };

    return (
        <>
            <PageHeader title="Top picks" subtitle="Three books featured on the site for a chosen month." />

            {error && !data ? (
                <ErrorState error={error} onRetry={reload} />
            ) : (
                <div className="card p-4 sm:p-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="min-w-36 flex-1 sm:flex-none">
                            <label htmlFor="month" className="label">Month</label>
                            <select id="month" className="input" value={month} onChange={(e) => { setMonth(Number(e.target.value)); setDirty(true); }}>
                                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                        </div>
                        <div className="min-w-28 flex-1 sm:flex-none">
                            <label htmlFor="year" className="label">Year</label>
                            <select id="year" className="input" value={year} onChange={(e) => { setYear(Number(e.target.value)); setDirty(true); }}>
                                {years.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    <ol className="mt-6 grid grid-cols-3 gap-3 sm:gap-8" aria-label="Top pick slots">
                        {slots.map((book, i) => (
                            <li key={i} className="min-w-0">
                                {loading && !data ? (
                                    <div className="skeleton aspect-[2/3]" />
                                ) : book ? (
                                    <>
                                        <Cover src={book.image} alt={`Cover of ${book.title}`} />
                                        <p className="mt-2 truncate text-sm font-bold text-secondary">{book.title}</p>
                                        <p className="truncate text-[13px] text-muted">{book.author}</p>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            <Button variant="quiet" size="sm" onClick={() => setPicking(i)} aria-label={`Replace pick ${i + 1}`}>Replace</Button>
                                            <Button variant="ghost" size="sm" onClick={() => setSlot(i, null)} aria-label={`Clear pick ${i + 1}`}>Clear</Button>
                                        </div>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setPicking(i)}
                                        aria-label={`Choose book for pick ${i + 1}`}
                                        className="flex aspect-[2/3] w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-line bg-paper px-1 text-center text-sm font-semibold text-primaryDark hover:bg-sand"
                                    >
                                        <PlusIcon />
                                        Pick {i + 1}
                                    </button>
                                )}
                            </li>
                        ))}
                    </ol>

                    {formError && <p role="alert" className="err mt-4">{formError}</p>}
                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                        <Button onClick={save} pending={pending} disabled={!filled}>Save top picks</Button>
                        {!filled && <p className="text-sm text-muted">Choose all three books to save.</p>}
                        {filled && dirty && <p className="text-sm text-muted">You have unsaved changes.</p>}
                    </div>
                </div>
            )}

            <BookPicker
                open={picking !== null}
                onClose={() => setPicking(null)}
                takenIds={taken}
                onPick={(b) => {
                    setSlot(picking, { _id: b._id, title: b.title, author: b.author, image: b.image });
                    setPicking(null);
                }}
            />
        </>
    );
}
