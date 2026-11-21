import { useEffect, useRef, useState } from "react";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { api, errorText } from "../api";
import { ConfirmDialog } from "../components/Dialog";
import { ImagePicker } from "../components/ImagePicker";
import { NotesEditor } from "../components/NotesEditor";
import { ArrowLeftIcon } from "../components/icons";
import { Button, ErrorState, Field, LinkButton, PageHeader } from "../components/ui";
import { describedBy } from "../lib/util";
import { useFetch, useTitle } from "../lib/hooks";
import { useToast } from "../lib/toast-context";
import { isHttpUrl } from "../lib/util";

const QUOTE_MAX = 2000;

function toForm(book) {
    return {
        title: book?.title ?? "",
        author: book?.author ?? "",
        publishingYear: book?.publishingYear != null ? String(book.publishingYear) : "",
        categories: book?.categories ?? [],
        amazon: book?.amazon ?? "",
        perlego: book?.perlego ?? "",
        quote: book?.quote ?? "",
        notes: book?.notes ?? [],
    };
}

function validate(f, hasImage) {
    const e = {};
    const maxYear = new Date().getFullYear() + 1;
    if (!f.title.trim()) e.title = "Enter a title.";
    else if (f.title.trim().length > 300) e.title = "Use 300 characters or fewer.";
    if (!f.author.trim()) e.author = "Enter an author.";
    else if (f.author.trim().length > 200) e.author = "Use 200 characters or fewer.";
    const year = f.publishingYear.trim();
    if (!year) e.publishingYear = "Enter the publishing year.";
    else if (!/^\d+$/.test(year) || Number(year) > maxYear) e.publishingYear = `Enter a year between 0 and ${maxYear}.`;
    for (const key of ["amazon", "perlego"]) {
        const v = f[key].trim();
        if (v && (v.length > 2000 || !isHttpUrl(v))) e[key] = "Enter a full link starting with http:// or https://.";
    }
    if (f.quote.length > QUOTE_MAX) e.quote = `Use ${QUOTE_MAX} characters or fewer.`;
    if (!hasImage) e.image = "Choose a cover image.";
    return e;
}

