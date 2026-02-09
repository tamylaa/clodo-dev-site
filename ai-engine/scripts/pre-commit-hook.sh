#!/bin/sh
# ═══════════════════════════════════════════════════════════════
# Pre-commit hook: Block accidental secret/credential commits
# 
# Install:
#   cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
# ═══════════════════════════════════════════════════════════════

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔒 Checking for secrets in staged files..."

BLOCKED=0

# ── Pattern 1: Known secret file names ────────────────────────
BLOCKED_FILES=".dev.vars .env .env.local .env.production"
for blocked in $BLOCKED_FILES; do
  if git diff --cached --name-only | grep -vE '^\.git/' | grep -qE "(^|/)${blocked}$"; then
    echo "${RED}✘ BLOCKED: ${blocked} is staged for commit!${NC}"
    BLOCKED=1
  fi
done

# ── Pattern 2: Secret file extensions ─────────────────────────
if git diff --cached --name-only | grep -vE '^\.git/' | grep -qE '\.(secret|key|pem|p12|pfx)$'; then
  echo "${RED}✘ BLOCKED: Secret file detected in staged changes!${NC}"
  git diff --cached --name-only | grep -vE '^\.git/' | grep -E '\.(secret|key|pem|p12|pfx)$'
  BLOCKED=1
fi

# ── Pattern 3: Google/service account credentials ─────────────
if git diff --cached --name-only | grep -vE '^\.git/' | grep -qiE 'client_secret|service_account|credentials.*\.json'; then
  echo "${RED}✘ BLOCKED: Credential JSON file detected!${NC}"
  git diff --cached --name-only | grep -vE '^\.git/' | grep -iE 'client_secret|service_account|credentials.*\.json'
  BLOCKED=1
fi

# ── Pattern 4: API keys in file content ───────────────────────
# Check staged content for common API key patterns (exclude .git files)
STAGED_FILES=$(git diff --cached --name-only | grep -vE '^\.git/' || true)
STAGED_CONTENT=$(git diff --cached -U0 -- $STAGED_FILES | grep '^+' | grep -v '^+++' || true)

if echo "$STAGED_CONTENT" | grep -qE 'sk-ant-api[a-zA-Z0-9_-]{20,}'; then
  echo "${RED}✘ BLOCKED: Anthropic API key found in staged content!${NC}"
  BLOCKED=1
fi

if echo "$STAGED_CONTENT" | grep -qE 'sk-proj-[a-zA-Z0-9_-]{20,}'; then
  echo "${RED}✘ BLOCKED: OpenAI API key found in staged content!${NC}"
  BLOCKED=1
fi

if echo "$STAGED_CONTENT" | grep -qE 'AIza[a-zA-Z0-9_-]{30,}'; then
  echo "${RED}✘ BLOCKED: Google API key found in staged content!${NC}"
  BLOCKED=1
fi

# ── Result ────────────────────────────────────────────────────
if [ $BLOCKED -ne 0 ]; then
  echo ""
  echo "${RED}╔═══════════════════════════════════════════════════╗${NC}"
  echo "${RED}║  COMMIT BLOCKED — Secrets detected!              ║${NC}"
  echo "${RED}║  Remove secrets from staged files before commit. ║${NC}"
  echo "${RED}║  Use: git reset HEAD <file> to unstage           ║${NC}"
  echo "${RED}╚═══════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 1
fi

echo "✔ No secrets detected — commit allowed."
exit 0
