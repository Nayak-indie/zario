#!/usr/bin/env node

/**
 * Bundle Size Smoke Test - Issue #72
 * Compares bundle sizes of zario vs zario/logger entrypoints
 * Run: npm run bundle:size
 */

const { readFileSync, unlinkSync, existsSync, mkdirSync } = require('fs');
const { join, dirname } = require('path');
const esbuild = require('esbuild');

const rootDir = join(__dirname, '..');

const FIXTURE_FULL = join(rootDir, 'fixtures', 'full-import.ts');
const FIXTURE_SLIM = join(rootDir, 'fixtures', 'slim-import.ts');
const OUTPUT_FULL = join(rootDir, 'dist', 'full-bundle.js');
const OUTPUT_SLIM = join(rootDir, 'dist', 'slim-bundle.js');

const colors = { reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', cyan: '\x1b[36m' };
const log = (msg, c = colors.reset) => console.log(`${c}${msg}${colors.reset}`);

function getBundleSize(filePath) {
  if (!existsSync(filePath)) throw new Error(`Bundle not found: ${filePath}`);
  return readFileSync(filePath).length;
}

async function bundleFixture(fixturePath, outputPath) {
  log(`Bundling ${fixturePath}...`);
  await esbuild.build({
    entryPoints: [fixturePath],
    bundle: true,
    outfile: outputPath,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    minify: true,
    external: []
  });
}

async function main() {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log('Bundle Size Smoke Test - Issue #72', colors.cyan);
  log('='.repeat(60), colors.cyan);
  
  if (!existsSync(join(rootDir, 'dist'))) mkdirSync(join(rootDir, 'dist'));
  
  await bundleFixture(FIXTURE_FULL, OUTPUT_FULL);
  const fullSize = getBundleSize(OUTPUT_FULL);
  log(`Full (zario) bundle: ${(fullSize / 1024).toFixed(2)} KB`, colors.green);
  
  await bundleFixture(FIXTURE_SLIM, OUTPUT_SLIM);
  const slimSize = getBundleSize(OUTPUT_SLIM);
  log(`Slim (zario/logger) bundle: ${(slimSize / 1024).toFixed(2)} KB`, colors.green);
  
  const savings = fullSize - slimSize;
  const savingsPercent = ((savings / fullSize) * 100).toFixed(1);
  
  log(`\nFull entrypoint:   ${fullSize.toLocaleString()} bytes (${(fullSize / 1024).toFixed(2)} KB)`);
  log(`Slim entrypoint:   ${slimSize.toLocaleString()} bytes (${(slimSize / 1024).toFixed(2)} KB)`);
  log(`Size reduction:    ${savings.toLocaleString()} bytes (${savingsPercent}%)\n`);
  
  if (slimSize < fullSize) {
    log(`✅ PASS: Slim entrypoint is ${savingsPercent}% smaller!\n`, colors.green);
    unlinkSync(OUTPUT_FULL); unlinkSync(OUTPUT_SLIM);
    process.exit(0);
  } else {
    log(`❌ FAIL: Slim entrypoint is NOT smaller!\n`, colors.red);
    unlinkSync(OUTPUT_FULL); unlinkSync(OUTPUT_SLIM);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
