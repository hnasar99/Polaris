"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ConsentScopeField } from "@/domain/consent/types";
import type { PrivateMedicalWitness } from "@/domain/medical/types";
import type { Study, StudyCriteria, StudyView } from "@/domain/study/types";
import {
  emptyProgress,
  loadProgress,
  saveProgress,
  type ProgressMap,
  type StudyProgress,
} from "@/features/chain/progress";
import { useWallet } from "@/features/wallet/WalletProvider";
import type { MidnightHealthProtocol } from "@/lib/midnight";
import { getLabStudyIdsHex, rememberLabStudy } from "@/lib/midnight/lab-identity";
import { encodeStudyId, starsToNight, toHex } from "@/lib/midnight/encoding";
import type { OnChainStudy } from "@/lib/midnight/polaris-read";
import { loadStudyMetadata, saveStudyMetadata } from "@/lib/vault/studyMetadata";
import type { VaultStatus } from "@/types/midnight";

export type NewStudyInput = {
  externalStudyId: string;
  title: string;
  description: string;
  researcherAlias: string;
  criteria: StudyCriteria;
  rewardAmount: number;
};

export type GrantConsentOptions = {
  scope: ConsentScopeField[];
  purpose: string;
  durationDays: number;
};

const EMPTY_VAULT: VaultStatus = {
  known: false,
  balanceNight: 0,
  totalFundedNight: 0,
  totalPaidNight: 0,
  adminPkHex: null,
  isAdmin: false,
};

type ChainValue = {
  loading: boolean;
  refreshing: boolean;
  studies: StudyView[];
  myStudies: StudyView[];
  vault: VaultStatus;
  busyKey: string | null;
  refresh: () => Promise<void>;
  progressFor: (externalStudyId: string) => StudyProgress;
  /** Whether the vault can still cover one payout of this size. */
  vaultCovers: (rewardNight: number) => boolean;

  proveEligibility: (
    view: StudyView,
    witness: PrivateMedicalWitness,
  ) => Promise<boolean>;
  grantConsent: (
    view: StudyView,
    options: GrantConsentOptions,
  ) => Promise<boolean>;
  revokeConsent: (view: StudyView) => Promise<boolean>;
  claimReward: (view: StudyView) => Promise<boolean>;

  launchStudy: (input: NewStudyInput) => Promise<boolean>;
  closeStudy: (view: StudyView) => Promise<boolean>;

  fundVault: (amountNight: number) => Promise<boolean>;
  withdrawVault: (amountNight: number, recipient?: string) => Promise<boolean>;
};

const ChainContext = createContext<ChainValue | null>(null);

type ChainSnapshot = {
  metadata: Study[];
  hexByExternalId: Record<string, string>;
  chainStudies: OnChainStudy[];
  vault: VaultStatus;
  ownedHex: string[];
};

/**
 * One read of everything the UI needs. Ledger reads need a session and compiled
 * bindings, so they degrade to empty instead of hiding the Supabase metadata.
 *
 * Never call protocol methods until the wallet is connected — the lazy
 * MidnightAdapter import statically pulls compact-runtime / ledger WASM, and
 * that must stay out of the landing client graph.
 */
async function loadChainSnapshot(
  protocol: MidnightHealthProtocol,
  canReadLedger: boolean,
): Promise<ChainSnapshot> {
  const metadata = await loadStudyMetadata();
  const hexByExternalId = Object.fromEntries(
    await Promise.all(
      metadata.map(
        async (study) =>
          [
            study.externalStudyId,
            toHex(await encodeStudyId(study.externalStudyId)),
          ] as const,
      ),
    ),
  );

  let chainStudies: OnChainStudy[] = [];
  let vault = EMPTY_VAULT;

  if (canReadLedger) {
    try {
      chainStudies = await protocol.readStudies();
    } catch {
      chainStudies = [];
    }

    try {
      vault = await protocol.readVault();
    } catch {
      vault = EMPTY_VAULT;
    }
  }

  return {
    metadata,
    hexByExternalId,
    chainStudies,
    vault,
    ownedHex: getLabStudyIdsHex(),
  };
}

