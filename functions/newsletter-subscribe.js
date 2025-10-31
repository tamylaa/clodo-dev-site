export async function onRequestPost({ request, env }) {
    try {
        // Get the request body
        const requestBody = await request.json();
        const { email, _listIds, _updateEnabled, attributes, honeypot } = requestBody;

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

        // Return the response with CORS headers
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