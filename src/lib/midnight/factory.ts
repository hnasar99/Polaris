import type { OnChainStudy } from "@/lib/midnight/polaris-read";
import type { MidnightHealthProtocol } from "@/lib/midnight/protocol";
import type {
  ClaimRewardInput,
  CloseStudyInput,
  CreateStudyInput,
  FundVaultInput,
  GrantConsentInput,
  RevokeConsentInput,
  TransactionResult,
  VaultRolloverResult,
  VaultStatus,
  WithdrawVaultInput,
} from "@/types/midnight";
import type {
  EligibilityProofInput,
  EligibilityResult,
} from "@/domain/eligibility/types";

/**
 * Lazy proxy for MidnightAdapter so Compact/session WASM stays out of the
 * eager client graph. Importing it statically would turn every `"use client"`
 * module that reaches this barrel into an async webpack module.
 */
function createLazyMidnightAdapter(): MidnightHealthProtocol {
  let real: MidnightHealthProtocol | null = null;

  async function get(): Promise<MidnightHealthProtocol> {
    if (!real) {
      const { MidnightAdapter } = await import("@/lib/midnight/MidnightAdapter");
      real = new MidnightAdapter();
    }
    return real;
  }

  return {
    fundVault: (input: FundVaultInput): Promise<TransactionResult> =>
      get().then((a) => a.fundVault(input)),
    withdrawVault: (input: WithdrawVaultInput): Promise<TransactionResult> =>
      get().then((a) => a.withdrawVault(input)),
    fundVaultAt: (
      contractAddress: string,
      input: FundVaultInput,
    ): Promise<TransactionResult> =>
      get().then((a) => a.fundVaultAt(contractAddress, input)),
    withdrawVaultAt: (
      contractAddress: string,
      input: WithdrawVaultInput,
    ): Promise<TransactionResult> =>
      get().then((a) => a.withdrawVaultAt(contractAddress, input)),
    readVault: (): Promise<VaultStatus> => get().then((a) => a.readVault()),
    readVaultForAddress: (contractAddress: string): Promise<VaultStatus> =>
      get().then((a) => a.readVaultForAddress(contractAddress)),
    rolloverVault: (input: {
      sourceAddress: string;
      targetAddress: string;
    }): Promise<VaultRolloverResult> =>
      get().then((a) => a.rolloverVault(input)),
    createStudy: (input: CreateStudyInput): Promise<TransactionResult> =>
      get().then((a) => a.createStudy(input)),
    closeStudy: (input: CloseStudyInput): Promise<TransactionResult> =>
      get().then((a) => a.closeStudy(input)),
    proveEligibility: (
      input: EligibilityProofInput,
    ): Promise<EligibilityResult> => get().then((a) => a.proveEligibility(input)),
    grantConsent: (input: GrantConsentInput): Promise<TransactionResult> =>
      get().then((a) => a.grantConsent(input)),
    revokeConsent: (input: RevokeConsentInput): Promise<TransactionResult> =>
      get().then((a) => a.revokeConsent(input)),
    claimReward: (input: ClaimRewardInput): Promise<TransactionResult> =>
      get().then((a) => a.claimReward(input)),
    readStudies: (): Promise<OnChainStudy[]> =>
      get().then((a) => a.readStudies()),
    getResearcherPkHex: (): Promise<string | null> =>
      get().then((a) => a.getResearcherPkHex?.() ?? null),
  };
}

/** Every protocol call goes through the real Compact-backed MidnightAdapter. */
export function createMidnightProtocol(): MidnightHealthProtocol {
  return createLazyMidnightAdapter();
}

/** Deploy / join are only available on the real adapter. */
export async function deployPolarisContract(
  adminSecret?: Uint8Array,
  onProgress?: import("@/lib/midnight/deploy-progress").DeployProgressCallback,
): Promise<string> {
  const { MidnightAdapter } = await import("@/lib/midnight/MidnightAdapter");
  return new MidnightAdapter().deploy(adminSecret, onProgress);
}
