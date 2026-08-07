import { describe, expect, it } from "vitest";
import {
  consentReducer,
  initialConsentState,
} from "@/domain/state/consent";
import {
  eligibilityReducer,
  initialEligibilityState,
} from "@/domain/state/eligibility";
import {
  initialRewardState,
  rewardReducer,
} from "@/domain/state/reward";

describe("state machines", () => {
  it("eligibility transitions idle → checking → eligible", () => {
    let state = initialEligibilityState;
    state = eligibilityReducer(state, { type: "CHECK_STARTED" });
    expect(state.status).toBe("checking");
    state = eligibilityReducer(state, {
      type: "CHECK_ELIGIBLE",
      proofReference: "p",
      transactionId: "t",
    });
    expect(state.status).toBe("eligible");
  });

  it("eligibility transitions to not_eligible and error", () => {
    let state = eligibilityReducer(initialEligibilityState, {
      type: "CHECK_STARTED",
    });
    state = eligibilityReducer(state, {
      type: "CHECK_NOT_ELIGIBLE",
      proofReference: "p",
      transactionId: "t",
    });
    expect(state.status).toBe("not_eligible");
    expect(state.errorCode).toBe("PATIENT_NOT_ELIGIBLE");

    state = eligibilityReducer(initialEligibilityState, {
      type: "CHECK_STARTED",
    });
    state = eligibilityReducer(state, {
      type: "CHECK_FAILED",
      errorCode: "MIDNIGHT_NOT_CONNECTED",
      message: "Midnight adapter not connected",
    });
    expect(state.status).toBe("error");
    expect(state.errorCode).toBe("MIDNIGHT_NOT_CONNECTED");
  });

  it("consent transitions none → pending → active → revoked", () => {
    let state = initialConsentState;
    state = consentReducer(state, { type: "GRANT_STARTED" });
    expect(state.status).toBe("pending");
    state = consentReducer(state, {
      type: "GRANT_SUCCEEDED",
      transactionId: "g1",
    });
    expect(state.status).toBe("active");
    state = consentReducer(state, { type: "REVOKE_STARTED" });
    state = consentReducer(state, {
      type: "REVOKE_SUCCEEDED",
      transactionId: "r1",
    });
    expect(state.status).toBe("revoked");
  });

  it("consent supports expired and error states", () => {
    let state = consentReducer(initialConsentState, {
      type: "GRANT_SUCCEEDED",
      transactionId: "g1",
    });
    state = consentReducer(state, { type: "MARK_EXPIRED" });
    expect(state.status).toBe("expired");

    state = consentReducer(initialConsentState, { type: "GRANT_STARTED" });
    state = consentReducer(state, {
      type: "GRANT_FAILED",
      errorCode: "WALLET_NOT_CONNECTED",
      message: "Wallet not connected",
    });
    expect(state.status).toBe("error");
  });

  it("reward transitions unavailable → available → claimed", () => {
    let state = initialRewardState;
    state = rewardReducer(state, { type: "MAKE_AVAILABLE" });
    expect(state.status).toBe("available");
    state = rewardReducer(state, { type: "CLAIM_STARTED" });
    expect(state.status).toBe("claiming");
    state = rewardReducer(state, {
      type: "CLAIM_SUCCEEDED",
      transactionId: "c1",
    });
    expect(state.status).toBe("claimed");
  });

  it("reward transitions to error on claim failure", () => {
    let state = rewardReducer(initialRewardState, { type: "MAKE_AVAILABLE" });
    state = rewardReducer(state, { type: "CLAIM_STARTED" });
    state = rewardReducer(state, {
      type: "CLAIM_FAILED",
      errorCode: "CONSENT_REQUIRED",
      message: "Active consent required to claim reward",
    });
    expect(state.status).toBe("error");
    expect(state.errorCode).toBe("CONSENT_REQUIRED");
  });
});
