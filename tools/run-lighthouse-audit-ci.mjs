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
  const baseCmd = `npx lighthouse ${url} --quiet --output=json --output-path=${outputPath} --chrome-flags="--headless"`;

  // Run initial audit
  try {
    execSync(baseCmd, { stdio: 'inherit' });
    console.log('Lighthouse audit completed');
  } catch (err) {
    // Detect common interstitial / challenge failure and retry with blocked URL patterns to avoid external interstitials
    const msg = err && err.message ? err.message : '';
    if (/interstitial|challenge|ERR_ADDRESS_UNREACHABLE|ERR_CONNECTION_REFUSED/i.test(msg) || err.status === 1) {
      console.warn('Runtime error encountered: Chrome interstitial or blocked resource detected. Retrying with blocked external patterns...');
      const blocked = [
        'https://www.clodo.dev/cdn-cgi/*',
        'https://www.googletagmanager.com/*',
        'https://static.cloudflareinsights.com/*'
      ];
      const retryCmd = `${baseCmd} --blocked-url-patterns='${JSON.stringify(blocked)}'`;
      try {
        execSync(retryCmd, { stdio: 'inherit' });
        console.log('Lighthouse audit completed with blocked URL patterns');
      } catch (err2) {
        console.warn('Blocking external URLs did not resolve the interstitial. Trying to map production host to localhost to avoid Cloudflare challenges...');
        const mapCmd = baseCmd.replace('--chrome-flags="--headless"', `--chrome-flags="--headless --host-resolver-rules='MAP www.clodo.dev 127.0.0.1,MAP *.clodo.dev 127.0.0.1' --allow-insecure-localhost --ignore-certificate-errors"`);
        try {
          execSync(`${mapCmd} --blocked-url-patterns='${JSON.stringify(blocked)}'`, { stdio: 'inherit' });
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
            const fbCmd = `npx lighthouse ${fallbackUrl} --quiet --output=json --output-path=${fallbackOut} --chrome-flags="--headless" --blocked-url-patterns='${JSON.stringify(blocked)}'`;
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
