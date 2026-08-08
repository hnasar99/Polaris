"use client";

import { useState } from "react";
import { Badge, Button, Card, Field, SectionHeader, inputClass } from "@/components/ui";
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
  } = useWallet();
  const [draft, setDraft] = useState("");

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
          <Button variant="ghost" onClick={forgetContractAddress}>
            {t("contract.clear")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Button
            disabled={isDeploying || !walletConnected}
            onClick={() => void deploy()}
          >
            {isDeploying ? t("contract.deploying") : t("contract.deploy")}
          </Button>
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
        </div>
      )}
    </Card>
  );
}

