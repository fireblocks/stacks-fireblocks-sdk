import { build } from 'esbuild';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { dependencies } = require('./package.json');

// @scure/btc-signer and @scure/base are ESM-only from 2.x, and @stacks/bitcoin-staking
// is published as CommonJS that `require()`s them — a combination no CJS loader can
// resolve. Bundling those three into the CJS output is what makes dist/ require()-able
// from a CommonJS consumer (e.g. an Electron main process before Electron 28).
const BUNDLED = new Set([
  '@stacks/bitcoin-staking',
  '@scure/btc-signer',
  '@scure/base',
]);

// Everything else stays a runtime require so consumers dedupe/patch it normally.
const external = Object.keys(dependencies).filter(dep => !BUNDLED.has(dep));

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  external,
  logLevel: 'info',
});
