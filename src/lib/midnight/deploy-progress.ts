/**
 * Deploy progress tracking for admin contract deployment.
 * Emits step + log events consumed by WalletProvider / DeployProgressPanel.
 */

export type DeployStepId =
  | "session"
  | "bindings"
  | "createTx"
  | "submit"
  | "persist"
  | "saveAddress";

export type DeployStepStatus = "pending" | "active" | "done" | "failed";

export type DeployStepState = {
  id: DeployStepId;
  status: DeployStepStatus;
};

export type DeployLogLevel = "info" | "error" | "success";

export type DeployLogLine = {
  timestamp: number;
  level: DeployLogLevel;
  message: string;
};

export type DeployProgressStatus = "idle" | "running" | "success" | "failed";

export type DeployProgressState = {
  steps: DeployStepState[];
  lines: DeployLogLine[];
  status: DeployProgressStatus;
};

export type DeployProgressEvent =
  | { type: "step_start"; step: DeployStepId; message?: string }
  | { type: "step_done"; step: DeployStepId; message?: string }
  | { type: "step_failed"; step: DeployStepId; message: string }
  | { type: "log"; level: DeployLogLevel; message: string };

export type DeployProgressCallback = (event: DeployProgressEvent) => void;

export const DEPLOY_STEP_ORDER: DeployStepId[] = [
  "session",
  "bindings",
  "createTx",
  "submit",
  "persist",
  "saveAddress",
];

export function createInitialDeployProgress(
  status: DeployProgressStatus = "idle",
): DeployProgressState {
  return {
    steps: DEPLOY_STEP_ORDER.map((id) => ({ id, status: "pending" as const })),
    lines: [],
    status,
  };
}

function appendLog(
  lines: DeployLogLine[],
  level: DeployLogLevel,
  message: string,
): DeployLogLine[] {
  return [...lines, { timestamp: Date.now(), level, message }];
}

function setStepStatus(
  steps: DeployStepState[],
  stepId: DeployStepId,
  status: DeployStepStatus,
): DeployStepState[] {
  return steps.map((step) =>
    step.id === stepId ? { ...step, status } : step,
  );
}

export function reduceDeployProgress(
  state: DeployProgressState,
  event: DeployProgressEvent,
): DeployProgressState {
  switch (event.type) {
    case "step_start":
      return {
        ...state,
        status: "running",
        steps: setStepStatus(state.steps, event.step, "active"),
        lines: event.message
          ? appendLog(state.lines, "info", event.message)
          : state.lines,
      };
    case "step_done":
      return {
        ...state,
        steps: setStepStatus(state.steps, event.step, "done"),
        lines: event.message
          ? appendLog(state.lines, "info", event.message)
          : state.lines,
      };
    case "step_failed":
      return {
        ...state,
        status: "failed",
        steps: setStepStatus(state.steps, event.step, "failed"),
        lines: appendLog(state.lines, "error", event.message),
      };
    case "log":
      return {
        ...state,
        lines: appendLog(state.lines, event.level, event.message),
      };
    default:
      return state;
  }
}

export function createDeployProgressTracker(onProgress: DeployProgressCallback) {
  return {
    start(step: DeployStepId, message?: string) {
      onProgress({ type: "step_start", step, message });
    },
    done(step: DeployStepId, message?: string) {
      onProgress({ type: "step_done", step, message });
    },
    fail(step: DeployStepId, message: string) {
      onProgress({ type: "step_failed", step, message });
    },
    log(level: DeployLogLevel, message: string) {
      onProgress({ type: "log", level, message });
    },
    async run<T>(
      step: DeployStepId,
      fn: () => Promise<T> | T,
      startMessage?: string,
      doneMessage?: string,
    ): Promise<T> {
      this.start(step, startMessage);
      try {
        const result = await fn();
        this.done(step, doneMessage);
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        this.fail(step, message);
        throw error;
      }
    },
  };
}
