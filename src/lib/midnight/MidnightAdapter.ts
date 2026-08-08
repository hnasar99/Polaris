import type {
  EligibilityProofInput,
  EligibilityResult,
} from "@/domain/eligibility/types";
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
import { toPolarisPrivateState } from "../../../midnight/contracts/witnesses";
import { bech32ToUserAddress } from "@/lib/midnight/address";
import {
  deployedByThisBrowser,
  getAdminPkHex,
  rememberAdminContract,
  rememberAdminPk,
} from "@/lib/midnight/admin-identity";
import {
  encodeCode,
  encodeConsentScope,
  encodeStudyId,
  hashPurpose,
  nightToStars,
  starsToNight,
  toHex,
  toUnixSeconds,
} from "@/lib/midnight/encoding";
import {
  MidnightAdapterError,
  MIDNIGHT_BINDINGS_MISSING,
  MIDNIGHT_CONTRACT_ADDRESS_REQUIRED,
  MIDNIGHT_SESSION_REQUIRED,
} from "@/lib/midnight/errors";
import {
  getLabStudyIdsHex,
  getResearcherPkHex as readCachedResearcherPk,
  rememberLabStudy,
  rememberResearcherPk,
} from "@/lib/midnight/lab-identity";
import {
  callPolarisCircuit,
  coerceCircuitBoolean,
  deployPolarisHealth,
} from "@/lib/midnight/polaris-tx";
import {
  createDeployProgressTracker,
  type DeployProgressCallback,
} from "@/lib/midnight/deploy-progress";
import {
  pollForLedger,
  readPolarisLedger,
  type OnChainStudy,
  type PolarisLedgerView,
} from "@/lib/midnight/polaris-read";
import type { MidnightHealthProtocol } from "@/lib/midnight/protocol";
import {
  clearMidnightRuntime,
  getMidnightRuntime,
  loadPersistedContractAddress,
  setMidnightContractAddress,
  setMidnightDappSecret,
  setMidnightSession,
} from "@/lib/midnight/runtime";
import { getOrCreateDappSecret } from "@/lib/midnight/secret";
import { POLARIS_ZK_ASSET_PATH } from "@/lib/midnight/constants";
import {
  createConnectedSession,
  type ConnectedSession,
} from "@/lib/midnight/session";
import { loadPolarisBindings } from "@/lib/midnight/bindings";

/**
 * Production adapter: 1AM session + Compact polaris-health circuits.
 *
 * Fails closed with explicit codes until session, contract address, and
 * compiler-generated bindings are available. Never returns silent fake success.
 */
export class MidnightAdapter implements MidnightHealthProtocol {
  /** Bind wallet ConnectedAPI → dust-free session (call after wallet.connect). */
  async bindSession(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api: any,
    zkAssetPath: string = POLARIS_ZK_ASSET_PATH,
  ): Promise<ConnectedSession> {
    const session = await createConnectedSession(api, zkAssetPath);
    setMidnightSession(session);
    setMidnightDappSecret(getOrCreateDappSecret());
    loadPersistedContractAddress();
    return session;
  }

  clearSession(): void {
    clearMidnightRuntime();
  }

  async deploy(
    adminSecret?: Uint8Array,
    onProgress?: DeployProgressCallback,
  ): Promise<string> {
    const tracker = onProgress
      ? createDeployProgressTracker(onProgress)
      : null;

    const session = tracker
      ? await tracker.run(
          "session",
          () => {
            const s = this.requireSession();
            this.requireSecret();
            return s;
          },
          "Checking wallet session…",
          "Session ready",
        )
      : this.requireSession();
    const secret = adminSecret ?? this.requireSecret();

    const address = await deployPolarisHealth(session, secret, onProgress);

    const networkId = session.config.networkId;

    if (tracker) {
      await tracker.run(
        "saveAddress",
        async () => {
          setMidnightContractAddress(address);
          rememberAdminContract(address, {
            networkId,
            source: "deploy",
          });
        },
        "Saving contract address…",
        `Address saved: ${address}`,
      );
    } else {
      setMidnightContractAddress(address);
      rememberAdminContract(address, {
        networkId,
        source: "deploy",
      });
    }

    return address;
  }

  private requireSession(): ConnectedSession {
    const { session } = getMidnightRuntime();
    if (!session) {
      throw new MidnightAdapterError(
        "MIDNIGHT_SESSION_REQUIRED",
        MIDNIGHT_SESSION_REQUIRED,
      );
    }
    return session;
  }

