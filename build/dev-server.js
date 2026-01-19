import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Serve root: dist (production build) by default, or public if --public flag provided
const usePublic = process.argv.includes('--public');

// Parse port from command line arguments
let portArg = 8000; // default
const portIndex = process.argv.indexOf('--port');
if (portIndex !== -1 && portIndex + 1 < process.argv.length) {
    const parsedPort = parseInt(process.argv[portIndex + 1], 10);
    if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort < 65536) {
        portArg = parsedPort;
    } else {
        console.error(`❌ Invalid port number: ${process.argv[portIndex + 1]}`);
        process.exit(1);
    }
}

const publicDir = join(projectRoot, usePublic ? 'public' : 'dist');

// Cache templates
const templates = {};
function getTemplate(name) {
    if (!templates[name]) {
        const templatePath = join(__dirname, 'templates', name);
        if (existsSync(templatePath)) {
            templates[name] = readFileSync(templatePath, 'utf8');
        } else {
            templates[name] = '';
        }
    }
    return templates[name];
}

// Cache public files
const publicFiles = {};
function getPublicFile(name) {
    if (!publicFiles[name]) {
        const filePath = join(__dirname, 'public', name);
        if (existsSync(filePath)) {
            publicFiles[name] = readFileSync(filePath, 'utf8');
        } else {
            publicFiles[name] = '';
        }
    }
    return publicFiles[name];
}

