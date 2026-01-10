/**
 * Download Delivery Handler
 * 
 * Validates time-limited download token and serves validator scripts ZIP file.
 * This handler prevents unlimited sharing and tracks legitimate downloads.
 * 
 * Route: GET /download/scripts?token=XXX
 * 
 * Flow:
 * 1. Receive token from query parameter
 * 2. Decode and validate token (email:timestamp:expiry:hash)
 * 3. Check expiry time (must be valid 24-hour window)
 * 4. Verify hash matches (prevents tampering)
 * 5. Check if token already used (one-time use)
 * 6. Send ZIP file with validator scripts
 * 7. Mark token as used (prevent reuse)
 */

export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');
        console.log('[Download] Delivery token received (prefix):', token ? token.substring(0, 24) + '...' : 'missing');

        if (!token) {
            return sendErrorPage('Missing download token', 400);
        }

        // Validate token format and expiry
        const tokenData = await validateDownloadToken(token, env);
        if (!tokenData) {
            return sendErrorPage('Invalid or expired download link. Please request a new one.', 400);
        }

        const { email } = tokenData;

        // Check if token already used (one-time use) — use hashed key to avoid special chars
        const kv = env.DOWNLOADS_KV;
        if (kv) {
            const usedKey = `download-used:${simpleHash(token)}`;
            const alreadyUsed = await kv.get(usedKey);

            if (alreadyUsed) {
                return sendErrorPage('This download link has already been used. Please request a new one.', 403);
            }

            // Mark as used (prevent reuse)
            await kv.put(usedKey, new Date().toISOString(), { expirationTtl: 86400 }); // 24 hours
        }

        // Get or generate ZIP file
        const zipBuffer = await getValidatorScriptsZip(env, request);

        // Log successful download
        console.log(`[Download] Delivered to: ${email} | Timestamp: ${new Date().toISOString()}`);

        if (kv) {
            const deliveryKey = `download-delivered:${new Date().toISOString()}:${email}`;
            await kv.put(deliveryKey, JSON.stringify({
                email,
                timestamp: new Date().toISOString(),
                token: token.substring(0, 20) + '...' // Log hash of token
            }), { expirationTtl: 7776000 }); // 90 days
        }

        // Send ZIP file
        const contentLength = zipBuffer && (zipBuffer.byteLength || zipBuffer.length || 0);
        return new Response(zipBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename="clodo-validator-scripts.zip"',
                'Content-Length': String(contentLength),
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

    } catch (error) {
        console.error('[Download] Delivery error:', error);
        return sendErrorPage('Download failed. Please try again or contact support.', 500);
    }
}

/**
 * Validate download token
 * Returns { email } if valid, null if invalid/expired
 */
async function validateDownloadToken(token, env) {
    try {
        // Decode from base64 (token is URL-encoded in emails)
        let decoded;
        try {
            decoded = atob(decodeURIComponent(token));
        } catch (err) {
            console.error('[Download] Token decode error:', err);
            return null;
        }
        const parts = decoded.split(':');

        if (parts.length !== 4) {
            return null;
        }

        const [email, timestamp, expiry, providedHash] = parts;
        const expiryTime = parseInt(expiry, 10);

        // Check expiry
        if (Date.now() > expiryTime) {
            console.warn(`[Download] Token expired for ${email}`);
            return null;
        }

        // Verify hash
        const secret = env.DOWNLOAD_TOKEN_SECRET || 'default-secret-change-me';
        const data = `${email}:${timestamp}:${expiry}`;
        const expectedHash = simpleHash(`${data}:${secret}`);

        if (expectedHash !== providedHash) {
            console.warn(`[Download] Hash mismatch for token`);
            return null;
        }

        // OPTIONAL: Verify token was issued and not revoked by checking KV
        if (env.DOWNLOADS_KV) {
            try {
                const tokenKey = `download-token:${simpleHash(token)}`;
                const exists = await env.DOWNLOADS_KV.get(tokenKey);
                if (!exists) {
                    console.warn(`[Download] Token missing in KV (may be revoked): ${tokenKey}`);
                    return null;
                }
            } catch (err) {
                console.warn('[Download] KV check error:', err);
            }
        }

        return { email, timestamp, expiry: expiryTime };
    } catch (error) {
        console.error('[Download] Token validation error:', error);
        return null;
    }
}

