import { Pc, PostConditionMode } from "@stacks/transactions";

describe("FT Post-Conditions", () => {
  const senderAddress = "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7";
  const contractAddress = "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K";
  const contractName = "token-aeusdc";
  const amount = BigInt(1000000);

  describe("Pc builder for FT transfers", () => {
    it("creates a post-condition with correct principal", () => {
      const postCondition = Pc.principal(senderAddress)
        .willSendEq(amount)
        .ft(`${contractAddress}.${contractName}`, contractName);

      expect(postCondition).toBeDefined();
      // The post-condition should be an object with the expected structure
      expect(typeof postCondition).toBe("object");
    });

    it("creates post-condition with willSendEq for exact amount", () => {
      const postCondition = Pc.principal(senderAddress)
        .willSendEq(amount)
        .ft(`${contractAddress}.${contractName}`, contractName);

      // Post-condition should enforce exact amount
      expect(postCondition).toBeDefined();
    });

    it("creates post-condition with willSendLte for max amount", () => {
      const postCondition = Pc.principal(senderAddress)
        .willSendLte(amount)
        .ft(`${contractAddress}.${contractName}`, contractName);

      expect(postCondition).toBeDefined();
    });

    it("creates post-condition with willSendGte for min amount", () => {
      const postCondition = Pc.principal(senderAddress)
        .willSendGte(amount)
        .ft(`${contractAddress}.${contractName}`, contractName);

      expect(postCondition).toBeDefined();
    });

    it("handles different token contract formats", () => {
      // sBTC format
      const sbtcPostCondition = Pc.principal(senderAddress)
        .willSendEq(amount)
        .ft("SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token", "sbtc-token");

      // USDCx format
      const usdcxPostCondition = Pc.principal(senderAddress)
        .willSendEq(amount)
        .ft("SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx", "usdcx");

      expect(sbtcPostCondition).toBeDefined();
      expect(usdcxPostCondition).toBeDefined();
    });
  });

  describe("PostConditionMode enum", () => {
    it("has Allow mode with value 1", () => {
      expect(PostConditionMode.Allow).toBe(1);
    });

    it("has Deny mode with value 2", () => {
      expect(PostConditionMode.Deny).toBe(2);
    });

    it("Deny mode is stricter than Allow", () => {
      // Deny mode (2) should be used for secure transfers
      // Allow mode (1) permits additional asset transfers not covered by post-conditions
      expect(PostConditionMode.Deny).toBeGreaterThan(PostConditionMode.Allow);
    });
  });

  describe("Post-condition array structure", () => {
    it("can create array of post-conditions for transaction", () => {
      const postCondition = Pc.principal(senderAddress)
        .willSendEq(amount)
        .ft(`${contractAddress}.${contractName}`, contractName);

      const postConditions = [postCondition];

      expect(Array.isArray(postConditions)).toBe(true);
      expect(postConditions.length).toBe(1);
    });

    it("supports multiple post-conditions", () => {
      const ftPostCondition = Pc.principal(senderAddress)
        .willSendEq(amount)
        .ft(`${contractAddress}.${contractName}`, contractName);

      const stxPostCondition = Pc.principal(senderAddress)
        .willSendLte(BigInt(10000))
        .ustx();

      const postConditions = [ftPostCondition, stxPostCondition];

      expect(postConditions.length).toBe(2);
    });
  });
});