  private requireContractAddress(): string {
    const address =
      getMidnightRuntime().contractAddress ?? loadPersistedContractAddress();
    if (!address) {
      throw new MidnightAdapterError(
        "MIDNIGHT_CONTRACT_ADDRESS_REQUIRED",
        MIDNIGHT_CONTRACT_ADDRESS_REQUIRED,
      );
    }
    return address;
  }

  private requireSecret(): Uint8Array {
    let secret = getMidnightRuntime().dappSecret;
    if (!secret) {
      secret = getOrCreateDappSecret();
      setMidnightDappSecret(secret);
    }
    return secret;
  }

  private async requireReady(): Promise<{
    session: ConnectedSession;
    contractAddress: string;
    secret: Uint8Array;
  }> {
    const session = this.requireSession();
    const contractAddress = this.requireContractAddress();
    const secret = this.requireSecret();
    const bindings = await loadPolarisBindings();
    if (!bindings) {
      throw new MidnightAdapterError(
        "MIDNIGHT_BINDINGS_MISSING",
        MIDNIGHT_BINDINGS_MISSING,
      );
    }
    return { session, contractAddress, secret };
  }

  private medicalState(
    secret: Uint8Array,
    medical?: {
      age: number;
      diagnosis: string;
      hba1cScaled: number;
      treatment: string;
      treatmentMonths: number;
    },
  ) {
    return toPolarisPrivateState(
      secret,
      medical ?? {
        age: 0,
        diagnosis: "",
        hba1cScaled: 0,
        treatment: "",
        treatmentMonths: 0,
      },
    );
  }

  /** Own unshielded address as a Compact UserAddress arg. */
  private payoutAddress(session: ConnectedSession) {
    return bech32ToUserAddress(
      session.unshieldedAddress,
      session.config.networkId,
    );
  }

  // -------------------------------------------------------------------------
  // Platform vault (admin only — assertAdmin rejects everyone else on-chain)
  // -------------------------------------------------------------------------

  async fundVault(input: FundVaultInput): Promise<TransactionResult> {
    const { contractAddress } = await this.requireReady();
    return this.fundVaultAt(contractAddress, input);
  }

  async withdrawVault(input: WithdrawVaultInput): Promise<TransactionResult> {
    const { contractAddress } = await this.requireReady();
    return this.withdrawVaultAt(contractAddress, input);
  }

  async fundVaultAt(
    contractAddress: string,
    input: FundVaultInput,
  ): Promise<TransactionResult> {
    const { session, secret } = await this.requireReady();
    const before = await readPolarisLedger(session, contractAddress);
    const { transactionId } = await callPolarisCircuit(
      session,
      contractAddress,
      "fundVault",
      [nightToStars(input.amountNight)],
      this.medicalState(secret),
    );
    await pollForLedger(session, contractAddress, (view) =>
      before
        ? view.totalFundedStars > before.totalFundedStars ||
          view.vaultBalanceStars > before.vaultBalanceStars
        : view.totalFundedStars > 0n || view.vaultBalanceStars > 0n,
    );
    return { transactionId, status: "submitted" };
  }

  async withdrawVaultAt(
    contractAddress: string,
    input: WithdrawVaultInput,
  ): Promise<TransactionResult> {
    const { session, secret } = await this.requireReady();
    const before = await readPolarisLedger(session, contractAddress);
    const recipient = input.recipientAddress
      ? bech32ToUserAddress(input.recipientAddress, session.config.networkId)
      : this.payoutAddress(session);

    const { transactionId } = await callPolarisCircuit(
      session,
      contractAddress,
      "withdrawVault",
      [recipient, nightToStars(input.amountNight)],
      this.medicalState(secret),
    );
    await pollForLedger(session, contractAddress, (view) =>
      before ? view.vaultBalanceStars < before.vaultBalanceStars : view != null,
    );
    return { transactionId, status: "submitted" };
  }