function EditorForm({ id, book, categoryNames }) {
    const isNew = !id;
    const navigate = useNavigate();
    const toast = useToast();
    const [initial] = useState(() => JSON.stringify(toForm(book)));
    const [form, setForm] = useState(() => toForm(book));
    const [file, setFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [pending, setPending] = useState(false);
    const [duplicate, setDuplicate] = useState(false);
    const [dupPending, setDupPending] = useState(false);
    const [saved, setSaved] = useState(false);
    const savedRef = useRef(false);

    const dirty = !saved && (JSON.stringify(form) !== initial || !!file);
    const dirtyRef = useRef(false);
    useEffect(() => {
        dirtyRef.current = dirty;
    });
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => dirtyRef.current && !savedRef.current && currentLocation.pathname !== nextLocation.pathname,
    );

    useEffect(() => {
        if (!dirty) return undefined;
        const handler = (e) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const allCategories = [...new Set([...categoryNames, ...form.categories])];
    const toggleCategory = (name) =>
        setForm((f) => ({
            ...f,
            categories: f.categories.includes(name) ? f.categories.filter((c) => c !== name) : [...f.categories, name],
        }));

    const send = async (allowDuplicate) => {
        const body = new FormData();
        body.append("title", form.title.trim());
        body.append("author", form.author.trim());
        body.append("publishingYear", form.publishingYear.trim());
        body.append("categories", JSON.stringify(form.categories));
        body.append("amazon", form.amazon.trim());
        body.append("perlego", form.perlego.trim());
        body.append("quote", form.quote);
        body.append("notes", JSON.stringify(form.notes));
        if (file) body.append("image", file);
        if (allowDuplicate) body.append("allowDuplicate", "true");
        return isNew ? api.post("/admin/books", body) : api.put(`/admin/books/${id}`, body);
    };

    const finish = () => {
        savedRef.current = true;
        setSaved(true);
        toast.success(isNew ? `Added "${form.title.trim()}"` : `Saved "${form.title.trim()}"`);
        navigate("/books");
    };

    const submit = async (allowDuplicate = false) => {
        const found = validate(form, !!file || !!book?.image);
        setErrors(found);
        if (Object.keys(found).length) {
            const first = document.querySelector("[aria-invalid='true'], [role='alert']");
            first?.scrollIntoView?.({ block: "center", behavior: "smooth" });
            return;
        }
        if (allowDuplicate) setDupPending(true);
        else setPending(true);
        try {
            await send(allowDuplicate);
            finish();
        } catch (err) {
            setDuplicate(false);
            if (err.code === "DUPLICATE_TITLE") setDuplicate(true);
            else {
                setErrors({ form: errorText(err) });
                toast.error(errorText(err));
            }
        } finally {
            setPending(false);
            setDupPending(false);
        }
    };

    const field = (key, extra = {}) => ({
        value: form[key],
        onChange: set(key),
        "aria-invalid": errors[key] ? true : undefined,
        "aria-describedby": describedBy(key, extra.hint, errors[key]),
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                submit(false);
            }}
            noValidate
            className="space-y-8 pb-24"
        >
            {errors.form && <p role="alert" className="rounded-lg border border-danger/30 bg-red-50 px-3 py-2.5 text-sm font-medium text-danger">{errors.form}</p>}

            <div className="grid gap-8 md:grid-cols-[11rem_minmax(0,1fr)]">
                <ImagePicker label="Cover" required={isNew} file={file} onFile={setFile} existingUrl={book?.image} error={errors.image} hint="JPEG, PNG, WebP or GIF, up to 5 MB." />

                <div className="space-y-5">
                    <Field id="title" label="Title" error={errors.title}>
                        <input id="title" className="input" maxLength={300} autoComplete="off" {...field("title")} />
                    </Field>
                    <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_9rem]">
                        <Field id="author" label="Author" error={errors.author}>
                            <input id="author" className="input" maxLength={200} autoComplete="off" {...field("author")} />
                        </Field>
                        <Field id="publishingYear" label="Year" error={errors.publishingYear}>
                            <input id="publishingYear" className="input" inputMode="numeric" maxLength={4} autoComplete="off" {...field("publishingYear")} />
                        </Field>
                    </div>

                    <fieldset>
                        <legend className="label">Categories</legend>
                        {allCategories.length === 0 ? (
                            <p className="hint">No categories yet. Add some on the Categories page first.</p>
                        ) : (
                            <ul className="flex flex-wrap gap-2">
                                {allCategories.map((name) => {
                                    const on = form.categories.includes(name);
                                    return (
                                        <li key={name}>
                                            <button
                                                type="button"
                                                aria-pressed={on}
                                                onClick={() => toggleCategory(name)}
                                                className={`min-h-9 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
                                                    on ? "border-primaryDark bg-primaryDark text-white" : "border-line bg-white text-secondary hover:bg-sand"
                                                }`}
                                            >
                                                {name}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </fieldset>
                </div>
            </div>

            <section aria-labelledby="links-title" className="space-y-5">
                <h2 id="links-title" className="text-lg font-extrabold text-secondary">Where to buy</h2>
                <div className="grid gap-5 md:grid-cols-2">
                    <Field id="amazon" label="Amazon link" error={errors.amazon}>
                        <input id="amazon" type="url" className="input" placeholder="https://" autoComplete="off" {...field("amazon")} />
                    </Field>
                    <Field id="perlego" label="Perlego link" error={errors.perlego}>
                        <input id="perlego" type="url" className="input" placeholder="https://" autoComplete="off" {...field("perlego")} />
                    </Field>
                </div>
            </section>

            <section aria-labelledby="content-title" className="space-y-5">
                <h2 id="content-title" className="text-lg font-extrabold text-secondary">Content</h2>
                <Field id="quote" label="Quote" error={errors.quote}>
                    <textarea id="quote" rows={3} className="input" {...field("quote")} />
                    <p className={`mt-1 text-right text-[13px] ${form.quote.length > QUOTE_MAX ? "font-semibold text-danger" : "text-muted"}`} aria-live="polite">
                        {form.quote.length} / {QUOTE_MAX}
                    </p>
                </Field>
                <NotesEditor notes={form.notes} onChange={(notes) => setForm((f) => ({ ...f, notes }))} />
            </section>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-sm lg:left-64">
                <div className="mx-auto flex max-w-6xl items-center justify-end gap-2 lg:px-6">
                    {dirty && <span className="mr-auto text-sm text-muted">Unsaved changes</span>}
                    <LinkButton to="/books" variant="quiet">Cancel</LinkButton>
                    <Button type="submit" pending={pending}>{isNew ? "Add book" : "Save changes"}</Button>
                </div>
            </div>

            <ConfirmDialog
                open={duplicate}
                onClose={() => setDuplicate(false)}
                onConfirm={() => submit(true)}
                pending={dupPending}
                title="Same title already exists"
                confirmLabel="Save anyway"
            >
                <p>A book with this title already exists. Save anyway?</p>
            </ConfirmDialog>

            <ConfirmDialog
                open={blocker.state === "blocked"}
                onClose={() => blocker.reset?.()}
                onConfirm={() => blocker.proceed?.()}
                danger
                title="Leave without saving?"
                confirmLabel="Leave page"
                cancelLabel="Keep editing"
            >
                <p>Your changes to this book haven&apos;t been saved and will be lost.</p>
            </ConfirmDialog>
        </form>
    );
}

export default function BookEditor() {
    const { id } = useParams();
    const isNew = !id;
    useTitle(isNew ? "Add book" : "Edit book");
    const cats = useFetch("/admin/categories");
    const bookReq = useFetch(isNew ? null : `/admin/books/${encodeURIComponent(id)}`);

    const failed = cats.error || bookReq.error;
    const ready = cats.data && (isNew || bookReq.data);

    return (
        <>
            <LinkButton to="/books" variant="ghost" size="sm" className="-ml-3 mb-2"><ArrowLeftIcon size={16} /> Books</LinkButton>
            <PageHeader title={isNew ? "Add book" : "Edit book"} subtitle={isNew ? "Fill in the details, then add notes." : undefined} />
            {failed ? (
                <ErrorState
                    error={bookReq.error?.status === 404 ? { message: "This book no longer exists." } : failed}
                    onRetry={() => {
                        cats.reload();
                        bookReq.reload();
                    }}
                />
            ) : !ready ? (
                <div className="space-y-4" aria-busy="true" aria-label="Loading book">
                    <div className="skeleton h-10 w-full max-w-md" />
                    <div className="skeleton h-10 w-full max-w-md" />
                    <div className="skeleton h-40 w-full" />
                </div>
            ) : (
                <EditorForm key={id ?? "new"} id={id} book={bookReq.data?.book} categoryNames={cats.data.categories.map((c) => c.name)} />
            )}
        </>
    );
}
