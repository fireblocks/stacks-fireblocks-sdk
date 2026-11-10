/**
 * The emitted declarations carry the real signatures of the bond operations.
 *
 * Their implementations run inside a per-bond slot. A public wrapper typed through a private
 * member compiles in this repo, but the emitted declaration cannot name the private member,
 * and a consumer of the built package then sees the method with no usable types. Source-level
 * tests cannot see that, so this emits the declarations and reads them.
 */

import * as path from "path";
import * as ts from "typescript";

const ROOT = path.resolve(__dirname, "../..");

const emitDeclaration = (): string => {
  const configPath = path.join(ROOT, "tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ROOT);
  const program = ts.createProgram(
    [path.join(ROOT, "src/StacksSDK.ts")],
    { ...parsed.options, declaration: true, emitDeclarationOnly: true, noEmit: false, outDir: path.join(ROOT, ".declaration-check") },
  );
  let text = "";
  program.emit(undefined, (fileName, data) => {
    if (fileName.endsWith(`${path.sep}StacksSDK.d.ts`)) text = data;
  });
  return text;
};

describe("emitted declarations of the bond operations", () => {
  let declaration: string;

  beforeAll(() => {
    declaration = emitDeclaration();
  }, 120_000);

  it("were emitted", () => {
    expect(declaration).toContain("class StacksSDK");
  });

  it.each([
    ["createBond", /createBond: \(bondIndex: number, btcAmountSats: bigint, signerManager: string/, /Promise<CreateBondResult>;/],
    ["createSbtcBond", /createSbtcBond: \(bondIndex: number, sbtcSats: bigint, signerManager: string/, /Promise<CreateTransactionResponse>;/],
    ["rollSbtcBond", /rollSbtcBond: \(nextBondIndex: number, newSbtcSats: bigint, signerManager: string/, /Promise<CreateTransactionResponse>;/],
    ["renewBond", /renewBond: \(nextBondIndex: number, signerManager: string/, /Promise<RenewBondResult>;/],
  ])("%s keeps its parameter and return types", (name, params, returns) => {
    const start = declaration.search(new RegExp(`^\\s*${name}: `, "m"));
    const signature = declaration.slice(start);
    const returned = /=> (Promise<[A-Za-z]+>);/.exec(signature)?.[1];

    expect(start).toBeGreaterThanOrEqual(0);
    expect(signature).toMatch(params);
    expect(`${returned};`).toMatch(returns);
  });

  it("never types a public member through a private one", () => {
    expect(declaration).not.toMatch(/Parameters<StacksSDK\[/);
    expect(declaration).not.toMatch(/ReturnType<StacksSDK\[/);
  });
});
