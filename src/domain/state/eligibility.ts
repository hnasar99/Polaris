export type EligibilityState =
  | "idle"
  | "checking"
  | "eligible"
  | "not_eligible"
  | "error";

export type EligibilityAction =
  | { type: "RESET" }
  | { type: "CHECK_STARTED" }
  | { type: "CHECK_ELIGIBLE"; proofReference: string; transactionId: string }
  | { type: "CHECK_NOT_ELIGIBLE"; proofReference: string; transactionId: string }
  | { type: "CHECK_FAILED"; errorCode: string; message: string };

export interface EligibilityMachineState {
  status: EligibilityState;
  proofReference: string | null;
  transactionId: string | null;
  errorCode: string | null;
  message: string | null;
}

export const initialEligibilityState: EligibilityMachineState = {
  status: "idle",
  proofReference: null,
  transactionId: null,
  errorCode: null,
  message: null,
};

export function eligibilityReducer(
  state: EligibilityMachineState,
  action: EligibilityAction,
): EligibilityMachineState {
  switch (action.type) {
    case "RESET":
      return initialEligibilityState;
    case "CHECK_STARTED":
      return {
        ...initialEligibilityState,
        status: "checking",
      };
    case "CHECK_ELIGIBLE":
      return {
        status: "eligible",
        proofReference: action.proofReference,
        transactionId: action.transactionId,
        errorCode: null,
        message: null,
      };
    case "CHECK_NOT_ELIGIBLE":
      return {
        status: "not_eligible",
        proofReference: action.proofReference,
        transactionId: action.transactionId,
        errorCode: "PATIENT_NOT_ELIGIBLE",
        message: "Patient does not meet study criteria.",
      };
    case "CHECK_FAILED":
      return {
        status: "error",
        proofReference: null,
        transactionId: null,
        errorCode: action.errorCode,
        message: action.message,
      };
    default:
      return state;
  }
}