  async rolloverVault(input: {
    sourceAddress: string;
    targetAddress: string;
  }): Promise<VaultRolloverResult> {
    const sourceAddress = input.sourceAddress.trim();
    const targetAddress = input.targetAddress.trim();
    if (!sourceAddress || !targetAddress) {
      throw new MidnightAdapterError(
        "MIDNIGHT_CONTRACT_ADDRESS_REQUIRED",
        MIDNIGHT_CONTRACT_ADDRESS_REQUIRED,
      );
    }
    if (sourceAddress === targetAddress) {
      return {
        sourceAddress,
        targetAddress,
        moved: false,
        amountNight: 0,
      };
    }

    const { session } = await this.requireReady();
    const sourceView = await readPolarisLedger(session, sourceAddress);
    if (!sourceView || sourceView.vaultBalanceStars <= 0n) {
      return {
        sourceAddress,
        targetAddress,
        moved: false,
        amountNight: 0,
      };
    }

    const sourceStatus = this.vaultStatusFromView(sourceView, sourceAddress);
    if (!sourceStatus.isAdmin) {
      throw new MidnightAdapterError(
        "NOT_ADMIN",
        "Only the platform admin can move vault liquidity.",
      );
    }

    const amountNight = starsToNight(sourceView.vaultBalanceStars);
    const withdraw = await this.withdrawVaultAt(sourceAddress, { amountNight });
    const fund = await this.fundVaultAt(targetAddress, { amountNight });

    return {
      sourceAddress,
      targetAddress,
      moved: true,
      amountNight,
      withdrawTransactionId: withdraw.transactionId,
      fundTransactionId: fund.transactionId,
    };
  }

  async readVault(): Promise<VaultStatus> {
    const contractAddress =
      getMidnightRuntime().contractAddress ?? loadPersistedContractAddress();
    if (!contractAddress) {
      return this.emptyVaultStatus(null);
    }
    return this.readVaultForAddress(contractAddress);
  }

  async readVaultForAddress(contractAddress: string): Promise<VaultStatus> {
    try {
      const session = this.requireSession();
      const bindings = await loadPolarisBindings();
      if (!bindings) {
        return this.emptyVaultStatus(contractAddress);
      }

      const view = await readPolarisLedger(session, contractAddress.trim());
      if (!view) {
        return this.emptyVaultStatus(contractAddress);
      }

      return this.vaultStatusFromView(view, contractAddress);
    } catch {
      return this.emptyVaultStatus(contractAddress);
    }
  }

  private vaultStatusFromView(
    view: PolarisLedgerView,
    contractAddress: string,
  ): VaultStatus {
    const isAdmin =
      deployedByThisBrowser(contractAddress) ||
      (getAdminPkHex() !== null && getAdminPkHex() === view.adminPkHex);
    if (isAdmin) rememberAdminPk(view.adminPkHex);

    return {
      known: true,
      balanceNight: starsToNight(view.vaultBalanceStars),
      totalFundedNight: starsToNight(view.totalFundedStars),
      totalPaidNight: starsToNight(view.totalPaidStars),
      adminPkHex: view.adminPkHex,
      isAdmin,
    };
  }

  private emptyVaultStatus(contractAddress: string | null): VaultStatus {
    return {
      known: false,
      balanceNight: 0,
      totalFundedNight: 0,
      totalPaidNight: 0,
      adminPkHex: getAdminPkHex(),
      isAdmin: deployedByThisBrowser(contractAddress),
    };
  }

  // -------------------------------------------------------------------------
  // Laboratory / researcher
  // -------------------------------------------------------------------------

  async createStudy(input: CreateStudyInput): Promise<TransactionResult> {
    const { session, contractAddress, secret } = await this.requireReady();
    const studyId = await encodeStudyId(input.externalStudyId);
    const { transactionId } = await callPolarisCircuit(
      session,
      contractAddress,
      "createStudy",
      [
        studyId,
        BigInt(input.criteria.minAge),
        encodeCode(input.criteria.requiredDiagnosis),
        BigInt(input.criteria.minHba1cScaled),
        encodeCode(input.criteria.requiredTreatment),
        BigInt(input.criteria.minTreatmentMonths),
        nightToStars(input.rewardAmount),
      ],
      this.medicalState(secret),
    );
    rememberLabStudy(toHex(studyId));
    return { transactionId, status: "submitted" };
  }

  async closeStudy(input: CloseStudyInput): Promise<TransactionResult> {
    const { session, contractAddress, secret } = await this.requireReady();
    const studyId = await encodeStudyId(input.externalStudyId);
    const { transactionId } = await callPolarisCircuit(
      session,
      contractAddress,
      "closeStudy",
      [studyId],
      this.medicalState(secret),
    );
    return { transactionId, status: "submitted" };
  }

  // -------------------------------------------------------------------------
  // Patient
  // -------------------------------------------------------------------------

