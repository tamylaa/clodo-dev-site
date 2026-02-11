Cloudflare Worker synthetic benchmark

Files:
- `worker.mjs` — Cloudflare Worker-compatible script that fetches a target URL and measures TTFB, total download time and bytes.
- `run-cloudflare-worker-synthetic.mjs` — Local runner using `miniflare` programmatic API (no external account required) to run multiple iterations and save results to `data/benchmarks/cloud-vs-edge/`.

How to run (local dev):
- Install dev deps: `npm i` (Miniflare installed as devDependency in this repo)
- Run synthetic sweep: `node tools/benchmarks/run-cloudflare-worker-synthetic.mjs 5` (5 runs)
- Output saved to `data/benchmarks/cloud-vs-edge/cloudflare-worker-synthetic-<timestamp>.json`

Notes:
- This uses the Miniflare runtime locally to emulate the Worker environment. To run on Cloudflare's real global network you can deploy `worker.mjs` to your Cloudflare account (Wrangler) and call the endpoint from any location to capture real edge colocation values and real latencies.
- The worker measures approximate TTFB by reading the first stream chunk, and total time by draining the response. It is meant to provide reproducible, scriptable synthetic checks.

Deploy instructions (recommended) — quick steps:
1. Create a Cloudflare API token with Worker:Edit and Account:Read permissions and set repository secrets `CF_API_TOKEN` and `CF_ACCOUNT_ID`.
2. Update `wrangler.toml` `account_id` or leave as placeholder and rely on the GitHub Action secrets.
3. Use the included GitHub Actions workflow `deploy-cloudflare-worker.yml` (manual dispatch) to publish the worker to Cloudflare.

Notes:
- Deploying to Cloudflare will give you real edge-colocated measurements (per-colo TTFB), which is what we want to capture for region-aware benchmarking.
- If you prefer not to deploy, continue using Miniflare locally for reproducible synthetic checks.
