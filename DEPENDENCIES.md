# Dependency & Audit Disposition (FBS-58 / FBS-62)

This document records the exact dependency versions the SDK builds against and the
disposition of every current `npm audit` finding. Update it whenever a dependency version
in `package.json` changes.

## Reproducibility model — no committed lockfile (intentional)

This repository intentionally does **not** commit `package-lock.json`. Reproducibility is
instead guaranteed by **exact version pins** in `package.json`: every entry under
`dependencies` and `devDependencies` is an exact version (no `^`, `~`, `*`, or `latest`).
A clean `npm install` therefore resolves the same direct dependency set on every checkout.

> Note: exact pins fix the *direct* dependency versions. Transitive versions are resolved
> by npm at install time. Consumers who require a byte-identical transitive graph should
> vendor or use their own lockfile downstream; the SDK pins everything it declares.

## Pinned runtime dependencies

Cryptography and Stacks-protocol packages are pinned exactly and must only be changed with
review (they determine signing and transaction encoding):

| Package | Version | Notes |
|---|---|---|
| `@fireblocks/ts-sdk` | `10.4.0` | Raw signing. |
| `@noble/hashes` | `1.8.0` | Hashing. |
| `@noble/secp256k1` | `1.7.1` | ECDSA. |
| `@scure/bip32` | `1.3.3` | HD key derivation (cosigner key match). |
| `@scure/btc-signer` | `2.2.0` | Bitcoin transaction building/signing. |
| `@stacks/bitcoin-staking` | `7.4.1-pr.1854.5` | **Pre-release PR build** — see below. |
| `@stacks/common` | `7.5.0` | Fixed version selected for FBS-58 (parser workaround no longer required for correctness at this version). |
| `@stacks/network` | `7.5.0` | |
| `@stacks/stacking` | `7.3.1` | |
| `@stacks/transactions` | `7.5.0` | |

### `@stacks/bitcoin-staking` — pre-release pin

`7.4.1-pr.1854.5` is a pre-release PR build, not a stable release tag. A pre-release
version string is resolved exactly by npm (it is never auto-upgraded), so it is immutable
for install purposes. **Disposition:** pinned exactly; replace with the stable release tag
once the upstream PoX-5 staking PR is published. Owner: SDK maintainers. Tracked so a
release is not cut on a moving target.

## Release tagging

Tag the SDK commit used for each release (`git tag vX.Y.Z <commit>`) and record the tag in
the release artifact alongside the tested node and PoX-5 contract commit (see FBS-32). The
`version` field in `package.json` (`1.1.0`) is the human-facing release marker.

## `npm audit` disposition

Snapshot taken 2026-08-17: 16 advisories (1 critical, 7 high, 6 moderate, 2 low). The
overwhelming majority are transitive through **dev-only** tooling (documentation and test
build) and are not shipped in the SDK's runtime path.

| Advisory | Package | Path | Runtime? | Disposition |
|---|---|---|---|---|
| Handlebars AST injection | `handlebars` (critical) | `typedoc` → | dev only | Accepted — docs generation, not shipped. Remove on `typedoc` upgrade. |
| JS-YAML DoS | `js-yaml` (high) | `typedoc` → | dev only | Accepted — dev only. |
| yaml stack overflow | `yaml` (moderate) | `typedoc` → | dev only | Accepted — dev only. |
| markdown-it / linkify-it DoS | `markdown-it`, `linkify-it` | `typedoc` → | dev only | Accepted — dev only. |
| Babel source-map file read | `@babel/core` (low) | test/build → | dev only | Accepted — dev only. |
| picomatch glob injection | `picomatch` (high) | `jest`/build → | dev only | Accepted — dev only. |
| brace-expansion DoS | `brace-expansion` (high) | build → | dev only | Accepted — dev only. |
| Axios SSRF (NO_PROXY bypass) | `axios` (high) | direct + `@fireblocks/ts-sdk` | runtime | Mitigated — SDK calls only fixed, operator-configured Hiro/Esplora/Fireblocks hosts; no user-controlled URLs or proxy config. Re-evaluate on a patched `axios`. |
| form-data CRLF | `form-data` (high) | `axios`/`supertest` → | runtime (transitive) | Mitigated — no untrusted multipart field names are constructed by the SDK. |
| follow-redirects header leak | `follow-redirects` (moderate) | `axios` → | runtime (transitive) | Mitigated — requests target fixed hosts; no cross-domain redirect to attacker origins expected. |
| path-to-regexp / body-parser / qs DoS | express stack | runtime (REST server) | REST server only | Accepted for the library; the optional REST server sits behind the FBS-07 auth guard and operator ingress. Patch on `express` upgrade. |
| uuid bounds check | `uuid` (moderate) | `@fireblocks/ts-sdk` → | runtime (transitive) | Accepted — SDK does not call the affected v3/v5/v6 buffer path. |

`npm audit fix` is intentionally **not** run automatically: it would move transitive
versions away from the reviewed graph and can break the exact-pin model. Apply fixes
deliberately by bumping the relevant direct dependency's exact pin and re-testing.
