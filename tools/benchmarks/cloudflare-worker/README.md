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
