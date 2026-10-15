// Mock the SDK module so the pool test never loads the heavy (ESM-only) chain
// dependencies — this is a unit test of SdkManager's acquisition logic only.
jest.mock("../StacksSDK", () => ({
  StacksSDK: { create: jest.fn() },
}));

import { SdkManager } from "../pool/SdkManager";
import { StacksSDK } from "../StacksSDK";
import { FireblocksConfig } from "../services/types";

const createMock = StacksSDK.create as unknown as jest.Mock;
const baseConfig: FireblocksConfig = { apiKey: "k", apiSecret: "s", testnet: true };

describe("SdkManager atomic instance acquisition (FBS-11)", () => {
  beforeEach(() => createMock.mockReset());

  it("builds exactly one instance under concurrent cold acquisition", async () => {
    let constructions = 0;
    createMock.mockImplementation(async () => {
      constructions++;
      // Simulate async construction latency so the concurrent calls overlap.
      await new Promise((r) => setTimeout(r, 10));
      return { tag: "sdk" };
    });

    const mgr = new SdkManager(baseConfig);
    try {
      const results = await Promise.all([
        mgr.getSdk("7"),
        mgr.getSdk("7"),
        mgr.getSdk("7"),
      ]);

      expect(constructions).toBe(1);
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
      expect(mgr.getMetrics().totalInstances).toBe(1);
    } finally {
      await mgr.shutdown();
    }
  });

  it("does not evict an instance a concurrent caller still holds", async () => {
    createMock.mockImplementation(async () => ({ tag: "sdk" }));
    const mgr = new SdkManager(baseConfig, { maxPoolSize: 1 });
    try {
      // Two concurrent holders of vault 7 (refCount 2 → one active instance).
      await mgr.getSdk("7");
      await mgr.getSdk("7");
      expect(mgr.getMetrics().activeInstances).toBe(1);

      // One releases; the instance is still held, so at capacity a different vault
      // cannot displace it — it must NOT be evicted while in use.
      mgr.releaseSdk("7");
      await expect(mgr.getSdk("8")).rejects.toThrow(/maximum capacity/i);
      expect(mgr.getMetrics().activeInstances).toBe(1);

      // The final release makes it idle and therefore evictable.
      mgr.releaseSdk("7");
      expect(mgr.getMetrics().idleInstances).toBe(1);
      const sdk8 = await mgr.getSdk("8");
      expect(sdk8).toBeDefined();
    } finally {
      await mgr.shutdown();
    }
  });

  it("clears the in-flight marker on failure so a retry can succeed", async () => {
    let attempt = 0;
    createMock.mockImplementation(async () => {
      attempt++;
      if (attempt === 1) throw new Error("boom");
      return { tag: "sdk" };
    });

    const mgr = new SdkManager(baseConfig);
    try {
      await expect(mgr.getSdk("7")).rejects.toThrow();
      const sdk = await mgr.getSdk("7");
      expect(sdk).toBeDefined();
      expect(attempt).toBe(2);
      expect(mgr.getMetrics().totalInstances).toBe(1);
    } finally {
      await mgr.shutdown();
    }
  });
});
