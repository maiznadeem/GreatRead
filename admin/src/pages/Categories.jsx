import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, errorText } from "../api";
import { ConfirmDialog, Dialog } from "../components/Dialog";
import { ImagePicker } from "../components/ImagePicker";
import { EditIcon, PlusIcon, TrashIcon } from "../components/icons";
import { Button, Cover, EmptyState, ErrorState, Field, PageHeader, SearchBox } from "../components/ui";
import { describedBy } from "../lib/util";
import { useDebounced, useFetch, useTitle } from "../lib/hooks";
import { useToast } from "../lib/toast-context";
import { plural } from "../lib/util";

function CategoryForm({ category, onClose, onSaved }) {
    const toast = useToast();
    const editing = !!category;
    const [name, setName] = useState(category?.name ?? "");
    const [bestseller, setBestseller] = useState(!!category?.bestseller);
    const [file, setFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [pending, setPending] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        const next = {};
        const trimmed = name.trim();
        if (!trimmed) next.name = "Enter a name.";
        else if (trimmed.length > 100) next.name = "Use 100 characters or fewer.";
        if (!editing && !file) next.image = "Choose an image.";
        setErrors(next);
        if (Object.keys(next).length) return;

        const body = new FormData();
        body.append("name", trimmed);
        body.append("bestseller", String(bestseller));
        if (file) body.append("image", file);

        setPending(true);
        try {
            if (editing) await api.put(`/admin/categories/${category._id}`, body);
            else await api.post("/admin/categories", body);
            toast.success(editing ? `Saved "${trimmed}"` : `Added "${trimmed}"`);
            onSaved();
        } catch (err) {
            if (err.code === "DUPLICATE_NAME") setErrors({ name: "A category with this name already exists." });
            else setErrors({ form: errorText(err) });
            setPending(false);
        }
    };

    return (
        <Dialog
            open
            onClose={onClose}
            dismissible={!pending}
            title={editing ? "Edit category" : "Add category"}
            footer={
                <>
                    <Button variant="quiet" onClick={onClose} disabled={pending}>Cancel</Button>
                    <Button type="submit" form="category-form" pending={pending}>{editing ? "Save changes" : "Add category"}</Button>
                </>
            }
        >
            <form id="category-form" onSubmit={submit} noValidate className="space-y-5">
                {errors.form && <p role="alert" className="err">{errors.form}</p>}
                <Field id="cat-name" label="Name" error={errors.name} hint={editing ? "Renaming also renames it on every book." : undefined}>
                    <input
                        id="cat-name"
                        data-autofocus
                        className="input"
                        value={name}
                        maxLength={100}
                        onChange={(e) => setName(e.target.value)}
                        aria-invalid={errors.name ? true : undefined}
                        aria-describedby={describedBy("cat-name", editing, errors.name)}
                    />
                </Field>
                <label className="flex cursor-pointer items-center gap-3">
                    <input type="checkbox" role="switch" checked={bestseller} onChange={(e) => setBestseller(e.target.checked)} className="h-5 w-5 rounded border-line accent-primaryDark" />
                    <span className="text-sm font-semibold">Mark as Bestseller</span>
                </label>
                <ImagePicker
                    label="Image"
                    required={!editing}
                    file={file}
                    onFile={setFile}
                    existingUrl={category?.image}
                    error={errors.image}
                    aspect="aspect-[4/3]"
                    width="w-44"
                    hint={editing ? "Leave empty to keep the current image. JPEG, PNG, WebP or GIF, up to 5 MB." : undefined}
                />
            </form>
        </Dialog>
    );
}

export default function Categories() {
    useTitle("Categories");
    const toast = useToast();
    const [params, setParams] = useSearchParams();
    const [term, setTerm] = useState("");
    const debounced = useDebounced(term.trim(), 300);
    const { data, error, loading, reload } = useFetch(`/admin/categories${debounced ? `?term=${encodeURIComponent(debounced)}` : ""}`);
    const [form, setForm] = useState(() => (params.get("new") ? { category: null } : null));
    const [target, setTarget] = useState(null);
    const [pending, setPending] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const items = data?.categories ?? [];

    const closeForm = () => {
        setForm(null);
        if (params.get("new")) setParams({}, { replace: true });
    };

    const confirmDelete = async () => {
        setPending(true);
        setDeleteError("");
        try {
            await api.del(`/admin/categories/${target._id}`);
            toast.success(`Deleted "${target.name}"`);
            setTarget(null);
            reload();
        } catch (err) {
            setDeleteError(errorText(err));
        } finally {
            setPending(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Categories"
                subtitle="Group books so readers can browse by topic."
                actions={<Button onClick={() => setForm({ category: null })}><PlusIcon size={18} /> Add category</Button>}
            />
            <div className="mb-5">
                <SearchBox value={term} onChange={setTerm} placeholder="Search categories" label="Search categories" />
            </div>

            {error && !data ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading && !data ? (
                <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading categories">
                    {[0, 1, 2, 3, 4, 5].map((i) => <li key={i} className="skeleton h-64" />)}
                </ul>
            ) : items.length === 0 ? (
                debounced ? (
                    <EmptyState title="No categories match that search">Try a different word.</EmptyState>
                ) : (
                    <EmptyState title="No categories yet" action={<Button onClick={() => setForm({ category: null })}>Add the first category</Button>}>
                        Categories you add can be assigned to books.
                    </EmptyState>
                )
            ) : (
                <ul className={`grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""} transition-opacity`}>
                    {items.map((c) => (
                        <li key={c._id} className="card flex flex-col overflow-hidden">
                            <div className="relative aspect-[16/9] overflow-hidden bg-sand">
                                {c.image?.startsWith("https://") ? (
                                    <img src={c.image} alt="" loading="lazy" className="h-full w-full object-contain p-5" />
                                ) : (
                                    <Cover className="!aspect-auto h-full w-full rounded-none shadow-none" />
                                )}
                                {c.bestseller && (
                                    <span className="absolute left-2 top-2 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-white">Bestseller</span>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col p-4">
                                <h2 className="truncate text-base font-extrabold text-secondary">{c.name}</h2>
                                <p className="text-sm text-muted">{plural(c.bookCount ?? 0, "book")}</p>
                                <div className="mt-3 flex gap-2">
                                    <Button variant="quiet" size="sm" onClick={() => setForm({ category: c })} aria-label={`Edit ${c.name}`}>
                                        <EditIcon size={16} /> Edit
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-danger hover:!bg-red-50" onClick={() => setTarget(c)} aria-label={`Delete ${c.name}`}>
                                        <TrashIcon size={16} /> Delete
                                    </Button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {form && (
                <CategoryForm
                    key={form.category?._id ?? "new"}
                    category={form.category}
                    onClose={closeForm}
                    onSaved={() => {
                        closeForm();
                        reload();
                    }}
                />
            )}

            <ConfirmDialog
                open={!!target}
                onClose={() => {
                    setTarget(null);
                    setDeleteError("");
                }}
                onConfirm={confirmDelete}
                pending={pending}
                danger
                title="Delete this category?"
                confirmLabel="Delete category"
                error={deleteError}
            >
                <p>
                    <strong>{target?.name}</strong> will be removed from{" "}
                    {target?.bookCount ? <strong>{plural(target.bookCount, "book")}</strong> : "any books that use it"}.
                    The books stay on the site. This can&apos;t be undone.
                </p>
            </ConfirmDialog>
        </>
    );
}
