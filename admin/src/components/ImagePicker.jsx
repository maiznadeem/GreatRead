import { useEffect, useId, useRef, useState } from "react";
import { checkImage, safeImage } from "../lib/util";
import { ImageIcon } from "./icons";

export function ImagePicker({ label, file, onFile, existingUrl, error, required, hint, aspect = "aspect-[2/3]", width = "w-40" }) {
    const id = useId();
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [drag, setDrag] = useState(false);
    const [localError, setLocalError] = useState(null);

    useEffect(() => {
        if (!file) {
            setPreview(null);
            return undefined;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const accept = (f) => {
        if (!f) return;
        const problem = checkImage(f);
        setLocalError(problem);
        if (!problem) onFile(f);
    };

    const shown = preview || safeImage(existingUrl);
    const message = localError || error;

    return (
        <div>
            <label htmlFor={id} className="label">
                {label}
                {required && <span className="text-danger"> *</span>}
            </label>
            <div className="flex flex-wrap items-start gap-4">
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDrag(false);
                        accept(e.dataTransfer.files?.[0]);
                    }}
                    className={`relative ${aspect} ${width} shrink-0 overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
                        drag ? "border-primaryDark bg-sand" : message ? "border-danger bg-white" : "border-line bg-white"
                    }`}
                >
                    {shown ? (
                        <img src={shown} alt="Selected cover preview" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-xs text-muted">
                            <ImageIcon size={26} />
                            Drop an image here
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1 basis-48">
                    <input
                        ref={inputRef}
                        id={id}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        aria-describedby={`${id}-info`}
                        onChange={(e) => {
                            accept(e.target.files?.[0]);
                            e.target.value = "";
                        }}
                    />
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn btn-quiet btn-sm" onClick={() => inputRef.current?.click()}>
                            {shown ? "Replace image" : "Choose image"}
                        </button>
                        {file && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                    setLocalError(null);
                                    onFile(null);
                                }}
                            >
                                Remove new image
                            </button>
                        )}
                    </div>
                    <p id={`${id}-info`} className="hint">
                        {hint || "JPEG, PNG, WebP or GIF, up to 5 MB."}
                        {file && <> Selected: {file.name}</>}
                    </p>
                    {message && <p role="alert" className="err">{message}</p>}
                </div>
            </div>
        </div>
    );
}
