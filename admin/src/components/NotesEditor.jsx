import { useState } from "react";
import { CheckIcon, CloseIcon, DownIcon, EditIcon, TrashIcon, UpIcon } from "./icons";

const MAX_NOTES = 200;
const MAX_NOTE_LENGTH = 5000;

export function NotesEditor({ notes, onChange }) {
    const [draft, setDraft] = useState("");
    const [editing, setEditing] = useState(null);
    const [editText, setEditText] = useState("");
    const [error, setError] = useState("");

    const exists = (text, except = -1) => notes.some((n, i) => i !== except && n.toLowerCase() === text.toLowerCase());

    const add = () => {
        const text = draft.trim();
        if (!text) return;
        if (text.length > MAX_NOTE_LENGTH) return setError(`A note can be up to ${MAX_NOTE_LENGTH} characters.`);
        if (notes.length >= MAX_NOTES) return setError(`A book can have up to ${MAX_NOTES} notes.`);
        if (exists(text)) return setError("This note is already in the list.");
        onChange([...notes, text]);
        setDraft("");
        setError("");
    };

    const saveEdit = () => {
        const text = editText.trim();
        if (!text) return setError("A note can't be empty. Remove it instead.");
        if (text.length > MAX_NOTE_LENGTH) return setError(`A note can be up to ${MAX_NOTE_LENGTH} characters.`);
        if (exists(text, editing)) return setError("This note is already in the list.");
        onChange(notes.map((n, i) => (i === editing ? text : n)));
        setEditing(null);
        setError("");
    };

    const move = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= notes.length) return;
        const next = [...notes];
        [next[i], next[j]] = [next[j], next[i]];
        onChange(next);
    };

    const remove = (i) => {
        onChange(notes.filter((_, idx) => idx !== i));
        if (editing === i) setEditing(null);
        else if (editing !== null && editing > i) setEditing(editing - 1);
    };

    return (
        <div>
            <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="note-draft" className="label mb-0!">Notes</label>
                <span className="text-[13px] text-muted" aria-live="polite">{notes.length} {notes.length === 1 ? "note" : "notes"}</span>
            </div>
            <div className="flex gap-2">
                <input
                    id="note-draft"
                    className="input"
                    value={draft}
                    placeholder="Write a note and press Enter"
                    onChange={(e) => {
                        setDraft(e.target.value);
                        setError("");
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            add();
                        }
                    }}
                    aria-describedby={error ? "notes-err" : undefined}
                    aria-invalid={error ? true : undefined}
                />
                <button type="button" className="btn btn-quiet shrink-0" onClick={add} disabled={!draft.trim()}>Add note</button>
            </div>
            {error && <p id="notes-err" role="alert" className="err">{error}</p>}

            {notes.length === 0 ? (
                <p className="hint">No notes yet. Each note shows as its own line on the book page.</p>
            ) : (
                <ol className="mt-3 space-y-2">
                    {notes.map((note, i) => (
                        <li key={`${i}-${note}`} className="flex items-start gap-2 rounded-lg border border-line bg-white p-2">
                            <span className="mt-1.5 w-6 shrink-0 text-center text-xs font-bold text-muted">{i + 1}</span>
                            {editing === i ? (
                                <>
                                    <textarea
                                        aria-label={`Edit note ${i + 1}`}
                                        className="input min-h-20 flex-1"
                                        value={editText}
                                        autoFocus
                                        onChange={(e) => {
                                            setEditText(e.target.value);
                                            setError("");
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                saveEdit();
                                            } else if (e.key === "Escape") {
                                                e.stopPropagation();
                                                setEditing(null);
                                                setError("");
                                            }
                                        }}
                                    />
                                    <div className="flex shrink-0 flex-col gap-1">
                                        <button type="button" className="rounded-md p-1.5 text-ok hover:bg-sand" onClick={saveEdit} aria-label="Save note"><CheckIcon size={18} /></button>
                                        <button type="button" className="rounded-md p-1.5 text-muted hover:bg-sand" onClick={() => { setEditing(null); setError(""); }} aria-label="Cancel editing"><CloseIcon size={18} /></button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="min-w-0 flex-1 whitespace-pre-wrap wrap-break-word py-1 text-[15px]">{note}</p>
                                    <div className="flex shrink-0 items-center">
                                        <button type="button" className="rounded-md p-1.5 text-muted hover:bg-sand disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move note ${i + 1} up`}><UpIcon size={18} /></button>
                                        <button type="button" className="rounded-md p-1.5 text-muted hover:bg-sand disabled:opacity-30" onClick={() => move(i, 1)} disabled={i === notes.length - 1} aria-label={`Move note ${i + 1} down`}><DownIcon size={18} /></button>
                                        <button type="button" className="rounded-md p-1.5 text-muted hover:bg-sand" onClick={() => { setEditing(i); setEditText(note); setError(""); }} aria-label={`Edit note ${i + 1}`}><EditIcon size={18} /></button>
                                        <button type="button" className="rounded-md p-1.5 text-danger hover:bg-red-50" onClick={() => remove(i)} aria-label={`Remove note ${i + 1}`}><TrashIcon size={18} /></button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}
