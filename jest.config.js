/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // @scure/btc-signer, @noble/curves and micro-packed ship pure ESM with no CJS build,
  // which Jest's CJS runtime cannot parse untransformed — any suite importing StacksSDK
  // (the whole e2e suite) died with "Cannot use import statement outside a module" and
  // ran 0 tests. Transform exactly those packages through ts-jest (allowJs covers their
  // plain-JS sources) and leave the rest of node_modules untransformed.
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", { tsconfig: { allowJs: true } }],
  },
  // @noble/hashes and @scure/base are CJS at the top level but ship ESM copies NESTED
  // under other packages (@noble/curves, @stacks/bitcoin-staking), so the exception must
  // match at any depth — hence the `.*` form rather than anchoring on the first
  // node_modules segment.
  transformIgnorePatterns: [
    "/node_modules/(?!.*(@scure/btc-signer|@scure/base|@noble/curves|@noble/hashes|micro-packed)/)",
  ],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/server.ts"],
  coverageDirectory: "coverage",
  verbose: true,
};
