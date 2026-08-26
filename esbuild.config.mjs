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
//
// @noble/hashes and @noble/curves must be bundled WITH @scure/btc-signer. btc-signer 2.2.0
// requires @noble/hashes ~2.2.0 (npm nests that copy under it), but this package declares
// @noble/hashes 1.8.0 at the top level. Left external, the inlined btc-signer and
// @noble/curves 2.x resolve `require('@noble/hashes/...')` to the CONSUMER's hoisted 1.8.0
// at runtime, mixing two incompatible majors: every pubkey operation then fails
// ("P2WPKH: invalid publicKey"), so getBtcVaultAddress throws and, because
// resolveRecoveryDestination calls it first, BOTH BTC recovery paths
// (spendEarlyExitUtxo / unlockMaturedBond) are unusable from the bundle.
// (@noble/curves is not a declared dependency, so it is already inlined today; listing it
// keeps that intentional and correct if it is ever added to package.json.)
const BUNDLED = new Set([
  '@stacks/bitcoin-staking',
  '@stacks/common',
  '@scure/btc-signer',
  '@scure/base',
  '@noble/hashes',
  '@noble/curves',
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
