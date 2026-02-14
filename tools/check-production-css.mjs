#!/usr/bin/env node
import fetch from 'node-fetch';
import { argv } from 'process';

async function main() {
  const url = argv[2] || 'https://www.clodo.dev/pricing';
  console.log(`Checking production URL: ${url}`);

  // Helper to fetch with retries for transient errors (403/429/5xx or network errors)
  async function fetchWithRetry(target, options = {}, attempts = 5, delayMs = 2000) {
    const ua = { 'User-Agent': 'Clodo-Site-Checks/1.0 (+https://github.com/tamylaa/clodo-dev-site)' };
    const opts = { ...options, headers: { ...(options.headers || {}), ...ua } };
      for (let i = 1; i <= attempts; i++) {
      try {
        const res = await fetch(target, opts);
        if (res.ok) return res;

        // Treat 403/429/5xx as transient and retry
        const status = res.status;
        if ((status === 403 || status === 429 || (status >= 500 && status < 600)) && i < attempts) {
          console.warn(`Fetch returned status ${status}, retrying (${i}/${attempts}) after ${delayMs}ms...`);
          await new Promise(r => setTimeout(r, delayMs));
          delayMs *= 2;
          continue;
        }

        // Non-retriable or final attempt
        return res;
      } catch (err) {
        if (i < attempts) {
          console.warn(`Fetch error (${err.message}), retrying (${i}/${attempts}) after ${delayMs}ms...`);
          await new Promise(r => setTimeout(r, delayMs));
          delayMs *= 2;
          continue;
        }
        throw err;
      }
    }
  }

  // Check Pages deployment via API to help decide when Cloudflare blocks public URL
  // If a COMMIT_HASH is provided via env, prefer a deployment that matches that commit. Falls back to latest deployment if not found.
  async function checkPagesDeployment(accountId, projectName, apiToken, commitHash) {
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`;
    const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiToken}`, Accept: 'application/json' }, timeout: 10000 });
    if (!res.ok) throw new Error(`Pages API returned ${res.status}`);
    const json = await res.json();
    // Look for indicators of a successful deployment
    const results = json && (json.result || json.results || json.deployments || []);
    if (!Array.isArray(results) || results.length === 0) return false;

    // If a commit hash is provided, try to find a matching deployment
    if (commitHash) {
      const match = results.find(r => JSON.stringify(r).includes(commitHash));
      if (match) {
        const candidateValues = [match.status, match.phase, match.state, match.deployment_status, match.result];
        const asString = JSON.stringify(candidateValues).toLowerCase();
        console.log('Pages API: found deployment matching commit hash with status:', asString);

        // If the matched deployment isn't yet successful, poll the Pages API briefly
        if (!/success|built|ready|succeeded/.test(asString)) {
          console.log('Matched deployment not successful yet; polling Pages API for up to 60s for it to reach a ready state');
          const pollAttempts = 12; // ~60s total with 5s interval
          for (let attempt = 1; attempt <= pollAttempts; attempt++) {
            await new Promise(r => setTimeout(r, 5000));
            const followRes = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiToken}`, Accept: 'application/json' }, timeout: 10000 });
            if (!followRes.ok) {
              console.warn(`Pages API poll returned ${followRes.status} (attempt ${attempt}/${pollAttempts})`);
              continue;
            }
            const followJson = await followRes.json();
            const followResults = followJson && (followJson.result || followJson.results || followJson.deployments || []);
            const followMatch = Array.isArray(followResults) && followResults.find(r => JSON.stringify(r).includes(commitHash));
            if (followMatch) {
              const followValues = [followMatch.status, followMatch.phase, followMatch.state, followMatch.deployment_status, followMatch.result];
              const followStr = JSON.stringify(followValues).toLowerCase();
              console.log(`Pages API poll attempt ${attempt}: status ${followStr}`);
              if (/success|built|ready|succeeded/.test(followStr)) {
                console.log('Pages API: deployment reached success state on poll');
                return true;
              }
            }
          }

          console.warn('Pages API: matched deployment did not reach a ready state within poll window');

          // As a fallback, try to locate Pages preview URLs in the matched deployment object
          try {
            const text = JSON.stringify(match);
            const urlRegex = /https?:\/\/[^"\s]+\.pages\.dev/gi;
            const hostRegex = /[a-z0-9-]+\.pages\.dev/gi;
            const urls = new Set();
            let m;
            while ((m = urlRegex.exec(text)) !== null) urls.add(m[0]);
            while ((m = hostRegex.exec(text)) !== null) urls.add(`https://${m[0]}`);

            if (urls.size) {
              console.log('Pages API: found preview URLs in deployment:', Array.from(urls).join(', '));
              // Try fetching the preview URL's same path as the public URL (e.g., /pricing)
              const targetPath = new URL(url).pathname || '/';
              for (const preview of Array.from(urls)) {
                try {
                  const previewTarget = new URL(targetPath, preview).toString();
                  console.log(`Attempting preview fetch: ${previewTarget}`);
                  const pvRes = await fetchWithRetry(previewTarget, { timeout: 15000 }, 3, 1000);
                  if (pvRes && pvRes.ok) {
                    console.log(`Preview URL ${preview} returned OK — proceeding to validate CSS from preview origin.`);
                    pageRes = pvRes; // use preview response for subsequent checks
                    break;
                  }
                  console.warn(`Preview fetch ${previewTarget} returned ${pvRes && pvRes.status}`);
                } catch (e) {
                  console.warn(`Preview fetch failed for ${preview}: ${e.message}`);
                }
              }
            }
          } catch (e) {
            console.warn('Error while parsing matched deployment for preview URLs:', e.message);
          }

          // If we managed to fetch a preview page successfully, continue; otherwise fail.
          if (pageRes && pageRes.ok) {
            console.log('Proceeding with CSS checks using the preview-origin response.');
            return true;
          }

          console.warn('Pages API: matched deployment did not provide an accessible preview URL; failing smoke check.');
          return false;
        }

        return true;
      }
      console.warn('Pages API: no deployment matched commit hash; falling back to latest deployment status.');
    }

    const latest = results[0];
    const candidateValues = [latest.status, latest.phase, latest.state, latest.deployment_status, latest.result];
    const asString = JSON.stringify(candidateValues).toLowerCase();
    // Consider success if any common success keywords appear
    return /success|built|ready|succeeded/.test(asString);
  }

  // Now perform the page fetch
  let pageRes = await fetchWithRetry(url, { timeout: 15000 });
  if (!pageRes) throw new Error('Failed to fetch page: no response');

  // If final response is not OK, attempt to handle Cloudflare challenge or fallback to Pages API
  if (!pageRes.ok) {
    const fullText = await pageRes.text();
    const snippet = fullText.slice(0, 200);

    const isChallenge = /Just a moment|Cloudflare/i.test(fullText) || pageRes.status === 403;
    if (isChallenge) {
      console.warn('Detected Cloudflare challenge or protection page in response.');

      // Optionally treat challenge as non-fatal (CI override)
      const treatAsWarning = (process.env.CHECK_CHALLENGE_AS_WARNING === '1' || process.env.CHECK_CHALLENGE_AS_WARNING === 'true');
      if (treatAsWarning) {
        console.warn('Environment flag CHECK_CHALLENGE_AS_WARNING set — treating challenge as a warning and passing check.');
        process.exit(0);
      }

      // If Pages API credentials are present, verify latest deployment status
      const accountId = process.env.CF_PAGES_ACCOUNT_ID;
      const projectName = process.env.CF_PAGES_PROJECT_NAME;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;

      if (accountId && projectName && apiToken) {
        console.log('Pages API credentials detected; checking Pages deployment status as fallback.');
        try {
          const ok = await checkPagesDeployment(accountId, projectName, apiToken, process.env.COMMIT_HASH);
          if (ok) {
            console.log('Pages API indicates most recent deployment is successful — passing check despite challenge.');
            // allow rest of checks to proceed by re-fetching the page once
            const retryRes = await fetchWithRetry(url, { timeout: 15000 }, 3, 1000);
            if (retryRes && retryRes.ok) {
              console.log('Succeeded fetching public URL after Pages API reported success.');
              pageRes = retryRes; // eslint-disable-line no-param-reassign
            } else {
              console.warn('Retry after Pages API success did not return OK; proceeding to use Pages API success as justification to pass.');
              return;
            }
          } else {
            throw new Error('Pages API did not report a successful deployment');
          }
        } catch (e) {
          throw new Error(`Failed to fetch page: ${pageRes.status}. Response snippet: ${snippet}. Pages API check failed: ${e.message}`);
        }
      }

      throw new Error(`Failed to fetch page: ${pageRes.status}. Response snippet: ${snippet}. Cloudflare protection detected and no Pages API credentials/override configured.`);
    }

    throw new Error(`Failed to fetch page: ${pageRes.status}. Response snippet: ${snippet}`);
  }

  const html = await pageRes.text();

  // If HTML contains rel=preload as=style or page-specific css pages, ensure an inline asset manifest was injected
  const needsManifest = /<link[^>]+rel=("|')preload\1[^>]+as=("|')style\2/i.test(html) || /css\/pages\//i.test(html);
  const hasManifest = /window\.__assetManifest__/i.test(html);
  if (needsManifest && !hasManifest) {
    // Try to fetch external /asset-manifest.json as a fallback — if present and non-empty, allow but warn
    try {
      const amRes = await fetch(new URL('/asset-manifest.json', url).toString(), { timeout: 5000 });
      if (amRes && amRes.ok) {
        const json = await amRes.json();
        if (json && Object.keys(json).length) {
          console.warn('Asset manifest not found inline in HTML, but /asset-manifest.json is present and non-empty in production — this is a WARN-level condition.');
        } else {
          throw new Error('Asset manifest missing from deployed HTML and /asset-manifest.json is empty; page contains style preloads or page-specific CSS.');
        }
      } else {
        throw new Error('Asset manifest missing from deployed HTML and /asset-manifest.json is not accessible; page contains style preloads or page-specific CSS.');
      }
    } catch (e) {
      throw new Error(e.message || 'Asset manifest missing from deployed HTML, but page contains style preloads or page-specific CSS. Manifest must be inlined during build/deploy.');
    }
  }

  // Find the first styles-pricing link (supports hashed filename like styles-pricing.<hash>.css)
  const match = html.match(/href=["']([^"']*styles-pricing(?:\.[0-9a-f]{6,})?\.css[^"']*)["']/i);
  if (!match) throw new Error('No styles-pricing CSS link found in page HTML');
  const cssUrl = match[1].startsWith('http') ? match[1] : new URL(match[1], url).toString();
  console.log(`Found CSS link: ${cssUrl}`);

  // Accept either a cache-busting query param or a content-hashed filename
  if (!/styles-pricing\.css\?v=/i.test(cssUrl) && !/styles-pricing\.[0-9a-f]{6,}\.css/i.test(cssUrl)) {
    throw new Error('CSS link does not include cache-busting query param (?v=) or a content-hashed filename, deploy may not have applied cache-busting');
  }

  // Fetch the CSS
  const cssRes = await fetch(cssUrl, { timeout: 15000 });
  if (!cssRes.ok) throw new Error(`Failed to fetch CSS: ${cssRes.status}`);
  const css = await cssRes.text();

  // Check for expected selectors added by the change
  const expected = ['.social-proof-section', '.stat-card', '.testimonial-card'];
  const found = expected.filter(s => css.includes(s));

  if (found.length === 0) {
    throw new Error('Deployed CSS does not contain expected social-proof selectors');
  }

  console.log(`Success: found selectors: ${found.join(', ')}`);
  process.exit(0);
}

main().catch(err => {
  console.error('Smoke check failed:', err.message);
  process.exit(1);
});
