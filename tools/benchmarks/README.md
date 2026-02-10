# Benchmarks (WebPageTest)

This folder contains scripts and instructions to run reproducible multi-region WebPageTest tests for the Cloud vs Edge page.

How to run locally:

1. Install deps: npm install node-fetch minimist
2. Export your WebPageTest API key (optional): export WPT_API_KEY=xxxx
3. Run tests: node run-wpt.js --urls https://clodo.dev/edge-vs-cloud-computing --locations Dulles:Chrome,ec2-us-west-2:Chrome,ec2-eu-west-2:Chrome,ec2-ap-southeast-1:Chrome

Notes:
- Tests use public WebPageTest.org runners when no API key is provided. Rate limits may apply.
- Results are saved to `data/benchmarks/cloud-vs-edge/` as JSON files. Use these to generate charts and include in the article.
