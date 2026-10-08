import {
  Fireblocks,
  TransactionOperation,
  TransactionStateEnum,
} from "@fireblocks/ts-sdk";
import { FireblocksService } from "../services/fireblocks.service";
import {
  FireblocksSigner,
  FireblocksTransferError,
} from "../utils/FireblocksSigner";

/**
 * Human-approval waits are not machine-paced (issue 208).
 *
 * A single flat deadline was applied to every non-terminal status, so a transaction
 * parked in PENDING_AUTHORIZATION — waiting on a person under the customer's 1-of-5
 * approval rule — was reported as a failure once the clock ran out. The wait is not a
 * fault, and the resulting error was an untyped Error, so a caller could not tell
 * "nobody has approved yet" from "this genuinely stalled".
 */
describe("FireblocksSigner.getTxStatus — approval-pending deadlines", () => {
  /** Returns the given statuses in order, repeating the last one forever. */
  const signerFor = (statuses: string[], poll = {}) => {
    let call = 0;
    const fireblocks = {
      transactions: {
        getTransaction: async () => {
          const status = statuses[Math.min(call++, statuses.length - 1)];
          return {
            data: {
              id: "fb-tx-approval",
              status,
              operation: TransactionOperation.Transfer,
            },
          };
        },
      },
    } as unknown as Fireblocks;
    // Tiny delays keep the test deterministic; a zero budget expires on the first check.
    return new FireblocksSigner(fireblocks, {
      initialMs: 1,
      ceilingMs: 1,
      ...poll,
    });
  };

  it("does NOT extend the approval budget by default", () => {
    // FBS-19: the 30-minute POLL_TIMEOUT_MS also bounded how stale a preflight could be
    // before broadcast, and three lifecycle calls still re-validate nothing. Until that
    // is fixed, a longer default would let an approval straddle the prepare-phase
    // boundary and burn a fee and a nonce on a transaction the contract rejects.
    // Extending is therefore opt-in, per call site, not a default.
    const signer = signerFor([TransactionStateEnum.Completed]);
    const poll = (signer as unknown as { poll: Record<string, number> }).poll;

    expect(poll.approvalTimeoutMs).toBe(poll.timeoutMs);
  });

  it("keeps waiting on a human approval past the machine-paced deadline", async () => {
    const signer = signerFor(
      [
        TransactionStateEnum.PendingAuthorization,
        TransactionStateEnum.PendingAuthorization,
        TransactionStateEnum.Completed,
      ],
      { timeoutMs: 0, approvalTimeoutMs: 60_000 },
    );

    const tx = await signer.getTxStatus("fb-tx-approval");

    expect(tx.status).toBe(TransactionStateEnum.Completed);
  });

  it("applies the same extended budget to third-party manual approval", async () => {
    const signer = signerFor(
      [
        TransactionStateEnum.Pending3RdPartyManualApproval,
        TransactionStateEnum.Completed,
      ],
      { timeoutMs: 0, approvalTimeoutMs: 60_000 },
    );

    const tx = await signer.getTxStatus("fb-tx-approval");

    expect(tx.status).toBe(TransactionStateEnum.Completed);
  });

  it("still applies the machine-paced deadline to a machine-paced status", async () => {
    // PENDING_SIGNATURE is MPC signing, not a person — it must not get the long budget.
    const signer = signerFor([TransactionStateEnum.PendingSignature], {
      timeoutMs: 0,
      approvalTimeoutMs: 60_000,
    });

    await expect(signer.getTxStatus("fb-tx-approval")).rejects.toThrow(
      /timed out/i,
    );
  });

  it("bounds the approval wait rather than polling forever", async () => {
    const signer = signerFor([TransactionStateEnum.PendingAuthorization], {
      timeoutMs: 60_000,
      approvalTimeoutMs: 0,
    });

    await expect(signer.getTxStatus("fb-tx-approval")).rejects.toThrow(
      /timed out/i,
    );
  });

  it("throws a typed timeout carrying the status, and does not classify it terminal", async () => {
    const signer = signerFor([TransactionStateEnum.PendingAuthorization], {
      timeoutMs: 60_000,
      approvalTimeoutMs: 0,
    });

    const err = await signer.getTxStatus("fb-tx-approval").catch((e) => e);

    // 215 renders an approver signal from this; an untyped Error carries nothing.
    expect(err).toBeInstanceOf(FireblocksTransferError);
    expect(err.details.status).toBe(TransactionStateEnum.PendingAuthorization);
    expect(err.details.vendorId).toBe("fb-tx-approval");
    // A pending approval is not a terminal failure — the funding generation must not
    // advance on it, or a second BTC transfer becomes possible.
    expect(FireblocksService.isTerminalTransferFailure(err)).toBe(false);
  });

  it("carries the broadcast tx hash on a terminal failure", async () => {
    const fireblocks = {
      transactions: {
        getTransaction: async () => ({
          data: {
            id: "fb-tx-dropped",
            status: TransactionStateEnum.Failed,
            subStatus: "DROPPED_BY_BLOCKCHAIN",
            txHash: "ef".repeat(32),
            operation: TransactionOperation.Transfer,
          },
        }),
      },
    } as unknown as Fireblocks;
    const signer = new FireblocksSigner(fireblocks, { initialMs: 1, ceilingMs: 1 });

    const err = await signer.getTxStatus("fb-tx-dropped").catch((e) => e);

    expect(err).toBeInstanceOf(FireblocksTransferError);
    expect(err.details.txHash).toBe("ef".repeat(32));
  });

  describe("a failed status read during the poll (review item 8)", () => {
    /** First read reports a pending transfer; every later read fails with `err`. */
    const signerFailingWith = (err: unknown, then?: () => unknown) => {
      let call = 0;
      const getTransaction = jest.fn(async () => {
        call++;
        if (call === 1) {
          return { data: { id: "fb-tx-poll", status: TransactionStateEnum.PendingSignature, operation: TransactionOperation.Transfer } };
        }
        if (then && call > 2) return then();
        throw err;
      });
      const fireblocks = { transactions: { getTransaction } } as unknown as Fireblocks;
      // A short real budget: a swallowed auth error would otherwise poll until it.
      const signer = new FireblocksSigner(fireblocks, { initialMs: 1, ceilingMs: 1, timeoutMs: 300, approvalTimeoutMs: 300 });
      return { signer, getTransaction };
    };

    it.each([[401], [403]])("stops at once on HTTP %p — an auth failure does not fix itself", async (statusCode) => {
      const { signer, getTransaction } = signerFailingWith(
        Object.assign(new Error("unauthorized"), { response: { statusCode } }),
      );

      const err = await signer.getTxStatus("fb-tx-poll").catch((e) => e);

      expect(err.message).toMatch(new RegExp(String(statusCode)));
      expect(err.message).not.toMatch(/timed out/i);
      // The initial read plus the one that failed — no retries for the rest of the budget.
      expect(getTransaction).toHaveBeenCalledTimes(2);
    });

    it("still retries a transient error", async () => {
      const { signer } = signerFailingWith(
        Object.assign(new Error("bad gateway"), { response: { statusCode: 502 } }),
        () => ({ data: { id: "fb-tx-poll", status: TransactionStateEnum.Completed, operation: TransactionOperation.Transfer } }),
      );

      const tx = await signer.getTxStatus("fb-tx-poll");

      expect(tx.status).toBe(TransactionStateEnum.Completed);
    });
  });

  describe("budgets are independent, not measured from one shared clock", () => {
    afterEach(() => jest.restoreAllMocks());

    it("does not inherit elapsed approval time when transitioning to a machine-paced status", async () => {
      // 40 minutes in PendingAuthorization (within the 60-minute approval budget), then a
      // transition to PendingSignature (machine-paced, 30-minute budget). Sharing one
      // clock from the start means the 40 already-spent minutes immediately exceed the
      // 30-minute machine budget the instant machine processing begins.
      let mockedNow = Date.now();
      jest.spyOn(Date, "now").mockImplementation(() => mockedNow);

      let call = 0;
      const statuses = [
        TransactionStateEnum.PendingAuthorization,
        TransactionStateEnum.PendingSignature,
        TransactionStateEnum.Completed,
      ];
      const fireblocks = {
        transactions: {
          getTransaction: async () => {
            const index = Math.min(call, statuses.length - 1);
            // The 40 minutes elapse WHILE waiting on approval, surfacing only once the
            // status read reveals the transition to the machine-paced state.
            if (index === 1) mockedNow += 40 * 60_000;
            call++;
            return {
              data: {
                id: "fb-tx-transition",
                status: statuses[index],
                operation: TransactionOperation.Transfer,
              },
            };
          },
        },
      } as unknown as Fireblocks;

      const signer = new FireblocksSigner(fireblocks, {
        initialMs: 1,
        ceilingMs: 1,
        timeoutMs: 30 * 60_000,
        approvalTimeoutMs: 60 * 60_000,
      });

      const tx = await signer.getTxStatus("fb-tx-transition");

      expect(tx.status).toBe(TransactionStateEnum.Completed);
    });

    it("still times out eventually when the status keeps flapping between categories", async () => {
      // A per-category reset that resets on EVERY transition, with no absolute ceiling,
      // never fires if the status alternates category every poll: categoryStartedAt is
      // always ~now, so the elapsed check never sees enough elapsed time to trip. An
      // absolute ceiling across the whole wait is the backstop for that case.
      let mockedNow = Date.now();
      jest.spyOn(Date, "now").mockImplementation(() => mockedNow);

      // Bounded rather than truly infinite, so a MISSING fix fails this assertion fast
      // (the promise resolves once flapping ends) instead of hanging on Jest's own
      // watchdog. 200 flaps * 20 minutes vastly exceeds any reasonable combined budget,
      // so a working ceiling must trip well before the cap is reached.
      let call = 0;
      const MAX_FLAPS = 200;
      const fireblocks = {
        transactions: {
          getTransaction: async () => {
            mockedNow += 20 * 60_000;
            const flapIndex = call++;
            const status =
              flapIndex >= MAX_FLAPS
                ? TransactionStateEnum.Completed
                : flapIndex % 2 === 0
                  ? TransactionStateEnum.PendingAuthorization
                  : TransactionStateEnum.PendingSignature;
            return {
              data: {
                id: "fb-tx-flap",
                status,
                operation: TransactionOperation.Transfer,
              },
            };
          },
        },
      } as unknown as Fireblocks;

      const signer = new FireblocksSigner(fireblocks, {
        initialMs: 1,
        ceilingMs: 1,
        timeoutMs: 30 * 60_000,
        approvalTimeoutMs: 60 * 60_000,
      });

      await expect(signer.getTxStatus("fb-tx-flap")).rejects.toThrow(
        /timed out/i,
      );
    });

    it("still enforces the machine budget once it has genuinely been spent in that state", async () => {
      // The reset on transition must not become "never times out after moving states" —
      // once IN the machine-paced state, its own budget still applies.
      let mockedNow = Date.now();
      jest.spyOn(Date, "now").mockImplementation(() => mockedNow);

      let call = 0;
      const statuses = [
        TransactionStateEnum.PendingAuthorization,
        TransactionStateEnum.PendingSignature,
        TransactionStateEnum.PendingSignature,
      ];
      const fireblocks = {
        transactions: {
          getTransaction: async () => {
            const index = Math.min(call, statuses.length - 1);
            if (index >= 1) mockedNow += 31 * 60_000; // exceeds the 30-min machine budget
            call++;
            return {
              data: {
                id: "fb-tx-stuck",
                status: statuses[index],
                operation: TransactionOperation.Transfer,
              },
            };
          },
        },
      } as unknown as Fireblocks;

      const signer = new FireblocksSigner(fireblocks, {
        initialMs: 1,
        ceilingMs: 1,
        timeoutMs: 30 * 60_000,
        approvalTimeoutMs: 60 * 60_000,
      });

      await expect(signer.getTxStatus("fb-tx-stuck")).rejects.toThrow(
        /timed out/i,
      );
    });
  });
});
