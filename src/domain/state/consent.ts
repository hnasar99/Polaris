export type ConsentState =
  | "none"
  | "pending"
  | "active"
  | "revoked"
  | "expired"
  | "error";

export type ConsentAction =
  | { type: "RESET" }
  | { type: "GRANT_STARTED" }
  | { type: "GRANT_SUCCEEDED"; transactionId: string }
  | { type: "GRANT_FAILED"; errorCode: string; message: string }
  | { type: "REVOKE_STARTED" }
  | { type: "REVOKE_SUCCEEDED"; transactionId: string }
  | { type: "REVOKE_FAILED"; errorCode: string; message: string }
  | { type: "MARK_EXPIRED" };

export interface ConsentMachineState {
  status: ConsentState;
  transactionId: string | null;
  errorCode: string | null;
  message: string | null;
}

export const initialConsentState: ConsentMachineState = {
  status: "none",
  transactionId: null,
  errorCode: null,
  message: null,
};

export function consentReducer(
  state: ConsentMachineState,
  action: ConsentAction,
): ConsentMachineState {
  switch (action.type) {
    case "RESET":
      return initialConsentState;
    case "GRANT_STARTED":
      return {
        ...state,
        status: "pending",
        errorCode: null,
        message: null,
      };
    case "GRANT_SUCCEEDED":
      return {
        status: "active",
        transactionId: action.transactionId,
        errorCode: null,
        message: null,
      };
    case "GRANT_FAILED":
      return {
        ...state,
        status: "error",
        errorCode: action.errorCode,
        message: action.message,
      };
    case "REVOKE_STARTED":
      return {
        ...state,
        status: "pending",
        errorCode: null,
        message: null,
      };
    case "REVOKE_SUCCEEDED":
      return {
        status: "revoked",
        transactionId: action.transactionId,
        errorCode: null,
        message: null,
      };
    case "REVOKE_FAILED":
      return {
        ...state,
        status: "error",
        errorCode: action.errorCode,
        message: action.message,
      };
    case "MARK_EXPIRED":
      return {
        ...state,
        status: "expired",
        errorCode: "CONSENT_EXPIRED",
        message: "Consent has expired.",
      };
    default:
      return state;
  }
}
