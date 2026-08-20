import { useEffect, useRef, useState } from 'react';
import type { DiffStats } from '../lib/types';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  DownloadIcon,
  FileCodeIcon,
  SearchIcon,
  CloseIcon,
} from './Icons';

interface StatsBarProps {
  stats: DiffStats | null;
  identical: boolean;
  timeMs?: number;
  totalChanges?: number;
  currentChangeIndex?: number | null;
  onNextChange?: () => void;
  onPrevChange?: () => void;
  onCopyPatch: () => void;
  onDownloadPatch: () => void;
  onCopyMarkdown?: () => void;
  onExportHtml?: () => void;
  patchReady: boolean;
  copied: boolean;
  copiedMarkdown?: boolean;
  searchOpen?: boolean;
  onToggleSearch?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export function StatsBar({
  stats,
  identical,
  timeMs,
  totalChanges = 0,
  currentChangeIndex = null,
  onNextChange,
  onPrevChange,
  onCopyPatch,
  onDownloadPatch,
  onCopyMarkdown,
  onExportHtml,
  patchReady,
  copied,
  copiedMarkdown = false,
  searchOpen = false,
  onToggleSearch,
  searchQuery = '',
  onSearchChange,
}: StatsBarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const onClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [exportOpen]);

  if (!stats) return null;

  if (identical) {
    return (
      <div className="statsbar statsbar--identical">
        <span className="statsbar__message">
          <CheckIcon size={16} /> No differences found — the texts are identical.
        </span>
        <span className="statsbar__lines">
          {stats.oldLines} lines · {stats.unchanged} unchanged
          {timeMs != null && ` · ${Math.round(timeMs)} ms`}
        </span>
      </div>
    );
  }

  const totalDiffLines = stats.added + stats.removed + stats.changed;
  const addPct = totalDiffLines > 0 ? (stats.added / totalDiffLines) * 100 : 0;
  const delPct = totalDiffLines > 0 ? (stats.removed / totalDiffLines) * 100 : 0;
  const modPct = totalDiffLines > 0 ? (stats.changed / totalDiffLines) * 100 : 0;

  return (
    <div className="statsbar-container">
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
            {timeMs != null && ` · ${Math.round(timeMs)} ms`}
          </span>
        </div>

        {totalChanges > 0 && onNextChange && onPrevChange && (
          <div className="statsbar__nav">
            {totalDiffLines > 0 && (
              <div
                className="diff-meter"
                title={`Differences: ${stats.added} added, ${stats.removed} removed, ${stats.changed} changed`}
                aria-hidden="true"
              >
                {stats.added > 0 && (
                  <div
                    className="diff-meter__segment diff-meter__segment--add"
                    style={{ width: `${addPct}%` }}
                  />
                )}
                {stats.removed > 0 && (
                  <div
                    className="diff-meter__segment diff-meter__segment--del"
                    style={{ width: `${delPct}%` }}
                  />
                )}
                {stats.changed > 0 && (
                  <div
                    className="diff-meter__segment diff-meter__segment--mod"
                    style={{ width: `${modPct}%` }}
                  />
                )}
              </div>
            )}

            <div className="diff-nav-group" role="group" aria-label="Change navigation">
              <span className="diff-nav-label">
                {currentChangeIndex != null
                  ? `${currentChangeIndex + 1} of ${totalChanges}`
                  : `${totalChanges} ${totalChanges === 1 ? 'change' : 'changes'}`}
              </span>
              <button
                type="button"
                className="btn btn--small btn--icon"
                onClick={onPrevChange}
                title="Previous difference (Alt+P or Alt+Up)"
                aria-label="Previous difference"
              >
                <ChevronUpIcon size={14} />
              </button>
              <button
                type="button"
                className="btn btn--small btn--icon"
                onClick={onNextChange}
                title="Next difference (Alt+N or Alt+Down)"
                aria-label="Next difference"
              >
                <ChevronDownIcon size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="statsbar__actions">
          <button
            type="button"
            className="btn btn--small"
            onClick={onCopyPatch}
            disabled={!patchReady}
            title="Copy patch to clipboard"
          >
            <CopyIcon size={14} />
            <span className="btn__label">{copied ? 'Copied!' : 'Copy patch'}</span>
          </button>

          <button
            type="button"
            className="btn btn--small"
            onClick={onDownloadPatch}
            disabled={!patchReady}
            title="Download .patch file"
          >
            <DownloadIcon size={14} />
            <span className="btn__label">Download .patch</span>
          </button>

          {onToggleSearch && (
            <button
              type="button"
              className={`btn btn--small ${searchOpen ? 'btn--primary' : ''}`}
              onClick={onToggleSearch}
              title="Search within diff (Ctrl+F)"
              aria-label="Find in diff"
            >
              <SearchIcon size={14} />
              <span className="btn__label">Find</span>
            </button>
          )}

          {(onCopyMarkdown || onExportHtml) && (
            <div className="dropdown-wrapper" ref={exportMenuRef}>
              <button
                type="button"
                className="btn btn--small"
                onClick={() => setExportOpen((o) => !o)}
                title="Export options (Markdown, HTML report)"
                aria-label="Export options"
                aria-expanded={exportOpen}
                aria-haspopup="menu"
              >
                <FileCodeIcon size={14} />
                <span className="btn__label">Export</span>
              </button>

              {exportOpen && (
                <div className="dropdown-menu dropdown-menu--right">
                  {onCopyMarkdown && (
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        onCopyMarkdown();
                        setExportOpen(false);
                      }}
                    >
                      <CopyIcon size={14} />
                      <span>{copiedMarkdown ? 'Copied Markdown!' : 'Copy as Markdown'}</span>
                    </button>
                  )}
                  {onExportHtml && (
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        onExportHtml();
                        setExportOpen(false);
                      }}
                    >
                      <DownloadIcon size={14} />
                      <span>Download HTML Report</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {searchOpen && onSearchChange && (
        <div className="diff-search-bar" role="search">
          <SearchIcon size={15} className="diff-search-icon" />
          <input
            type="text"
            className="diff-search-input"
            placeholder="Search text within differences..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search within diff"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="diff-search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <CloseIcon size={13} />
            </button>
          )}
          <button
            type="button"
            className="btn btn--small btn--ghost"
            onClick={onToggleSearch}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
