#!/usr/bin/env node

/**
 * Bundle Size Smoke Test
 * Compares bundle sizes of zario (full) vs zario/logger (slim) entrypoints
 * 
 * Run: node scripts/bundle-size.js
 * Or with Bun: bun run scripts/bundle-size.ts
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const FIXTURE_FULL = join(rootDir, 'fixtures', 'full-import.ts');
const FIXTURE_SLIM = join(rootDir, 'fixtures', 'slim-import.ts');
const OUTPUT_FULL = join(rootDir, 'dist', 'full-bundle.js');
const OUTPUT_SLIM = join(rootDir, 'dist', 'slim-bundle.js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function logSection(msg) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`${msg}`, colors.cyan);
  log('='.repeat(60), colors.cyan);
}

function getBundleSize(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Bundle not found: ${filePath}`);
  }
  const stats = readFileSync(filePath);
  return stats.length;
}

function bundleFixture(fixturePath, outputPath, entryPoint) {
  log(`Bundling ${fixturePath}...`);
  
  // Create a temporary config for esbuild
  const config = {
    entryPoints: [fixturePath],
    bundle: true,
    outfile: outputPath,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    minify: true,
    sourcemap: false,
    metafile: false,
  };
  
  // Write config to temp file
  const configPath = join(rootDir, 'esbuild.bundle-config.mjs');
  writeFileSync(configPath, `
import * as esbuild from 'esbuild';
const config = ${JSON.stringify(config, null, 2)};
await esbuild.build(config);
console.log('Done');
  `);
  
  try {
    execSync(`node ${configPath}`, { cwd: rootDir, stdio: 'pipe' });
  } finally {
    // Cleanup
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  }
  
  if (!existsSync(outputPath)) {
    throw new Error(`Failed to create bundle: ${outputPath}`);
  }
}

function main() {
  logSection('Bundle Size Smoke Test');
  
  log('\nThis test compares bundle sizes of:', colors.bold);
  log('  • zario (full entrypoint - includes all transports/filters)');
  log('  • zario/logger (slim entrypoint - minimal Logger only)\n');
  
  // Ensure dist directory exists
  if (!existsSync(join(rootDir, 'dist'))) {
    mkdirSync(join(rootDir, 'dist'));
  }
  
  try {
    // Bundle both fixtures
    logSection('Bundling Fixtures');
    
    bundleFixture(FIXTURE_FULL, OUTPUT_FULL, 'full');
    const fullSize = getBundleSize(OUTPUT_FULL);
    log(`Full (zario) bundle: ${(fullSize / 1024).toFixed(2)} KB`, colors.green);
    
    bundleFixture(FIXTURE_SLIM, OUTPUT_SLIM, 'slim');
    const slimSize = getBundleSize(OUTPUT_SLIM);
    log(`Slim (zario/logger) bundle: ${(slimSize / 1024).toFixed(2)} KB`, colors.green);
    
    // Calculate savings
    const savings = fullSize - slimSize;
    const savingsPercent = ((savings / fullSize) * 100).toFixed(1);
    
    logSection('Results');
    
    log(`Full entrypoint:   ${fullSize.toLocaleString()} bytes (${(fullSize / 1024).toFixed(2)} KB)`);
    log(`Slim entrypoint:   ${slimSize.toLocaleString()} bytes (${(slimSize / 1024).toFixed(2)} KB)`);
    log(`Size reduction:    ${savings.toLocaleString()} bytes (${savingsPercent}%)`);
    
    // Check if slim is actually smaller
    if (slimSize < fullSize) {
      log(`\n✅ PASS: Slim entrypoint is ${savingsPercent}% smaller!`, colors.green);
      log('   The zario/logger entrypoint provides meaningful bundle savings.\n');
      
      // Cleanup
      unlinkSync(OUTPUT_FULL);
      unlinkSync(OUTPUT_SLIM);
      
      process.exit(0);
    } else {
      log(`\n❌ FAIL: Slim entrypoint is NOT smaller than full!`, colors.red);
      log('   The zario/logger entrypoint may not be providing benefits.\n');
      
      // Still cleanup
      unlinkSync(OUTPUT_FULL);
      unlinkSync(OUTPUT_SLIM);
      
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`, colors.red);
    log(error.stack, colors.yellow);
    process.exit(1);
  }
}

main();
