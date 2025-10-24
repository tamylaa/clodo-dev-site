const http = require('http');
const fs = require('fs');
const path = require('path');

// Serve from public directory
const publicDir = path.join(__dirname, 'public');

let server = http.createServer((req, res) => {
    let filePath = path.join(publicDir, req.url === '/' ? 'index.html' : req.url);

    // Security check - prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(publicDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
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
        const ext = path.extname(filePath);
        let contentType = 'text/html';

        switch (ext) {
            case '.css':
                contentType = 'text/css';
                break;
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpeg';
                break;
            case '.svg':
                contentType = 'image/svg+xml';
                break;
            case '.ico':
                contentType = 'image/x-icon';
                break;
            case '.txt':
                contentType = 'text/plain';
                break;
            case '.xml':
                contentType = 'application/xml';
                break;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Server error');
                return;
            }

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

let PORT = parseInt(process.env.PORT, 10) || 8000;

function startServer(startPort, attemptsLeft = 20) {
    PORT = startPort;
    server.listen(PORT, () => {
        console.log(`🚀 Clodo Framework Dev Server running at http://localhost:${PORT}`);
        console.log(`📁 Serving files from: ${publicDir}`);
        console.log(`🏠 Home page: http://localhost:${PORT}/`);
    });

    server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
            if (attemptsLeft > 0) {
                const nextPort = PORT + 1;
                console.warn(`⚠️  Port ${PORT} in use. Trying ${nextPort}...`);
                // Remove current error listener to avoid stacking
                server.removeAllListeners('error');
                // Create a new server instance and retry
                const newServer = http.createServer(server.listeners('request')[0]);
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

// Graceful shutdown and better Windows behavior: exit 0 on Ctrl+C
function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down dev server...`);
    server.close(() => {
        console.log('✅ Server closed. Bye!');
        process.exit(0);
    });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Helpful error messages (e.g., port already in use)
// Note: error handling now lives inside startServer for retry logic