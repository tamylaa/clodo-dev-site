export async function onRequestPost({ request, env }) {
    try {
        // Parse request body based on content-type (JSON or form submissions)
        const contentType = (request.headers.get('content-type') || '').toLowerCase();
        let requestBody = {};
        let isFormSubmission = false;

        if (contentType.includes('application/json')) {
            requestBody = await request.json().catch(() => ({}));
        } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
            const text = await request.text();
            const params = new URLSearchParams(text);
            requestBody = Object.fromEntries(params.entries());
            isFormSubmission = true;
        } else {
            // Try parsing as JSON first, then fallback to urlencoded
            const text = await request.text();
            try {
                requestBody = text ? JSON.parse(text) : {};
            } catch (e) {
                const params = new URLSearchParams(text);
                requestBody = Object.fromEntries(params.entries());
                isFormSubmission = true;
            }
        }

        const email = requestBody.email;
        const _listIds = requestBody._listIds || requestBody.listIds;
        const _updateEnabled = requestBody._updateEnabled || requestBody.updateEnabled;
        const attributes = requestBody.attributes || {};
        const honeypot = requestBody.honeypot || requestBody.website || '';

        // Determine if this was a non-JS (form) submission
        const isNoScript = isFormSubmission || requestBody.noscript === '1' || (request.headers.get('accept') || '').includes('text/html');

        // Check for honeypot spam protection
        if (honeypot && honeypot.trim() !== '') {
            return new Response(JSON.stringify({
                error: 'Spam detected'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(JSON.stringify({
                error: 'Invalid email format'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // Get API credentials from environment variables
        const apiKey = env.BREVO_API_KEY;
        const listId = env.BREVO_LIST_ID;

        if (!apiKey || !listId) {
            console.error('Missing Brevo API credentials');

            // If this was a non-JS form submission, redirect to a friendly error page instead of
            // returning a 500 JSON response so users submitting without JS get proper UX.
            if (isNoScript) {
                return new Response(null, {
                    status: 303,
                    headers: {
                        'Location': '/subscribe.html?error=1'
                    }
                });
            }

            return new Response(JSON.stringify({
                error: 'Service configuration error'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // Prepare the payload for Brevo API
        const payload = {
            email: email,
            listIds: [parseInt(listId)],
            updateEnabled: true,
            attributes: {
                SOURCE: attributes?.SOURCE || 'website',
                SUBSCRIPTION_DATE: new Date().toISOString(),
                CONSENT_GIVEN: true,
                ...attributes
            }
        };

        // Make the API call to Brevo
        const response = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify(payload)
        });

        let data;
        
        // Handle 204 No Content (success with no body)
        if (response.status === 204) {
            data = { success: true, message: 'Subscription successful' };
        } else {
            // Get response text for other status codes
            const responseText = await response.text();
            
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('Failed to parse Brevo response:', responseText);
                data = { error: 'Invalid response from email service' };
            }

            // If Brevo returns an error, log it
            if (!response.ok) {
                console.error('Brevo API error:', response.status, data);
            }
        }

        // If this was a non-JS form submission, redirect to a static thank-you or error page
        if (isNoScript) {
            const location = response.ok ? '/subscribe/thanks.html' : '/subscribe.html?error=1';
            return new Response(null, {
                status: 303,
                headers: {
                    'Location': location
                }
            });
        }

        // Return the response with CORS headers (for JSON/XHR clients)
        return new Response(JSON.stringify(data), {
            status: response.ok ? 200 : response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        console.error('Error details:', error.message, error.stack);

        // If this was a non-JS (HTML-accepting) request, redirect to a friendly error page
        const acceptHeader = (request.headers.get('accept') || '').toLowerCase();
        if (acceptHeader.includes('text/html')) {
            return new Response(null, {
                status: 303,
                headers: {
                    'Location': '/subscribe.html?error=1'
                }
            });
        }

        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error.message || 'Unknown error'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }
}

// Handle OPTIONS requests for CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}