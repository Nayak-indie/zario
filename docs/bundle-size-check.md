# Bundle Size Smoke Check - Issue #72

## Overview

This document describes the bundle size smoke test for comparing the full `zario` entrypoint against the slim `zario/logger` entrypoint.

## Problem

The new `zario/logger` entrypoint is intended for smaller bundles. We need an automated check to verify this claim.

## Solution

We created:

1. **Fixture files** - Minimal test files for bundling
2. **Bundle size script** - Automated comparison tool
3. **CI integration** - Exit codes for automation

## Files Created

```
fixtures/
├── full-import.ts   # Full zario import
└── slim-import.ts    # Slim zario/logger import

scripts/
└── bundle-size.js    # Bundle comparison script
```

## Usage

### Run locally:

```bash
npm run bundle:size
# or
node scripts/bundle-size.js
```

### Expected output:

```
============================================================
Bundle Size Smoke Test
============================================================

This test compares bundle sizes of:
  • zario (full entrypoint - includes all transports/filters)
  • zario/logger (slim entrypoint - minimal Logger only)

============================================================
Bundling Fixtures
============================================================
Bundling fixtures/full-import.ts...
Full (zario) bundle: 17.94 KB
Bundling fixtures/slim-import.ts...
Slim (zario/logger) bundle: 12.67 KB

============================================================
Results
============================================================
Full entrypoint:   18,371 bytes (17.94 KB)
Slim entrypoint:   12,974 bytes (12.67 KB)
Size reduction:    5,397 bytes (29.4%)

✅ PASS: Slim entrypoint is 29.4% smaller!
   The zario/logger entrypoint provides meaningful bundle savings.
```

### Exit codes:

- `0` - Test passed (slim is smaller)
- `1` - Test failed (slim is NOT smaller)

## How It Works

1. **Bundles fixtures** using esbuild with identical settings
2. **Compares sizes** of the minified bundles
3. **Validates** that slim is smaller than full
4. **Reports** percentage savings

## CI Integration

Add to your CI pipeline:

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check

on: [pull_request, push]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: npm install
      - run: npm run bundle:size
```

## Results

| Entry Point | Size | Reduction |
|-------------|------|-----------|
| `zario` (full) | 17.94 KB | - |
| `zario/logger` (slim) | 12.67 KB | **29.4%** |

The slim entrypoint is **~30% smaller**!

## Interpretation

- **>0% savings**: Slim entrypoint provides bundle improvement
- **0%**: No difference (may need investigation)
- **<0%**: Regression detected (test will fail)

---

For questions, see [Issue #72](https://github.com/Dev-Dami/zario/issues/72)
