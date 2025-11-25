# Playwright Browser Installation Fix - Root Cause Analysis

## Problem Identified
GitHub Actions CI was failing with **all 147 tests failing** consistently at ~5m12s.

### Root Cause
**Playwright browsers were not installed before the build step that runs tests.**

## Technical Details

### Build Script Execution Order (package.json)
```json
"prebuild": "npm run lint && npm run type-check",
"build": "node build.js",
"postbuild": "npm run test:all",
```

When `npm run build` is executed:
1. **prebuild** runs: ESLint + TypeScript type checking
2. **build** runs: `node build.js` (builds the site)
3. **postbuild** runs: `npm run test:all` → which calls `npm run test:e2e`

**This means tests execute during the build, not after.**

### Original CI Workflow Problem (ci.yml)
The workflow had:
1. Step: `Install dependencies` (npm ci)
2. Step: `Lint (JS & CSS)`
3. Step: `Type check`
4. Step: `Build` (includes tests via postbuild) ❌ **Playwright NOT available yet**
5. Step: `Install Playwright browsers` ❌ **Too late!**
6. Step: `Run E2E tests` (redundant)

### Error from Logs
```
Error: browserType.launch: Executable doesn't exist at 
/home/runner/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell

Looks like Playwright Test or Playwright was just installed or updated.
Please run the following command to download new browsers:
    npx playwright install
```

All 147 tests failed with this error across chromium, mobile-chrome, and tablet variants.

## Solution Applied

### Fixed Workflow Order
1. `Install dependencies` (npm ci)
2. **`Install Playwright browsers` (npx playwright install --with-deps)** ← Moved here
3. `Lint (JS & CSS)`
4. `Type check`
5. `Build` (includes tests via postbuild) ✅ **Playwright now available**
6. Removed duplicate: `Install Playwright browsers` step

### Commit Details
- **Hash**: b3b14a7
- **Message**: "fix: Move Playwright browser installation before build step in CI workflow"
- **File modified**: `.github/workflows/ci.yml`
- **Changes**: 3 insertions(+), 3 deletions(-)

### Why This Fixes It
- Playwright browsers are installed **BEFORE** the build step
- When `npm run build` → `postbuild` → `test:all` (test:e2e) runs, browsers are already available
- All 147 tests can now launch the browser successfully
- Estimated build time: 4-5 minutes (matching local build time)

## Expected Results
✅ All 147 tests should now pass in GitHub Actions CI
✅ CI workflow should complete in ~5 minutes
✅ No "Executable doesn't exist" errors
✅ Deploy workflows (staging/production) can proceed

## Verification Status
- **Local build**: 147/147 tests passing ✓
- **GitHub Actions**: Run #19656679248 in progress (commit b3b14a7)
- **Expected completion**: Within 5 minutes of push

## Additional Context
- No other CI configuration issues identified
- ESLint linting already fixed (commit 7cd91ef)
- Playwright config properly sets up retries and workers for CI
- The "more tests in CI" mystery solved: Tests run during build, not after
