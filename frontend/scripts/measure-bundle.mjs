import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';

const targetFile = path.resolve('src/lib/optimistic/useOptimisticMutation.ts');
console.log('Measuring bundle size of:', targetFile);

// Bundle with esbuild targeting browser ES2022, minified, with react external
const esbuildCmd = 'npx esbuild src/lib/optimistic/useOptimisticMutation.ts --bundle --minify --format=esm --external:react --external:react-dom --outfile=dist-optimistic.js';
execSync(esbuildCmd, { stdio: 'inherit' });

const code = fs.readFileSync('dist-optimistic.js', 'utf8');
const uncompressedBytes = Buffer.byteLength(code, 'utf8');
const gzipped = zlib.gzipSync(code);
const gzippedBytes = gzipped.length;
const brotli = zlib.brotliCompressSync(code);
const brotliBytes = brotli.length;

fs.unlinkSync('dist-optimistic.js');

console.log('=== USEOPTIMISTICMUTATION BUNDLE IMPACT ===');
console.log(`Raw minified JS: ${uncompressedBytes} bytes (${(uncompressedBytes / 1024).toFixed(2)} KB)`);
console.log(`Gzip compressed: ${gzippedBytes} bytes (${(gzippedBytes / 1024).toFixed(2)} KB)`);
console.log(`Brotli compressed: ${brotliBytes} bytes (${(brotliBytes / 1024).toFixed(2)} KB)`);
console.log('Method: esbuild v0.25 production ESM bundle with --minify, React externalized, measured via node:zlib gzip/brotli.');

