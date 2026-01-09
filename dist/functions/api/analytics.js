/**
 * Cloudflare Analytics Proxy
 * 
 * This function proxies Cloudflare Web Analytics beacon requests server-side
 * to avoid CORS issues and service availability problems on the client.
 * 
 * Runs on: /api/analytics POST requests
 * Benefits:
 * - No CORS errors in console
 * - Server-side retries on 503
 * - Can batch requests
 * - Cacheable responses
 */

export async function onRequestPost(context) {
    try {
        const { request } = context;
        const body = await request.json();
        
        // Validate required fields
        if (!body.token) {
            return new Response(JSON.stringify({ error: 'Missing token' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Forward beacon to Cloudflare with retry logic
        const _beaconResponse = await sendBeaconWithRetry(body.token, body.data);
        
        // Return success response to client (doesn't matter if beacon succeeds server-side)
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store' // Don't cache beacon requests
            }
        });
    } catch (error) {
        console.error('Analytics proxy error:', error);
        
        // Return success anyway - analytics shouldn't break the site
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Send beacon with retry logic for 503 errors
 */
async function sendBeaconWithRetry(token, data, retries = 3) {
    const beaconUrl = 'https://cloudflareinsights.com/cdn-cgi/rum';
    
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await fetch(beaconUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    ...data,
                    token: token
                })
            });
            
            // Success
            if (response.ok) {
                return response;
            }
            
            // If 503, retry
            if (response.status === 503 && attempt < retries - 1) {
                // Exponential backoff: 100ms, 200ms, 400ms
                await new Promise(resolve => 
                    setTimeout(resolve, Math.pow(2, attempt) * 100)
                );
                continue;
            }
            
            return response;
        } catch (error) {
            if (attempt === retries - 1) {
                throw error;
            }
            
            // Exponential backoff on network error
            await new Promise(resolve => 
                setTimeout(resolve, Math.pow(2, attempt) * 100)
            );
        }
    }
}

export async function onRequestGet(_context) {
    return new Response('Analytics proxy endpoint - POST only', {
        status: 405,
        headers: { 'Allow': 'POST' }
    });
}
