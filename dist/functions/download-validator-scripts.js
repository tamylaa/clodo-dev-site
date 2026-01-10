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
        // ===== DIAGNOSTIC: Check environment variables =====
        const templateEnvName = env.BREVO_DOWNLOAD_TEMPLATE_ID ? 'BREVO_DOWNLOAD_TEMPLATE_ID' : (env.BREVO_TEMPLATE_ID ? 'BREVO_TEMPLATE_ID' : null);
        console.log('[Download] Environment check:', {
            hasApiKey: !!env.BREVO_API_KEY,
            hasListId: !!env.BREVO_DOWNLOAD_LIST_ID,
            hasTokenSecret: !!env.DOWNLOAD_TOKEN_SECRET,
            hasTemplateId: !!templateEnvName,
            templateEnv: templateEnvName || 'missing',
            apiKeyPrefix: env.BREVO_API_KEY ? env.BREVO_API_KEY.substring(0, 10) + '...' : 'missing',
            listId: env.BREVO_DOWNLOAD_LIST_ID || 'missing',
            tokenSecretLength: env.DOWNLOAD_TOKEN_SECRET ? env.DOWNLOAD_TOKEN_SECRET.length : 0
        });

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
        const tokenEncoded = encodeURIComponent(token);
        const downloadUrl = `${getBaseUrl(request)}/download/scripts?token=${tokenEncoded}`;
        console.log('[Download] Generated token (encoded prefix):', (tokenEncoded || '').substring(0, 24) + '...');

        // Store token metadata in KV for revocation and one-time checks (hashed key)
        try {
            const kv = env.DOWNLOADS_KV;
            if (kv) {
                const tokenKey = `download-token:${generateTokenHash(token)}`;
                await kv.put(tokenKey, JSON.stringify({ email, issuedAt: new Date().toISOString(), expiry: Date.now() + 24 * 60 * 60 * 1000 }), { expirationTtl: 86400 });
                console.log('[Download] Stored token metadata in KV:', tokenKey);
            }
        } catch (err) {
            console.warn('[Download] Failed to store token in KV:', err);
        }

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
        // Use configured sender email or default
        const senderEmail = env.BREVO_SENDER_EMAIL || 'product@clodo.dev';
        const senderName = 'Clodo Framework';

        // Prefer explicit download template env var and fall back to legacy name if present
        const templateEnvValue = env.BREVO_DOWNLOAD_TEMPLATE_ID || env.BREVO_TEMPLATE_ID || null;
        const templateEnvInUse = env.BREVO_DOWNLOAD_TEMPLATE_ID ? 'BREVO_DOWNLOAD_TEMPLATE_ID' : (env.BREVO_TEMPLATE_ID ? 'BREVO_TEMPLATE_ID' : null);
        const templateId = templateEnvValue ? parseInt(templateEnvValue, 10) : null;
        const useTemplate = !!templateId;

        // Require template usage - fail fast if not configured
        if (!useTemplate) {
            console.error('[Download] BREVO_DOWNLOAD_TEMPLATE_ID (or legacy BREVO_TEMPLATE_ID) is not configured - template is required');
            if (isNoScript) {
                return new Response(null, {
                    status: 303,
                    headers: {
                        'Location': '/download?error=template_missing'
                    }
                });
            }

            return new Response(JSON.stringify({
                error: 'Service configuration error: email template not configured',
                code: 'TEMPLATE_NOT_CONFIGURED'
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

        // Derive a simple first name for template personalization
        const rawLocal = email ? email.split('@')[0] : '';
        const firstName = rawLocal ? rawLocal.split(/[-._+]/)[0] : '';
        const firstNameFormatted = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : '';

        // Verify that the Brevo template exists and contains required placeholders
        try {
            const templateResp = await fetch(`https://api.brevo.com/v3/smtp/templates/${templateId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'api-key': apiKey
                }
            });

            if (!templateResp.ok) {
                console.error('[Download] Brevo template not found or inaccessible:', templateId, templateResp.status);
                if (isNoScript) {
                    return new Response(null, {
                        status: 303,
                        headers: {
                            'Location': '/download?error=template_missing'
                        }
                    });
                }

                const respText = await templateResp.text().catch(() => '');
                return new Response(JSON.stringify({
                    error: 'Email template missing or inaccessible in email provider',
                    code: 'TEMPLATE_MISSING',
                    details: respText
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

            const templateData = await templateResp.json().catch(() => ({}));
            const templateContent = ((templateData.htmlContent || templateData.html || JSON.stringify(templateData)) + '').toLowerCase();
            const hasRequiredPlaceholder = templateContent.includes('download_url') || templateContent.includes('download_token');

            if (!hasRequiredPlaceholder) {
                console.error('[Download] Template is missing required placeholders (DOWNLOAD_URL or DOWNLOAD_TOKEN):', templateId);
                if (isNoScript) {
                    return new Response(null, {
                        status: 303,
                        headers: {
                            'Location': '/download?error=template_invalid'
                        }
                    });
                }

                return new Response(JSON.stringify({
                    error: 'Email template does not contain required placeholders (DOWNLOAD_URL or DOWNLOAD_TOKEN)',
                    code: 'TEMPLATE_INVALID'
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

            console.log('[Download] Brevo template verified:', templateId, 'envVar:', templateEnvInUse);
        } catch (err) {
            console.error('[Download] Error verifying Brevo template:', err);
            if (isNoScript) {
                return new Response(null, {
                    status: 303,
                    headers: {
                        'Location': '/download?error=template_error'
                    }
                });
            }

            return new Response(JSON.stringify({
                error: 'Error verifying email template',
                code: 'TEMPLATE_VERIFY_FAILED'
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

        // Build template payload (template is required and was verified above)
        const emailPayload = {
            sender: { email: senderEmail, name: senderName },
            to: [{ email: email, name: 'User' }],
            templateId: templateId,
            params: {
                DOWNLOAD_URL: downloadUrl,
                download_url: downloadUrl,
                DOWNLOAD_TOKEN: tokenEncoded,
                download_token: tokenEncoded,
                CONTACT_EMAIL: email,
                FIRSTNAME: firstNameFormatted
            },
            replyTo: { email: 'product@clodo.dev', name: 'Support' }
        };

        // Log params (redact token tail) to help Brevo template debugging
        console.log('[Download] Sending via Brevo template:', templateId, 'params:', {
            DOWNLOAD_URL: downloadUrl,
            DOWNLOAD_TOKEN: (tokenEncoded || '').substring(0,24) + '...',
            CONTACT_EMAIL: email,
            FIRSTNAME: firstNameFormatted
        });

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
            console.error('[Download] Email payload was:', JSON.stringify(emailPayload));
            
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
                code: 'EMAIL_SEND_FAILED',
                details: env.ENVIRONMENT === 'development' ? emailErrorData : undefined
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

        // Capture and log Brevo response details (messageId, status)
        let emailRespData = {};
        try {
            emailRespData = await emailResponse.json().catch(() => ({}));
        } catch (e) {
            emailRespData = {};
        }

        console.log('[Download] Email send response:', { status: emailResponse.status, data: emailRespData });
        console.log(`[Download] Request sent to: ${email} | Source: ${source} | TemplateUsed: true | Timestamp: ${new Date().toISOString()}`);

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
    
    // Generate hash for integrity
    const hash = generateTokenHash(`${data}:${secret}`);
    const token = btoa(`${data}:${hash}`);

    return token;
}

/**
 * Generate hash for token integrity
 * Uses djb2 algorithm with proper 32-bit handling
 */
function generateTokenHash(str) {
    let hash = 5381; // djb2 starting value
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + char
        hash = hash >>> 0; // Convert to unsigned 32-bit
    }
    return hash.toString(16).padStart(8, '0');
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