export function ChainProvider({ children }: { children: ReactNode }) {
  const { protocol, contractAddress, reportError, walletConnected } =
    useWallet();

  const [metadata, setMetadata] = useState<Study[]>([]);
  const [chainStudies, setChainStudies] = useState<OnChainStudy[]>([]);
  const [hexByExternalId, setHexByExternalId] = useState<Record<string, string>>(
    {},
  );
  const [ownedHex, setOwnedHex] = useState<string[]>([]);
  const [vault, setVault] = useState<VaultStatus>(EMPTY_VAULT);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const contractRef = useRef<string | null>(contractAddress);

  const patchProgress = useCallback(
    (externalStudyId: string, patch: Partial<StudyProgress>) => {
      setProgress((prev) => {
        const next: ProgressMap = {
          ...prev,
          [externalStudyId]: {
            ...emptyProgress(),
            ...prev[externalStudyId],
            ...patch,
          },
        };
        saveProgress(contractRef.current, next);
        return next;
      });
    },
    [],
  );

  const applySnapshot = useCallback((snapshot: ChainSnapshot) => {
    setMetadata(snapshot.metadata);
    setHexByExternalId(snapshot.hexByExternalId);
    setChainStudies(snapshot.chainStudies);
    setVault(snapshot.vault);
    setOwnedHex(snapshot.ownedHex);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      applySnapshot(await loadChainSnapshot(protocol, walletConnected));
    } catch (raw) {
      reportError(raw);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [applySnapshot, protocol, reportError, walletConnected]);

  useEffect(() => {
    contractRef.current = contractAddress;
    let cancelled = false;

    void loadChainSnapshot(protocol, walletConnected)
      .then((snapshot) => {
        if (cancelled) return;
        // Progress is stored per contract, so it reloads with the address.
        setProgress(loadProgress(contractAddress));
        applySnapshot(snapshot);
      })
      .catch((raw: unknown) => {
        if (!cancelled) reportError(raw);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applySnapshot, contractAddress, protocol, reportError, walletConnected]);

  const studies = useMemo<StudyView[]>(() => {
    const chainByHex = new Map(chainStudies.map((s) => [s.studyIdHex, s]));

    return metadata.map((study) => {
      const hex = hexByExternalId[study.externalStudyId] ?? null;
      const chain = hex ? (chainByHex.get(hex) ?? null) : null;

      // The ledger is authoritative for everything it tracks.
      return {
        ...study,
        contractStudyIdHex: hex ?? study.contractStudyIdHex ?? null,
        criteria: chain ? { ...chain.criteria } : study.criteria,
        active: chain ? chain.active : study.active,
        rewardAmount: chain
          ? starsToNight(chain.rewardStars)
          : study.rewardAmount,
        chain,
      };
    });
  }, [chainStudies, hexByExternalId, metadata]);

  const myStudies = useMemo(() => {
    const owned = new Set(ownedHex);
    return studies.filter(
      (s) => s.contractStudyIdHex && owned.has(s.contractStudyIdHex),
    );
  }, [ownedHex, studies]);

  const progressFor = useCallback(
    (externalStudyId: string): StudyProgress =>
      progress[externalStudyId] ?? emptyProgress(),
    [progress],
  );

  // An unread vault is unknown, not empty: warning about liquidity before the
  // contract is even configured would be a false alarm.
  const vaultCovers = useCallback(
    (rewardNight: number) => !vault.known || vault.balanceNight >= rewardNight,
    [vault.balanceNight, vault.known],
  );

  // ---------------------------------------------------------------------------
  // Patient actions
  // ---------------------------------------------------------------------------

  const proveEligibility = useCallback(
    async (view: StudyView, witness: PrivateMedicalWitness) => {
      setBusyKey(`prove:${view.externalStudyId}`);
      patchProgress(view.externalStudyId, {
        eligibility: "checking",
        errorCode: null,
      });
      try {
        const result = await protocol.proveEligibility({
          externalStudyId: view.externalStudyId,
          criteria: view.criteria,
          privateWitness: witness,
        });
        patchProgress(view.externalStudyId, {
          eligibility: result.eligible ? "eligible" : "not_eligible",
          proofReference: result.proofReference,
          eligibilityTxId: result.transactionId ?? null,
        });
        void refresh();
        return result.eligible;
      } catch (raw) {
        const { code } = reportError(raw);
        patchProgress(view.externalStudyId, {
          eligibility: "error",
          errorCode: code,
        });
        return false;
      } finally {
        setBusyKey(null);
      }
    },
    [patchProgress, protocol, refresh, reportError],
  );

  const grantConsent = useCallback(
    async (view: StudyView, options: GrantConsentOptions) => {
      setBusyKey(`consent:${view.externalStudyId}`);
      patchProgress(view.externalStudyId, {
        consent: "pending",
        errorCode: null,
      });

      const expires = new Date();
      expires.setDate(expires.getDate() + options.durationDays);

      try {
        const result = await protocol.grantConsent({
          externalStudyId: view.externalStudyId,
          patientAlias: "anonymous",
          researcherAlias: view.researcherAlias,
          scope: { fields: options.scope },
          purpose: options.purpose,
          expiresAt: expires.toISOString(),
          rewardAmount: view.rewardAmount,
          rewardSymbol: view.rewardSymbol,
        });
        patchProgress(view.externalStudyId, {
          consent: "active",
          consentTxId: result.transactionId,
          consentScope: options.scope,
          consentPurpose: options.purpose,
          consentExpiresAt: expires.toISOString(),
          reward: "available",
        });
        void refresh();
        return true;
      } catch (raw) {
        const { code } = reportError(raw);
        patchProgress(view.externalStudyId, {
          consent: "error",
          errorCode: code,
        });
        return false;
      } finally {
        setBusyKey(null);
      }
    },
    [patchProgress, protocol, refresh, reportError],
  );

  const revokeConsent = useCallback(
    async (view: StudyView) => {
      setBusyKey(`revoke:${view.externalStudyId}`);
      try {
        await protocol.revokeConsent({
          externalStudyId: view.externalStudyId,
          patientAlias: "anonymous",
          consentTransactionId:
            progressFor(view.externalStudyId).consentTxId ?? "",
        });
        patchProgress(view.externalStudyId, {
          consent: "revoked",
          reward: "locked",
        });
        void refresh();
        return true;
      } catch (raw) {
        reportError(raw);
        return false;
      } finally {
        setBusyKey(null);
      }
    },
    [patchProgress, progressFor, protocol, refresh, reportError],
  );

  const claimReward = useCallback(
    async (view: StudyView) => {
      setBusyKey(`claim:${view.externalStudyId}`);
      patchProgress(view.externalStudyId, {
        reward: "claiming",
        errorCode: null,
      });
      try {
        const result = await protocol.claimReward({
          externalStudyId: view.externalStudyId,
          patientAlias: "anonymous",
          rewardAmount: view.rewardAmount,
          rewardSymbol: view.rewardSymbol,
        });
        patchProgress(view.externalStudyId, {
          reward: "claimed",
          rewardTxId: result.transactionId,
        });
        void refresh();
        return true;
      } catch (raw) {
        const { code } = reportError(raw);
        patchProgress(view.externalStudyId, {
          reward: "available",
          errorCode: code,
        });
        return false;
      } finally {
        setBusyKey(null);
      }
    },
    [patchProgress, protocol, refresh, reportError],
  );

  // ---------------------------------------------------------------------------
  // Laboratory actions — publishing never moves money
  // ---------------------------------------------------------------------------

  const launchStudy = useCallback(
    async (input: NewStudyInput) => {
      setBusyKey("launch");
      try {
        if (!contractAddress) {
          reportError({
            code: "MIDNIGHT_CONTRACT_ADDRESS_REQUIRED",
            message: "MIDNIGHT_CONTRACT_ADDRESS_REQUIRED",
          });
          return false;
        }

        const hex = toHex(await encodeStudyId(input.externalStudyId));
        let txId: string | undefined;

        try {
          const tx = await protocol.createStudy({
            externalStudyId: input.externalStudyId,
            title: input.title,
            researcherAlias: input.researcherAlias,
            criteria: input.criteria,
            rewardAmount: input.rewardAmount,
            rewardSymbol: "NIGHT",
          });
          txId = tx.transactionId;
          rememberLabStudy(hex);
          setOwnedHex(getLabStudyIdsHex());
        } catch (raw) {
          // Without a compiled contract the metadata is still worth keeping, but
          // the laboratory must see that the research is not on the ledger.
          reportError(raw);
        }

        await saveStudyMetadata(
          {
            id: input.externalStudyId,
            externalStudyId: input.externalStudyId,
            title: input.title,
            description: input.description,
            researcherAlias: input.researcherAlias,
            criteria: input.criteria,
            rewardAmount: input.rewardAmount,
            rewardSymbol: "NIGHT",
            active: true,
            createdAt: new Date().toISOString(),
            contractStudyIdHex: hex,
          },
          { txId, contractAddress },
        );

        await refresh();
        return Boolean(txId);
      } catch (raw) {
        reportError(raw);
        return false;
      } finally {
        setBusyKey(null);
      }
    },
    [contractAddress, protocol, refresh, reportError],
  );

  const closeStudy = useCallback(
    async (view: StudyView) => {
      setBusyKey(`close:${view.externalStudyId}`);
      try {
        await protocol.closeStudy({ externalStudyId: view.externalStudyId });
        await refresh();
        return true;
      } catch (raw) {
        reportError(raw);
        return false;
      } finally {
        setBusyKey(null);
      }
    },
    [protocol, refresh, reportError],
  );

  // ---------------------------------------------------------------------------
  // Platform vault (admin)
  // ---------------------------------------------------------------------------

  const fundVault = useCallback(
    async (amountNight: number) => {
      setBusyKey("vault:fund");
      try {
        await protocol.fundVault({ amountNight });
        await refresh();
        return true;
      } catch (raw) {
        reportError(raw);
        return false;
      } finally {
        setBusyKey(null);
      }
    },
    [protocol, refresh, reportError],
  );

  const withdrawVault = useCallback(
    async (amountNight: number, recipient?: string) => {
      setBusyKey("vault:withdraw");
      try {
        await protocol.withdrawVault({
          amountNight,
          recipientAddress: recipient,
        });
        await refresh();
        return true;
      } catch (raw) {
        reportError(raw);
        return false;
      } finally {
        setBusyKey(null);
      }
    },
    [protocol, refresh, reportError],
  );

  const value = useMemo<ChainValue>(
    () => ({
      loading,
      refreshing,
      studies,
      myStudies,
      vault,
      busyKey,
      refresh,
      progressFor,
      vaultCovers,
      proveEligibility,
      grantConsent,
      revokeConsent,
      claimReward,
      launchStudy,
      closeStudy,
      fundVault,
      withdrawVault,
    }),
    [
      busyKey,
      claimReward,
      closeStudy,
      fundVault,
      grantConsent,
      launchStudy,
      loading,
      myStudies,
      progressFor,
      proveEligibility,
      refresh,
      refreshing,
      revokeConsent,
      studies,
      vault,
      vaultCovers,
      withdrawVault,
    ],
  );

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
}

export function useChain(): ChainValue {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error("useChain must be used within ChainProvider");
  return ctx;
}
