import type { DiffStats } from '../lib/types';
import { CheckIcon, CopyIcon, DownloadIcon } from './Icons';

interface StatsBarProps {
  stats: DiffStats | null;
  identical: boolean;
  onCopyPatch: () => void;
  onDownloadPatch: () => void;
  patchReady: boolean;
  copied: boolean;
}

export function StatsBar({
  stats,
  identical,
  onCopyPatch,
  onDownloadPatch,
  patchReady,
  copied,
}: StatsBarProps) {
  if (!stats) return null;

  if (identical) {
    return (
      <div className="statsbar statsbar--identical">
        <span className="statsbar__message">
          <CheckIcon size={16} /> No differences found — the texts are identical.
        </span>
        <span className="statsbar__lines">
          {stats.oldLines} lines · {stats.unchanged} unchanged
        </span>
      </div>
    );
  }

  return (
    <div className="statsbar">
      <div className="statsbar__counts">
        <span className="pill pill--added" title="Lines present only in the changed text">
          {stats.added} added
        </span>
        <span className="pill pill--removed" title="Lines present only in the original text">
          {stats.removed} removed
        </span>
        <span className="pill pill--changed" title="Lines modified in place">
          {stats.changed} changed
        </span>
        <span className="pill pill--unchanged" title="Lines that are the same in both texts">
          {stats.unchanged} unchanged
        </span>
        <span className="statsbar__sizes">
          {stats.oldLines} → {stats.newLines} lines
        </span>
      </div>
      <div className="statsbar__actions">
        <button
          type="button"
          className="btn btn--small"
          onClick={onCopyPatch}
          disabled={!patchReady}
        >
          <CopyIcon size={14} />
          <span className="btn__label">{copied ? 'Copied!' : 'Copy patch'}</span>
        </button>
        <button
          type="button"
          className="btn btn--small"
          onClick={onDownloadPatch}
          disabled={!patchReady}
        >
          <DownloadIcon size={14} />
          <span className="btn__label">Download .patch</span>
        </button>
      </div>
    </div>
  );
}
