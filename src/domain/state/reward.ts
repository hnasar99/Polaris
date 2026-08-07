export type RewardState =
  | "unavailable"
  | "available"
  | "claiming"
  | "claimed"
  | "error";

export type RewardAction =
  | { type: "RESET" }
  | { type: "MAKE_AVAILABLE" }
  | { type: "CLAIM_STARTED" }
  | { type: "CLAIM_SUCCEEDED"; transactionId: string }
  | { type: "CLAIM_FAILED"; errorCode: string; message: string };

export interface RewardMachineState {
  status: RewardState;
  transactionId: string | null;
  errorCode: string | null;
  message: string | null;
}

export const initialRewardState: RewardMachineState = {
  status: "unavailable",
  transactionId: null,
  errorCode: null,
  message: null,
};

export function rewardReducer(
  state: RewardMachineState,
  action: RewardAction,
): RewardMachineState {
  switch (action.type) {
    case "RESET":
      return initialRewardState;
    case "MAKE_AVAILABLE":
      return {
        status: "available",
        transactionId: null,
        errorCode: null,
        message: null,
      };
    case "CLAIM_STARTED":
      return {
        ...state,
        status: "claiming",
        errorCode: null,
        message: null,
      };
    case "CLAIM_SUCCEEDED":
      return {
        status: "claimed",
        transactionId: action.transactionId,
        errorCode: null,
        message: null,
      };
    case "CLAIM_FAILED":
      return {
        ...state,
        status: "error",
        errorCode: action.errorCode,
        message: action.message,
      };
    default:
      return state;
  }
}
