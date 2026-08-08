/**
 * Local bookkeeping for the laboratory role.
 *
 * The on-chain researcher pk is `persistentHash("polaris:researcher:pk:v1", sk)`
 * computed inside the circuit — it cannot be recomputed in TypeScript. So we
 * remember the studies this browser published and learn the pk from the ledger
 * the first time one of them is read back.
 */

const STUDY_IDS_KEY = "polaris:lab:study-ids";
const RESEARCHER_PK_KEY = "polaris:lab:researcher-pk";

function readList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STUDY_IDS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function getLabStudyIdsHex(): string[] {
  return readList();
}

export function rememberLabStudy(studyIdHex: string): void {
  if (typeof window === "undefined" || !studyIdHex) return;
  const list = readList();
  if (list.includes(studyIdHex)) return;
  window.localStorage.setItem(
    STUDY_IDS_KEY,
    JSON.stringify([...list, studyIdHex]),
  );
}

export function getResearcherPkHex(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(RESEARCHER_PK_KEY);
}

export function rememberResearcherPk(pkHex: string): void {
  if (typeof window === "undefined" || !pkHex) return;
  window.localStorage.setItem(RESEARCHER_PK_KEY, pkHex);
}
