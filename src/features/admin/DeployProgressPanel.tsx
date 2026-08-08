"use client";

import { useEffect, useRef } from "react";
import { Badge, cx } from "@/components/ui";
import { useWallet } from "@/features/wallet/WalletProvider";
import { useI18n, type MessageKey } from "@/i18n";
import {
  DEPLOY_STEP_ORDER,
  type DeployLogLine,
  type DeployProgressStatus,
  type DeployStepId,
  type DeployStepStatus,
} from "@/lib/midnight/deploy-progress";

const STEP_LABEL_KEYS: Record<DeployStepId, MessageKey> = {
  session: "contract.stepSession",
  bindings: "contract.stepBindings",
  createTx: "contract.stepCreateTx",
  submit: "contract.stepSubmit",
  persist: "contract.stepPersist",
  saveAddress: "contract.stepSaveAddress",
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function statusTone(
  status: DeployProgressStatus,
): "info" | "success" | "danger" | "neutral" {
  if (status === "running") return "info";
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  return "neutral";
}

function statusLabelKey(
  status: DeployProgressStatus,
): MessageKey | null {
  if (status === "running") return "contract.deployStatusRunning";
  if (status === "success") return "contract.deployStatusSuccess";
  if (status === "failed") return "contract.deployStatusFailed";
  return null;
}

function StepIndicator({ status }: { status: DeployStepStatus }) {
  if (status === "active") {
    return (
      <span
        className="inline-block size-2.5 animate-pulse rounded-full bg-cyan-400"
        aria-hidden
      />
    );
  }
  if (status === "done") {
    return (
      <span className="text-xs text-emerald-300" aria-hidden>
        ✓
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="text-xs text-rose-300" aria-hidden>
        ✕
      </span>
    );
  }
  return (
    <span
      className="inline-block size-2.5 rounded-full bg-white/20"
      aria-hidden
    />
  );
}

function logLineClass(level: DeployLogLine["level"]): string {
  if (level === "error") return "text-rose-200";
  if (level === "success") return "text-emerald-200";
  return "text-slate-300";
}

export function DeployProgressPanel() {
  const { t } = useI18n();
  const { deployProgress, isDeploying } = useWallet();
  const logEndRef = useRef<HTMLDivElement>(null);

  const visible =
    isDeploying ||
    deployProgress.status !== "idle" ||
    deployProgress.lines.length > 0;

  useEffect(() => {
    if (visible) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [deployProgress.lines.length, visible]);

  if (!visible) return null;

  const statusKey = statusLabelKey(deployProgress.status);
  const stepsById = new Map(deployProgress.steps.map((step) => [step.id, step]));

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t("contract.deployLog")}
        </p>
        {statusKey ? (
          <Badge tone={statusTone(deployProgress.status)}>
            {t(statusKey)}
          </Badge>
        ) : null}
      </div>

      <ol className="mb-3 space-y-1.5">
        {DEPLOY_STEP_ORDER.map((stepId) => {
          const step = stepsById.get(stepId);
          const status = step?.status ?? "pending";
          return (
            <li
              key={stepId}
              className={cx(
                "flex items-center gap-2 text-sm",
                status === "active" && "text-cyan-100",
                status === "done" && "text-slate-300",
                status === "failed" && "text-rose-200",
                status === "pending" && "text-slate-500",
              )}
            >
              <span className="flex w-4 shrink-0 justify-center">
                <StepIndicator status={status} />
              </span>
              <span>{t(STEP_LABEL_KEYS[stepId])}</span>
            </li>
          );
        })}
      </ol>

      {deployProgress.lines.length > 0 ? (
        <div className="max-h-40 overflow-y-auto rounded-lg bg-black/30 p-2 font-mono text-xs leading-relaxed ring-1 ring-inset ring-white/5">
          {deployProgress.lines.map((line, index) => (
            <div
              key={`${line.timestamp}-${index}`}
              className={cx("whitespace-pre-wrap break-words", logLineClass(line.level))}
            >
              <span className="text-slate-500">[{formatTime(line.timestamp)}]</span>{" "}
              {line.message}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      ) : null}
    </div>
  );
}
