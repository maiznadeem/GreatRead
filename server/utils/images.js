const sharp = require('sharp');

// Uploads are re-encoded before storage: smaller files, metadata stripped, orientation applied.
// Covers stay JPEG because the reading-list PDF export (react-pdf) only supports JPEG and PNG.
// Category icons stay PNG to keep transparency.
const PRESETS = {
    books: (img) => img
        .resize({ width: 600, height: 900, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true, progressive: true }),
    categories: (img) => img
        .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
        .png({ compressionLevel: 9, palette: true }),
};
const OUTPUT = { books: { ext: 'jpg', mime: 'image/jpeg' }, categories: { ext: 'png', mime: 'image/png' } };

// Returns { buffer, ext, mime } for the given upload folder ('books' or 'categories').
async function compressImage(buffer, folder) {
    const preset = PRESETS[folder];
    if (!preset) throw new Error(`No image preset for ${folder}`);
    const buffered = await preset(sharp(buffer, { limitInputPixels: 40e6 }).rotate()).toBuffer();
    return { buffer: buffered, ...OUTPUT[folder] };
}

module.exports = { compressImage };
