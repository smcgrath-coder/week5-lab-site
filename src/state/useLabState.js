import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  addLab3Attempt,
  appendMessage,
  createInitialState,
  deserialize,
  exportBackup as exportBackupState,
  serialize,
  setStudent,
  startConversation,
  updateLab,
  updateLab3Attempt,
} from "./labState";

const STORAGE_KEY = "mhi289a-week5-v1";
const SAVE_DEBOUNCE_MS = 500;

function loadInitialState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialState();
  return deserialize(raw) ?? createInitialState();
}

function reducer(state, updater) {
  return updater(state);
}

export function useLabState() {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);
  const timeoutRef = useRef(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, serialize(state));
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeoutRef.current);
  }, [state]);

  return {
    state,
    setStudent: useCallback((patch) => dispatch((s) => setStudent(s, patch)), []),
    updateLab: useCallback((labId, patch) => dispatch((s) => updateLab(s, labId, patch)), []),
    addLab3Attempt: useCallback(() => dispatch((s) => addLab3Attempt(s)), []),
    updateLab3Attempt: useCallback(
      (index, patch) => dispatch((s) => updateLab3Attempt(s, index, patch)),
      []
    ),
    startConversation: useCallback(
      (path, model) => dispatch((s) => startConversation(s, path, model)),
      []
    ),
    appendMessage: useCallback((path, message) => dispatch((s) => appendMessage(s, path, message)), []),
    restoreState: useCallback((nextState) => dispatch(() => nextState), []),
    exportBackup: useCallback(() => exportBackupState(state), [state]),
  };
}
