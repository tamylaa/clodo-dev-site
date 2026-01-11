#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import process from 'process';

function parseArgs(argv) {
  const opts = {};
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=');
      opts[k] = v === undefined ? true : v;
    }
  }
  return opts;
}

function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' });
  } catch (err) {
    console.error('Command failed:', cmd);
    throw err;
  }
}

async function fetchGithubCommits({ repo, since, until, out }) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is required for GitHub API mode');
  }
  if (!repo) {
    throw new Error('--repo owner/repo is required for GitHub API mode');
  }
  const headers = { Authorization: `token ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' };
  const perPage = 100;
  let url = `https://api.github.com/repos/${repo}/commits?per_page=${perPage}`;
  if (since) url += `&since=${encodeURIComponent(since)}`;
  if (until) url += `&until=${encodeURIComponent(until)}`;

  const allCommits = [];
  let next = url;
  while (next) {
    // eslint-disable-next-line no-undef
    const res = await fetch(next, { headers });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`GitHub API request failed: ${res.status} ${res.statusText} - ${txt}`);
    }
    const items = await res.json();
    for (const item of items) {
      const sha = item.sha;
      // fetch commit details
      const detailsRes = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}`, { headers });
      const details = await detailsRes.json();
      // try to fetch PRs associated with this commit
      const pullsRes = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}/pulls`, {
        headers: { ...headers, Accept: 'application/vnd.github.groot-preview+json' },
      });
      const pulls = pullsRes.ok ? await pullsRes.json() : [];

      allCommits.push({
        sha,
        author: details.author ? { login: details.author.login, id: details.author.id } : null,
        commitAuthor: details.commit.author,
        commitMessage: details.commit.message,
        stats: details.stats || null,
        files: (details.files || []).map(f => ({ filename: f.filename, additions: f.additions, deletions: f.deletions })),
        pulls: (pulls || []).map(p => ({ number: p.number, url: p.html_url, title: p.title, user: p.user?.login })),
        html_url: details.html_url,
      });
    }
    // Pagination: look for Link header
    const link = res.headers.get('link');
    if (link) {
      const match = link.match(/<([^>]+)>; rel="next"/);
      next = match ? match[1] : null;
    } else {
      next = null;
    }
  }

  const outData = {
    meta: { source: 'github', repo, fetchedAt: new Date().toISOString(), count: allCommits.length },
    commits: allCommits,
  };
  fs.writeFileSync(out, JSON.stringify(outData, null, 2), 'utf8');
  console.log(`Wrote ${allCommits.length} commits to ${out}`);
}

function fetchLocalCommits({ since, until, out }) {
  // We use a delimiter format to reliably split commits
  const sinceArg = since ? ` --since="${since}"` : '';
  const untilArg = until ? ` --until="${until}"` : '';
  // Exclude merge commits by default to focus on authored messages
  const cmd = `git log --no-merges --pretty=format:%H%x1f%an%x1f%ae%x1f%ad%x1f%s%x1f%b%x1e${sinceArg}${untilArg}`;
  const raw = safeExec(cmd);
  const blocks = raw.split('\x1e').filter(Boolean);
  const commits = blocks.map(block => {
    const [sha, authorName, authorEmail, date, title, body] = block.split('\x1f');
    const message = title + (body ? '\n\n' + body : '');
    const prMatches = Array.from((message.matchAll(/#(\d+)/g) || [])).map(m => Number(m[1]));
    return { sha, author: { name: authorName, email: authorEmail }, date, title, body, message, prRefs: Array.from(new Set(prMatches)) };
  });

  // summary
  const byAuthor = {};
  for (const c of commits) {
    const n = c.author.name || 'unknown';
    byAuthor[n] = (byAuthor[n] || 0) + 1;
  }
  const summary = { total: commits.length, byAuthor, first: commits[commits.length - 1]?.date, last: commits[0]?.date };

  const outData = { meta: { source: 'local', fetchedAt: new Date().toISOString() }, summary, commits };
  fs.writeFileSync(out, JSON.stringify(outData, null, 2), 'utf8');
  console.log(`Wrote ${commits.length} commits to ${out}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const source = opts.source || 'local';
  const out = opts.out || 'commit-history.json';
  const since = opts.since;
  const until = opts.until;

  if (source === 'local') {
    fetchLocalCommits({ since, until, out });
  } else if (source === 'github') {
    const repo = opts.repo || (process.env.GITHUB_REPOSITORY ?? null);
    await fetchGithubCommits({ repo, since, until, out });
  } else {
    console.error('Unknown source. Use --source=local or --source=github');
    process.exit(2);
  }
}

main().catch(err => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
