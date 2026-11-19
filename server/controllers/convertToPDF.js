const { spawn } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

// LibreOffice (installed in the server image, see Dockerfile) converts ./assets/<name>.docx to ./assets/<name>.pdf.
const SOFFICE = process.env.SOFFICE_PATH || 'soffice';
const TIMEOUT_MS = 120 * 1000;
// Keep images as they are in the DOCX (original JPEGs, lossless PNGs, full resolution), as GroupDocs did.
// LibreOffice's defaults downsample to 300 DPI and re-encode PNGs as JPEG, which is also 3x slower.
const PDF_FILTER = 'pdf:writer_pdf_Export:' + JSON.stringify({
    ReduceImageResolution: { type: 'boolean', value: 'false' },
    UseLosslessCompression: { type: 'boolean', value: 'true' },
});

const run = (args) => new Promise((resolve, reject) => {
    // detached: soffice forks soffice.bin, so a timeout must kill the whole process group.
    const child = spawn(SOFFICE, args, { detached: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    const timer = setTimeout(() => {
        try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ }
        reject(new Error(`soffice timed out after ${TIMEOUT_MS / 1000}s`));
    }, TIMEOUT_MS);
    child.on('error', (err) => { clearTimeout(timer); reject(err); });
    child.on('exit', (code, signal) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`soffice exited with ${signal || code}: ${stderr.trim()}`));
    });
});

const convertNow = async (filename) => {
    const assets = path.resolve('assets');
    const output = path.join(assets, `${filename}.pdf`);
    // A private profile per call, so conversions never share (and lock) one LibreOffice user directory.
    const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'lo-profile-'));
    try {
        await fs.rm(output, { force: true });
        await run([
            `-env:UserInstallation=${pathToFileURL(profile).href}`,
            '--headless', '--norestore', '--nolockcheck', '--nodefault', '--nologo',
            '--convert-to', PDF_FILTER,
            '--outdir', assets,
            path.join(assets, `${filename}.docx`),
        ]);
        // soffice can exit 0 without writing anything (e.g. an unreadable input), so check the result.
        await fs.access(output);
    } catch (err) {
        console.log("Error occurred during conversion:", err);
        throw err;
    } finally {
        await fs.rm(profile, { recursive: true, force: true });
    }
};

// One conversion at a time per instance: each soffice peaks around 250 MB, and the service runs in 512 MiB.
let queue = Promise.resolve();
const convert = (filename) => {
    const result = queue.then(() => convertNow(filename));
    queue = result.catch(() => {});
    return result;
};

module.exports = {
    convert
}