  async proveEligibility(
    input: EligibilityProofInput,
  ): Promise<EligibilityResult> {
    const { session, contractAddress, secret } = await this.requireReady();
    const studyId = await encodeStudyId(input.externalStudyId);
    const privateState = this.medicalState(secret, {
      age: input.privateWitness.age,
      diagnosis: input.privateWitness.diagnosis,
      hba1cScaled: input.privateWitness.hba1cScaled,
      treatment: input.privateWitness.treatment,
      treatmentMonths: input.privateWitness.treatmentMonths,
    });

    try {
      const { transactionId, result } = await callPolarisCircuit(
        session,
        contractAddress,
        "proveEligibility",
        [studyId],
        privateState,
      );

      const eligible = coerceCircuitBoolean(result);
      if (eligible === undefined) {
        throw new MidnightAdapterError(
          "MIDNIGHT_CIRCUIT_RESULT_MISSING",
          "proveEligibility returned no circuit result — cannot decide eligibility",
        );
      }
      return {
        eligible,
        proofReference: `midnight:proveEligibility:${transactionId}`,
        transactionId,
      };
    } catch (raw) {
      // A prior successful prove that the UI mis-read as not_eligible leaves the
      // nullifier on-chain. Surface that as eligible so consent can proceed.
      const msg = raw instanceof Error ? raw.message : String(raw);
      if (/eligibility already proved/i.test(msg)) {
        return {
          eligible: true,
          proofReference: `midnight:proveEligibility:already-proved:${input.externalStudyId}`,
          transactionId: `already_proved_${input.externalStudyId}`,
        };
      }
      throw raw;
    }
  }

  async grantConsent(input: GrantConsentInput): Promise<TransactionResult> {
    const { session, contractAddress, secret } = await this.requireReady();
    const studyId = await encodeStudyId(input.externalStudyId);
    const purposeHash = await hashPurpose(input.purpose);
    const scopeMask = BigInt(encodeConsentScope(input.scope.fields));
    const expiresAt = toUnixSeconds(input.expiresAt);

    const { transactionId } = await callPolarisCircuit(
      session,
      contractAddress,
      "grantConsent",
      [studyId, purposeHash, scopeMask, expiresAt],
      this.medicalState(secret),
    );
    return { transactionId, status: "submitted" };
  }

  async revokeConsent(input: RevokeConsentInput): Promise<TransactionResult> {
    const { session, contractAddress, secret } = await this.requireReady();
    const studyId = await encodeStudyId(input.externalStudyId);
    const { transactionId } = await callPolarisCircuit(
      session,
      contractAddress,
      "revokeConsent",
      [studyId],
      this.medicalState(secret),
    );
    return { transactionId, status: "submitted" };
  }

  /**
   * Claim the reward. The payout address is public by design (unshielded
   * transfer); it is never linked on-chain to medical values or patient pk.
   */
  async claimReward(input: ClaimRewardInput): Promise<TransactionResult> {
    const { session, contractAddress, secret } = await this.requireReady();
    const before = await readPolarisLedger(session, contractAddress);
    const studyId = await encodeStudyId(input.externalStudyId);
    const { transactionId } = await callPolarisCircuit(
      session,
      contractAddress,
      "claimReward",
      [studyId, this.payoutAddress(session)],
      this.medicalState(secret),
    );
    await pollForLedger(session, contractAddress, (view) =>
      before
        ? view.totalPaidStars > before.totalPaidStars ||
          view.rewardClaimCount > before.rewardClaimCount ||
          view.vaultBalanceStars < before.vaultBalanceStars
        : view.rewardClaimCount > 0 || view.totalPaidStars > 0n,
    );
    return { transactionId, status: "submitted" };
  }

  // -------------------------------------------------------------------------
  // Public reads
  // -------------------------------------------------------------------------

  private async readLedger(): Promise<PolarisLedgerView | null> {
    const session = getMidnightRuntime().session;
    const contractAddress =
      getMidnightRuntime().contractAddress ?? loadPersistedContractAddress();
    if (!session || !contractAddress) return null;
    return readPolarisLedger(session, contractAddress);
  }

  async readStudies(): Promise<OnChainStudy[]> {
    const view = await this.readLedger();
    if (!view) return [];

    const owned = new Set(getLabStudyIdsHex());
    const mine = view.studies.find((s) => owned.has(s.studyIdHex));
    if (mine) rememberResearcherPk(mine.researcherPkHex);

    return view.studies;
  }

  async getResearcherPkHex(): Promise<string | null> {
    const cached = readCachedResearcherPk();
    if (cached) return cached;
    await this.readStudies();
    return readCachedResearcherPk();
  }
}
