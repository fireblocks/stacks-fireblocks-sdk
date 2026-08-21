import { build } from 'esbuild';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { dependencies } = require('./package.json');

// @scure/btc-signer and @scure/base are ESM-only from 2.x, and @stacks/bitcoin-staking
// is published as CommonJS that `require()`s them — a combination no CJS loader can
// resolve. Bundling those into the CJS output is what makes dist/ require()-able
// from a CommonJS consumer (e.g. an Electron main process before Electron 28).
//
// @stacks/common is bundled too so the nested copy @stacks/bitcoin-staking depends on
// (7.4.1-pr, with a correct hexToBigInt) is inlined at its fetchAccountStatus call site.
// Left external, that call resolves to the consumer's hoisted @stacks/common@7.5.0, whose
// hexToBigInt double-prefixes '0x' and throws on the /v2/accounts body used by the
// pre-funding liquidity check (FBS-158/FBS-62).
const BUNDLED = new Set([
  '@stacks/bitcoin-staking',
  '@stacks/common',
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
