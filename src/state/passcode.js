import { createContext, useContext } from "react";

const STORAGE_KEY = "mhi289a-week5-passcode";

// Session-only by design: the class passcode is a low-stakes shared secret
// (see design doc §5 — "the passcode will leak; assume it"), but it must
// never end up in the versioned localStorage state, backups, or the PDF.
export function loadPasscode() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function savePasscode(passcode) {
  try {
    sessionStorage.setItem(STORAGE_KEY, passcode);
  } catch {
    // sessionStorage unavailable (e.g. private browsing) — just won't persist across reloads
  }
}

export const PasscodeContext = createContext("");

export function usePasscode() {
  return useContext(PasscodeContext);
}
