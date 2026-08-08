"use client";

import { useState } from "react";
import { Badge, Button, Card, Field, SectionHeader, inputClass } from "@/components/ui";
import { DeployProgressPanel } from "@/features/admin/DeployProgressPanel";
import { DeploymentHistory } from "@/features/admin/DeploymentHistory";
import { useWallet } from "@/features/wallet/WalletProvider";
import { useI18n } from "@/i18n";

/**
 * Contract address configuration lives with the platform role: patients and
 * laboratories just consume whatever address is configured here.
 */
export function ContractPanel() {
  const { t } = useI18n();
  const {
    contractAddress,
    isDeploying,
    deploy,
    setContractAddress,
    forgetContractAddress,
    walletConnected,
    networkId,
  } = useWallet();
  const [draft, setDraft] = useState("");

  const handleForget = () => {
    if (!window.confirm(t("admin.forgetConfirm"))) return;
    forgetContractAddress();
  };

  return (
    <Card>
      <SectionHeader
        title={t("admin.contractTitle")}
        subtitle={t("admin.contractBody")}
        action={
          <Badge tone={contractAddress ? "info" : "warning"}>
            {contractAddress ? t("common.status") : t("contract.notDeployed")}
          </Badge>
        }
      />

      {contractAddress ? (
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {t("contract.address")}
            </p>
            <p className="break-all font-mono text-sm text-white">
              {contractAddress}
            </p>
          </div>
          <p className="text-xs text-slate-500">{t("admin.deploySavedHint")}</p>
          <DeployProgressPanel />
          <Button variant="ghost" onClick={handleForget}>
            {t("contract.clear")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {!walletConnected ? (
            <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              {t("admin.deployNeedsWallet")}
            </p>
          ) : networkId ? (
            <p className="text-xs text-slate-500">
              {t("admin.deployNetwork", { network: networkId })}
            </p>
          ) : null}

          <Button
            disabled={isDeploying || !walletConnected}
            onClick={() => void deploy()}
          >
            {isDeploying ? t("contract.deploying") : t("contract.deploy")}
          </Button>
          <DeployProgressPanel />
          <p className="text-xs text-slate-500">{t("contract.deployHint")}</p>

          <Field label={t("contract.join")}>
            <div className="flex flex-wrap gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("contract.joinPlaceholder")}
                className={`${inputClass} flex-1`}
              />
              <Button
                variant="secondary"
                disabled={draft.trim().length === 0}
                onClick={() => {
                  setContractAddress(draft);
                  setDraft("");
                }}
              >
                {t("contract.use")}
              </Button>
            </div>
          </Field>
          <p className="text-xs text-slate-500">{t("admin.pasteNotAdmin")}</p>
        </div>
      )}

      <DeploymentHistory />
    </Card>
  );
}
