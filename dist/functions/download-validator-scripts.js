/**
 * Download Validator Scripts Function
 * 
 * Email capture for validator scripts download.
 * REUSES TESTED patterns from newsletter-subscribe.js:
 * - Honeypot: honeypot + website fields (server-side check only)
 * - Brevo: v3/contacts endpoint with SOURCE + CONSENT_GIVEN attributes
 * - Content-Type: Supports both JSON and form submissions
 * - Error handling: Specific status codes with proper messages
 * - CORS: Pre-configured headers matching existing patterns
 * 
 * Brevo Integration Points:
 * - Endpoint: https://api.brevo.com/v3/contacts
 * - Headers: api-key, Content-Type: application/json
 * - Payload: email, listIds[], updateEnabled, attributes{}
 * 
 * Flow:
 * 1. User enters email (honeypot protection active)
 * 2. Server validates email format, checks honeypot
 * 3. Add contact to Brevo download list
 * 4. Generate 24-hour time-limited download token
 * 5. Send email with download link (includes token)
 * 6. Redirect to /download/thanks page
 */

export async function onRequestPost({ request, env }) {
    try {
        // Parse request body (exact same pattern as newsletter-subscribe.js)
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
            // Try parsing as JSON first, then fallback to urlencoded (same as newsletter)
            const text = await request.text();
            try {
                requestBody = text ? JSON.parse(text) : {};
            } catch (e) {
                const params = new URLSearchParams(text);
                requestBody = Object.fromEntries(params.entries());
                isFormSubmission = true;
            }
        }

        const email = requestBody.email?.toLowerCase()?.trim();
        const source = requestBody.source || 'cloudflare-workers-guide';
        const honeypot = requestBody.honeypot || requestBody.website || '';
        
        // Determine if this was a non-JS (form) submission (same logic as newsletter)
        const isNoScript = isFormSubmission || requestBody.noscript === '1' || (request.headers.get('accept') || '').includes('text/html');

        // ===== SPAM PREVENTION (TESTED PATTERN FROM NEWSLETTER) =====
        
        // 1. Honeypot check - catches automated spammers without affecting real users
        // This is the FIRST check because bots are the most common attack vector
        if (honeypot && honeypot.trim() !== '') {
            console.warn(`[Download] Honeypot triggered for potential email: ${email || 'unknown'}`);
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

        // 2. Email validation - permissive RFC-compliant pattern
        // Allows: local@domain, local.name@domain.com, local+tag@domain.co.uk, etc.
        const emailRegex = /^[^\s@]+@[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
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

        // ===== BREVO INTEGRATION (SAME AS NEWSLETTER) =====
        
        const apiKey = env.BREVO_API_KEY;
        const downloadListId = env.BREVO_DOWNLOAD_LIST_ID;

        if (!apiKey || !downloadListId) {
            console.error('[Download] Missing Brevo credentials');
            
            if (isNoScript) {
                return new Response(null, {
                    status: 303,
                    headers: {
                        'Location': '/download?error=1'
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

        // ===== GENERATE DOWNLOAD TOKEN =====
        // Time-limited token (24 hours, prevents infinite sharing)
        const token = generateDownloadToken(email, env);
        const downloadUrl = `${getBaseUrl(request)}/download/scripts?token=${token}`;

        // ===== ADD CONTACT TO BREVO (EXACT PATTERN FROM NEWSLETTER) =====
        
        const contactPayload = {
            email: email,
            listIds: [parseInt(downloadListId)],
            updateEnabled: true,
            attributes: {
                SOURCE: `download-${source}`,
                SUBSCRIPTION_DATE: new Date().toISOString(),
                CONSENT_GIVEN: true,
                // Custom attributes for analytics
                DOWNLOAD_TOKEN: token
            }
        };

        let contactResponse;
        try {
            contactResponse = await fetch('https://api.brevo.com/v3/contacts', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': apiKey
                },
                body: JSON.stringify(contactPayload)
            });
        } catch (fetchError) {
            console.error('[Download] Network error calling Brevo API:', fetchError);
            
            if (isNoScript) {
                return new Response(null, {
                    status: 303,
                    headers: {
                        'Location': '/download?error=1'
                    }
                });
            }

            return new Response(JSON.stringify({
                error: 'Email service temporarily unavailable. Please try again later.',
                code: 'SERVICE_UNAVAILABLE'
            }), {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // Get response data
        let contactData;
        if (contactResponse.status === 204) {
            contactData = { success: true };
        } else {
            const responseText = await contactResponse.text();
            try {
                contactData = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('[Download] Failed to parse Brevo response:', responseText);
                contactData = { error: 'Invalid response from email service' };
            }
        }

        // Log contact addition (handle 400 which means contact might already exist)
        if (!contactResponse.ok && contactResponse.status !== 400) {
            console.error('[Download] Brevo API error adding contact:', contactResponse.status, contactData);
            
            if (isNoScript) {
                return new Response(null, {
                    status: 303,
                    headers: {
                        'Location': '/download?error=1'
                    }
                });
            }

            return new Response(JSON.stringify({
                error: 'Failed to process request. Please try again.',
                code: 'CONTACT_ADD_FAILED'
            }), {
                status: contactResponse.status >= 500 ? 503 : 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // ===== SEND EMAIL WITH DOWNLOAD LINK =====
        
        const htmlContent = generateEmailTemplate(downloadUrl, email);

        const emailPayload = {
            to: [{ email: email, name: 'User' }],
            from: { email: 'downloads@clodo.dev', name: 'Clodo Framework' },
            subject: '✅ Download Validator Scripts - Cloudflare Workers Guide',
            htmlContent: htmlContent,
            replyTo: { email: 'support@clodo.dev', name: 'Support' }
        };

        let emailResponse;
        try {
            emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': apiKey
                },
                body: JSON.stringify(emailPayload)
            });
        } catch (fetchError) {
            console.error('[Download] Network error sending email:', fetchError);
            
            if (isNoScript) {
                return new Response(null, {
                    status: 303,
                    headers: {
                        'Location': '/download?error=1'
                    }
                });
            }

            return new Response(JSON.stringify({
                error: 'Failed to send email. Please try again.',
                code: 'EMAIL_SEND_FAILED'
            }), {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        if (!emailResponse.ok) {
            const emailErrorData = await emailResponse.text().catch(() => '');
            console.error('[Download] Brevo email API error:', emailResponse.status, emailErrorData);
            
            if (isNoScript) {
                return new Response(null, {
                    status: 303,
                    headers: {
                        'Location': '/download?error=1'
                    }
                });
            }

            return new Response(JSON.stringify({
                error: 'Failed to send email. Please try again.',
                code: 'EMAIL_SEND_FAILED'
            }), {
                status: emailResponse.status >= 500 ? 503 : 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // Log successful download request
        console.log(`[Download] Request sent to: ${email} | Source: ${source} | Timestamp: ${new Date().toISOString()}`);

        // Store request log for analytics
        await logDownloadRequest(email, source, env);

        // Return success response
        if (isNoScript) {
            return new Response(null, {
                status: 303,
                headers: {
                    'Location': '/download/thanks'
                }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Check your email for the download link!',
            email: email
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });

    } catch (error) {
        console.error('[Download] Unexpected error:', error);
        console.error('[Download] Error details:', error.message, error.stack);

        // Determine response format based on accept header
        const acceptHeader = (request.headers.get('accept') || '').toLowerCase();
        if (acceptHeader.includes('text/html')) {
            return new Response(null, {
                status: 303,
                headers: {
                    'Location': '/download?error=1'
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

/**
 * Generate time-limited download token (24 hours)
 * Token format: base64(email:timestamp:expiry:hash)
 * Prevents tampering and limits distribution
 */
function generateDownloadToken(email, env) {
    const timestamp = Date.now();
    const expiryTime = timestamp + (24 * 60 * 60 * 1000); // 24 hours
    
    const data = `${email}:${timestamp}:${expiryTime}`;
    const secret = env.DOWNLOAD_TOKEN_SECRET || 'default-secret-change-me';
    
    // Simple hash (HMAC-like)
    const hash = simpleHash(`${data}:${secret}`);
    const token = btoa(`${data}:${hash}`);

    return token;
}

/**
 * Simple hash function for token validation
 * In production, consider using crypto.subtle.sign for HMAC-SHA256
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
 * Generate HTML email template
 * Sent via Brevo transactional API
 */
function generateEmailTemplate(downloadUrl, email) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; font-size: 14px; }
        ul { margin: 15px 0; padding-left: 20px; }
        li { margin: 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Your Validator Scripts are Ready!</h1>
        </div>
        <div class="content">
            <p>Hi,</p>
            
            <p>Thank you for downloading the <strong>Cloudflare Workers Development Guide Validator Scripts</strong>!</p>
            
            <p>Your download link is ready. Click below to get your scripts (valid for 24 hours):</p>
            
            <center>
                <a href="${downloadUrl}" class="button">📥 Download Scripts (24-hour link)</a>
            </center>

            <h3>What's Included</h3>
            <ul>
                <li><strong>validate-code-examples.js</strong> - Syntax validator for all 43 code examples</li>
                <li><strong>publication-verification.js</strong> - Publication readiness analyzer</li>
                <li><strong>README.md</strong> - Complete usage guide</li>
                <li><strong>package.json</strong> - Dependencies (none required!)</li>
            </ul>

            <h3>Quick Start</h3>
            <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">
unzip validator-scripts.zip
cd validator-scripts
npm start</pre>

            <div class="warning">
                <strong>⏰ Link expires in 24 hours</strong> - Download now while your link is active.
            </div>

            <h3>What Gets Validated?</h3>
            <ul>
                <li>✅ All 43 code examples (JavaScript, SQL, Bash, YAML, TOML)</li>
                <li>✅ All 8 content sections</li>
                <li>✅ 2,207 verified links</li>
                <li>✅ Publication readiness</li>
            </ul>

            <p><strong>Why download?</strong></p>
            <ul>
                <li>Verify content quality yourself</li>
                <li>Learn validation best practices</li>
                <li>Customize for your own guides</li>
                <li>Share results with your team</li>
            </ul>

            <div class="footer">
                <p>Questions? Reply to this email or visit: <a href="https://www.clodo.dev/cloudflare-workers-development-guide">Cloudflare Workers Development Guide</a></p>
                <p>This email was sent to ${email} because you requested the validator scripts.</p>
                <p>If you didn't request this, you can <a href="https://www.clodo.dev/privacy">manage your preferences</a>.</p>
                <p><strong>Clodo Framework</strong> • Building the future of Cloudflare development</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Log download request for analytics (90-day retention)
 * Stores in KV for later analysis and metrics
 */
async function logDownloadRequest(email, source, env) {
    try {
        const kv = env.DOWNLOADS_KV;
        if (!kv) return; // Skip if KV not configured

        const logKey = `download-log:${new Date().toISOString()}:${email}`;
        await kv.put(
            logKey,
            JSON.stringify({
                email,
                source,
                timestamp: new Date().toISOString()
            }),
            { expirationTtl: 7776000 } // 90 days
        );
    } catch (error) {
        console.error('[Download] Logging error:', error);
        // Don't fail the request if logging fails
    }
}

/**
 * Get base URL from request
 */
function getBaseUrl(request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
}

/**
 * Handle OPTIONS requests for CORS preflight
 * (same pattern as newsletter-subscribe.js)
 */
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
