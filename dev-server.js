import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve root: dist (production build) by default, or public if --public flag provided
const usePublic = process.argv.includes('--public');
const publicDir = join(__dirname, usePublic ? 'public' : 'dist');

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

let server = createServer((req, res) => {
    // Parse URL to remove query parameters
    const urlPath = req.url.split('?')[0];
    let filePath = join(publicDir, urlPath === '/' ? 'index.html' : urlPath);

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
            // Process FOOTER_PLACEHOLDER
            data = data.replace(/<!-- FOOTER_PLACEHOLDER -->/g, getTemplate('footer.html'));
            // Process HERO_PLACEHOLDER (if needed)
            data = data.replace(/<!-- HERO_PLACEHOLDER -->/g, getTemplate('hero.html'));
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    } catch (error) {
        res.writeHead(500);
        res.end('Server error');
    }
});

let PORT = parseInt(process.env.PORT, 10) || 8000;
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