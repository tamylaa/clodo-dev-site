#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const urlArgIndex = args.indexOf('--url');
const outArgIndex = args.indexOf('--outputPath');
const url = urlArgIndex !== -1 ? args[urlArgIndex + 1] : 'http://localhost:3000/';
const outputPath = outArgIndex !== -1 ? args[outArgIndex + 1] : './lighthouse-results/ci-local.json';

console.log(`Running Lighthouse for ${url} -> ${outputPath}`);

try {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const defaultBlocked = [
    'https://www.clodo.dev/cdn-cgi/*',
    'https://www.googletagmanager.com/*',
    'https://static.cloudflareinsights.com/*',
    'https://conversations-widget.brevo.com/*',
    'https://widget.brevo.com/*'
  ];

  function buildBlockedArg(list) {
    return `--blocked-url-patterns='${JSON.stringify([...new Set(list)])}'`;
  }

  // Allow optional overrides via LH_BLOCKED_URLS env var (comma-separated)
  const envBlocked = process.env.LH_BLOCKED_URLS ? process.env.LH_BLOCKED_URLS.split(',').map(s => s.trim()).filter(Boolean) : [];
  const blockedList = defaultBlocked.concat(envBlocked);
  const blockedArg = buildBlockedArg(blockedList);

  const baseCmd = `npx lighthouse ${url} --quiet --output=json --output-path=${outputPath} --chrome-flags="--headless" ${blockedArg}`;

  // Run initial audit
  try {
    execSync(baseCmd, { stdio: 'inherit' });
    console.log('Lighthouse audit completed');
  } catch (err) {
    // Detect common interstitial / challenge failure and retry with blocked URL patterns to avoid external interstitials
    const msg = err && err.message ? err.message : '';
    if (/interstitial|challenge|ERR_ADDRESS_UNREACHABLE|ERR_CONNECTION_REFUSED/i.test(msg) || err.status === 1) {
      console.warn('Runtime error encountered: Chrome interstitial or blocked resource detected. Retrying with blocked external patterns...');
      // Retry using the same blocked list (honoring any LH_BLOCKED_URLS overrides); log for debugging
      console.warn('Retrying with blocked URL patterns to avoid interstitials or noisy third-party scripts...');
      console.log('Blocked URL patterns in use:', JSON.stringify(blockedList, null, 2));

      const retryCmd = `npx lighthouse ${url} --quiet --output=json --output-path=${outputPath} --chrome-flags="--headless" ${buildBlockedArg(blockedList)}`;
      try {
        execSync(retryCmd, { stdio: 'inherit' });
        console.log('Lighthouse audit completed with blocked URL patterns');
      } catch (err2) {
        console.warn('Blocking external URLs did not resolve the interstitial. Trying to map production host to localhost to avoid Cloudflare challenges...');
        const mapChromeFlags = `--headless --host-resolver-rules='MAP www.clodo.dev 127.0.0.1,MAP *.clodo.dev 127.0.0.1' --allow-insecure-localhost --ignore-certificate-errors`;
        const mapCmd = `npx lighthouse ${url} --quiet --output=json --output-path=${outputPath} --chrome-flags="${mapChromeFlags}" ${buildBlockedArg(blockedList)}`;
        try {
          execSync(mapCmd, { stdio: 'inherit' });
          console.log('Lighthouse audit completed with host mapping to localhost');
        } catch (err3) {
          console.warn('Lighthouse audit failed after mapping host to localhost as well:', err3.message);
          // Try fallback paths (pages less likely to be impeded by edge interstitials)
          const fallbacks = ['/pricing.html', '/pricing', '/docs', '/examples'];
          let success = false;
          for (const p of fallbacks) {
            const trimmedUrl = url.replace(/\/+$/,'');
            const fallbackUrl = trimmedUrl + p;
            const fallbackOut = outputPath.replace(/(\.json)$/,'') + `.${p.replace(/[^a-z0-9]/gi,'_')}.json`;
            const fbCmd = `npx lighthouse ${fallbackUrl} --quiet --output=json --output-path=${fallbackOut} --chrome-flags="--headless" ${buildBlockedArg(blockedList)}`;
            try {
              execSync(fbCmd, { stdio: 'inherit' });
              console.log(`Lighthouse audit completed for fallback: ${fallbackUrl} -> ${fallbackOut}`);
              console.warn(`Warning: original URL ${url} failed with interstitial; fallback ${fallbackUrl} succeeded. Inspect fallback report.`);
              success = true;
              break;
            } catch (fberr) {
              console.warn(`Fallback ${fallbackUrl} failed:`, fberr.message);
            }
          }
          if (!success) {
            console.error('All fallbacks failed; Lighthouse audit could not complete locally.');
            process.exit(2);
          }
        }
      }
    } else {
      console.error('Lighthouse audit failed', msg);
      process.exit(2);
    }
  }
} catch (err) {
  console.error('Failed to prepare Lighthouse output path or run audit', err.message);
  process.exit(2);
}
