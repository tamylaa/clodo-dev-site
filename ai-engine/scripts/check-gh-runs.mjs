#!/usr/bin/env node

/**
 * Quick GitHub Actions run checker
 * Usage: node scripts/check-gh-runs.mjs
 */
import { execSync } from 'child_process';

async function main() {
  try {
    const repoMatch = execSync('git config --get remote.origin.url', { encoding: 'utf-8' })
      .trim()
      .match(/github\.com[:/]([^/]+)\/([^/.]+)/);

    if (!repoMatch) return console.error('Could not determine GitHub repo');
    const [, owner, repo] = repoMatch;

    console.log(`Checking latest workflow runs for: ${owner}/${repo}`);

    const headers = { Accept: 'application/vnd.github.v3+json' };
    const token = process.env.GH_PAT || process.env.GITHUB_TOKEN;
    if (token) headers.Authorization = `token ${token}`;

    const runsResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=20`, {
      headers,
    });

    if (!runsResp.ok) {
      console.error('Failed to list runs:', runsResp.status, runsResp.statusText);
      process.exit(1);
    }

    const runs = await runsResp.json();
    const workflowRuns = runs.workflow_runs || [];

    if (workflowRuns.length === 0) {
      console.log('No workflow runs found');
      return;
    }

    for (const r of workflowRuns.slice(0, 10)) {
      console.log('---');
      console.log(`Workflow: ${r.name}  (id: ${r.id})`);
      console.log(`Event: ${r.event}  Branch: ${r.head_branch}  Status: ${r.status}  Conclusion: ${r.conclusion}`);
      console.log(`URL: ${r.html_url}`);

      if (r.conclusion && r.conclusion !== 'success') {
        console.log(' -> Fetching jobs to find failing steps...');
        const jobsResp = await fetch(r.jobs_url, { headers: { Accept: 'application/vnd.github.v3+json' } });
        if (!jobsResp.ok) {
          console.log('   Failed to fetch jobs:', jobsResp.status, jobsResp.statusText);
          continue;
        }
        const jobs = await jobsResp.json();
        for (const job of jobs.jobs || []) {
          console.log(`   Job: ${job.name}  Status: ${job.status}  Conclusion: ${job.conclusion}`);
          for (const step of job.steps || []) {
            if (step.conclusion && step.conclusion !== 'success') {
              console.log(`     ✘ Step: ${step.name} -> ${step.conclusion}`);
              if (step.number) console.log(`       Step number: ${step.number}`);
            }
          }
        }
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();