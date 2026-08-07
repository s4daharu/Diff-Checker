/// <reference lib="webworker" />
import { computeDiff, buildUnifiedPatch } from './lib/diffEngine';
import type { DiffOptions, DiffResult } from './lib/types';

interface DiffRequest {
  id: number;
  oldText: string;
  newText: string;
  options: DiffOptions;
  oldName?: string;
  newName?: string;
}

interface DiffResponse {
  id: number;
  ok: boolean;
  result?: DiffResult;
  patch?: string;
  error?: string;
}

self.onmessage = (e: MessageEvent<DiffRequest>) => {
  const { id, oldText, newText, options, oldName, newName } = e.data;
  try {
    const result = computeDiff(oldText, newText, options);
    if (result.aborted) {
      self.postMessage({ id, ok: true, result } satisfies DiffResponse);
      return;
    }
    const patch = buildUnifiedPatch(result.rows, options.context, oldName, newName);
    self.postMessage({ id, ok: true, result, patch } satisfies DiffResponse);
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    } satisfies DiffResponse);
  }
};