let server = createServer((req, res) => {
    // Parse URL to remove query parameters
    const urlPath = req.url.split('?')[0];

    // If a function exists for this path (e.g., /newsletter-subscribe -> functions/newsletter-subscribe.js)
    const funcFile = join(projectRoot, 'functions', (urlPath || '/').replace(/^\//, '') + '.js');
    if (existsSync(funcFile)) {
        // Route to the Cloudflare Pages Function file
        (async () => {
            try {
                const mod = await import(pathToFileURL(funcFile).href);

                // Helper to convert a Web Response into Node's http response
                const flushResponse = async (webRes) => {
                    const status = webRes.status || 200;
                    /** @type {Record<string, string | number | readonly string[]>} */
                    const headers = {};
                    for (const [k, v] of webRes.headers.entries()) headers[k] = v;
                    res.writeHead(status, /** @type {any} */ (headers));
                    const buf = await webRes.arrayBuffer().catch(() => null);
                    if (buf) res.end(Buffer.from(buf)); else res.end();
                };

                if (req.method === 'OPTIONS' && typeof mod.onRequestOptions === 'function') {
                    const webRes = await mod.onRequestOptions();
                    await flushResponse(webRes);
                    return;
                }

                if (req.method === 'POST' && typeof mod.onRequestPost === 'function') {
                    const chunks = [];
                    req.on('data', c => chunks.push(c));
                    req.on('end', async () => {
                        const raw = Buffer.concat(chunks).toString();
                        const url = `http://localhost:${PORT}${req.url}`;
                        /** @type {Record<string, string | number | readonly string[]>} */
                        const headerMap = {};
                        for (const [k, v] of Object.entries(req.headers)) {
                            if (v !== undefined) headerMap[k] = v;
                        }
                        const webReq = new Request(url, {
                            method: 'POST',
                            headers: /** @type {any} */ (headerMap),
                            body: raw
                        });
                        const webRes = await mod.onRequestPost({ request: webReq, env: process.env });
                        await flushResponse(webRes);
                    });
                    return;
                }

                // Unsupported method
                res.writeHead(405, { 'Content-Type': 'text/plain' });
                res.end('Method Not Allowed');
                return;
            } catch (e) {
                console.error('Function router error:', e);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }
        })();
        return;
    }

    // Normalize the requested path to avoid absolute path injection via leading slash
    const cleanPath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
    let filePath = join(publicDir, cleanPath);

    // Check if path is a directory and serve index.html from it
    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
        filePath = join(filePath, 'index.html');
    }

    // Security check - prevent directory traversal
    const resolvedPath = resolve(filePath);
    if (!resolvedPath.startsWith(publicDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Check if file exists
    if (!existsSync(filePath)) {
        // Developer convenience: try adding a `.html` extension for extensionless URLs (e.g., /docs -> /docs.html)
        const altHtml = filePath + '.html';
        if (existsSync(altHtml)) {
            filePath = altHtml;
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head><title>404 - File Not Found</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>404 - File Not Found</h1>
                    <p>The requested file <code>${req.url}</code> was not found.</p>
                    <p><a href="/">Go back to home</a></p>
                </body>
                </html>
            `);
            return;
        }
    }

    // Get file extension
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    let contentType = 'text/html';

    switch (ext) {
        case 'css':
            contentType = 'text/css';
            break;
        case 'js':
            contentType = 'text/javascript';
            break;
        case 'json':
            contentType = 'application/json';
            break;
        case 'png':
            contentType = 'image/png';
            break;
        case 'jpg':
        case 'jpeg':
            contentType = 'image/jpeg';
            break;
        case 'svg':
            contentType = 'image/svg+xml';
            break;
        case 'ico':
            contentType = 'image/x-icon';
            break;
        case 'txt':
            contentType = 'text/plain';
            break;
        case 'xml':
            contentType = 'application/xml';
            break;
        case 'woff':
            contentType = 'font/woff';
            break;
        case 'woff2':
            contentType = 'font/woff2';
            break;
    }

    try {
        let data = readFileSync(filePath, 'utf8');

        // Process SSI includes and placeholders for HTML files
        if (ext === 'html') {
            // Process nav-main.html include
            data = data.replace(/<!--#include file="\.\.\/templates\/nav-main\.html" -->/g, getTemplate('nav-main.html'));
            // Process analytics.html include
            data = data.replace(/<!--#include file="analytics\.html" -->/g, getPublicFile('analytics.html'));
            // Process FOOTER_PLACEHOLDER
            data = data.replace(/<!-- FOOTER_PLACEHOLDER -->/g, getTemplate('footer.html'));
            // Process HERO_PLACEHOLDER (if needed)
            if (urlPath === '/pricing' || urlPath === '/pricing.html' || urlPath === '/pricing/') {
                data = data.replace(/<!-- HERO_PLACEHOLDER -->/g, getTemplate('hero-pricing.html'));
            } else {
                data = data.replace(/<!-- HERO_PLACEHOLDER -->/g, getTemplate('hero.html'));
            }
        }

        const bytes = Buffer.byteLength(data, 'utf8');
        console.log(`[dev-server] Serving ${req.url} -> ${filePath} (${bytes} bytes, type=${contentType})`);
        res.writeHead(200, { 'Content-Type': contentType });
        try {
            res.end(data, () => { console.log(`[dev-server] Finished ${req.url}`); });
        } catch (err) {
            console.error(`[dev-server] Error while sending ${req.url}:`, err);
            try { res.end(); } catch (e) { /* ignore */ }
        }
    } catch (error) {
        console.error('[dev-server] Unhandled server error while serving', req.url, error);
        res.writeHead(500);
        res.end('Server error');
    }
});

let PORT = portArg || parseInt(process.env.PORT, 10) || 8000;
let isShuttingDown = false;

function startServer(startPort, attemptsLeft = 20) {
    PORT = startPort;
    server.listen(PORT, () => {
        console.log(`🚀 Clodo Framework Dev Server running at http://localhost:${PORT}`);
        console.log(`📁 Serving files from: ${publicDir}`);
        console.log(`🏠 Home page: http://localhost:${PORT}/`);
    });

    server.on('error', (err) => {
        /** @type {any} */
        const e = err;
        if (e && e.code === 'EADDRINUSE') {
            if (attemptsLeft > 0) {
                const nextPort = PORT + 1;
                console.warn(`⚠️  Port ${PORT} in use. Trying ${nextPort}...`);
                // Remove current error listener to avoid stacking
                server.removeAllListeners('error');
                // Create a new server instance and retry
                const newServer = createServer(/** @type {any} */ (server.listeners('request')[0]));
                // Replace server reference
                server.close(() => {
                    // no-op
                });
                // Rebind graceful shutdown to new server
                bindShutdown(newServer);
                // Reassign global server ref
                global.server = newServer;
                server = newServer;
                startServer(nextPort, attemptsLeft - 1);
            } else {
                console.error(`❌ All retry ports are in use. Last attempted: ${PORT}`);
                process.exit(1);
            }
        } else {
            console.error('❌ Server error:', err);
            process.exit(1);
        }
    });
}

function bindShutdown(srv) {
    function shutdown(signal) {
        if (isShuttingDown) return;
        isShuttingDown = true;
        console.log(`\n${signal} received. Shutting down dev server...`);
        srv.close(() => {
            console.log('✅ Server closed. Bye!');
            process.exit(0);
        });
    }
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Initial bind and start
bindShutdown(server);
startServer(PORT);
// Helpful error messages (e.g., port already in use)
// Note: error handling now lives inside startServer for retry logic