export const safeImage = (url) => (typeof url === "string" && url.startsWith("https://") ? url : null);

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function checkImage(file) {
    if (!IMAGE_TYPES.includes(file.type)) return "Use a JPEG, PNG, WebP or GIF image.";
    if (file.size > MAX_IMAGE_BYTES) return "The image is larger than 5 MB.";
    return null;
}

export const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export function isHttpUrl(value) {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const describedBy = (id, hint, error) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);