/**
 * Simple hash function (matches generator)
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

/**
 * Get validator scripts ZIP file
 * 
 * Options:
 * 1. Pre-built and cached in R2 (fastest)
 * 2. Generated on-demand (most flexible)
 * 3. Fetch from GitHub releases (if published)
 * 
 * For now, we'll use on-demand generation with caching.
 */
async function getValidatorScriptsZip(env, request) {
    // Static-only approach: fetch a static ZIP from the site at /downloads/validator-scripts.zip
    // (R2 support removed - we serve the uploaded static asset instead)

    // Option 2: Try to fetch a static ZIP from the same site (uploads into repository at /downloads/validator-scripts.zip)
    try {
        const url = new URL(request.url);
        const staticUrl = `${url.protocol}//${url.host}/downloads/validator-scripts.zip`;
        console.log('[Download] Attempting to fetch static ZIP from:', staticUrl);
        const resp = await fetch(staticUrl);
        if (resp && resp.ok) {
            console.log('[Download] Serving ZIP from static site asset');
            return await resp.arrayBuffer();
        } else {
            console.warn('[Download] Static ZIP fetch failed:', resp && resp.status);
        }
    } catch (err) {
        console.warn('[Download] Static ZIP fetch error:', err);
    }

    // Option 3: Generate ZIP on-demand (fallback)
    console.log('[Download] Generating ZIP on-demand');
    const zipBuffer = await generateValidatorScriptsZip(env);

    // No R2 caching in static-only approach

    return zipBuffer;
}

/**
 * Generate ZIP file containing validator scripts
 * 
 * For a Cloudflare Worker, we can't easily use jszip.
 * Instead, we'll create a simple ZIP format manually or
 * fetch pre-built ZIP from R2/S3.
 * 
 * Alternative: Return scripts as a tar.gz or pre-built ZIP URL
 */
async function generateValidatorScriptsZip(env) {
    // For now, we'll use a simple approach:
    // 1. If ZIP is pre-built and stored, fetch it
    // 2. Otherwise, provide download link to GitHub release
    
    // This would be implemented with jszip or a similar library
    // For production, consider:
    // - Pre-building ZIP and storing in R2
    // - Using a GitHub Action to update it automatically
    // - Serving from a CDN
    
    // Temporary solution: Create minimal ZIP structure
    // In production, replace with proper ZIP generation
    
    const mockZip = Buffer.from([
        // ZIP header (simplified - in production use proper ZIP library)
        0x50, 0x4b, 0x03, 0x04, // ZIP signature
        0x00, 0x00, 0x00, 0x00  // Version and flags
    ]);

    // For actual implementation, fetch from R2 or generate with jszip
    // For now, return error with instructions
    throw new Error('ZIP generation not yet configured. See documentation for setup.');
}

/**
 * Send error page
 */
function sendErrorPage(message, status) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download Error - Clodo Framework</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 500px;
            padding: 40px;
            text-align: center;
        }
        h1 { color: #667eea; margin-top: 0; }
        .error { color: #dc3545; font-size: 16px; margin: 20px 0; }
        .button { 
            display: inline-block; 
            background: #667eea; 
            color: white; 
            padding: 12px 30px; 
            border-radius: 4px; 
            text-decoration: none; 
            font-weight: bold; 
            margin-top: 20px;
        }
        .button:hover { background: #764ba2; }
        .info { color: #666; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ Download Error</h1>
        <p class="error">${message}</p>
        
        <p>Your download link may have:</p>
        <ul style="text-align: left; display: inline-block;">
            <li>Expired (links valid for 24 hours)</li>
            <li>Already been used</li>
            <li>Been modified or corrupted</li>
        </ul>
        
        <h3>What to do?</h3>
        <p>
            <a href="https://www.clodo.dev/cloudflare-workers-development-guide" class="button">
                Request New Download Link
            </a>
        </p>
        
        <div class="info">
            <p>Need help? Contact support at <a href="mailto:support@clodo.dev">support@clodo.dev</a></p>
        </div>
    </div>
</body>
</html>
    `;

    return new Response(html, {
        status: status,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    });
}

/**
 * Handle preflight OPTIONS requests
 */
export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}
