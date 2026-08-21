import { useEffect, useRef, useState } from 'react';
import type { ViewMode } from '../lib/types';
import {
  CloseIcon,
  CopyIcon,
  DownloadIcon,
  FileCodeIcon,
  HashIcon,
  SearchIcon,
  WrapTextIcon,
} from './Icons';

interface DiffToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  wrap: boolean;
  onWrapChange: (wrap: boolean) => void;
  lineNumbers: boolean;
  onLineNumbersChange: (show: boolean) => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCopyPatch: () => void;
  onDownloadPatch: () => void;
  onCopyMarkdown: () => void;
  onExportHtml: () => void;
  patchReady: boolean;
  copied: boolean;
  copiedMarkdown: boolean;
}

export function DiffToolbar({
  viewMode,
  onViewModeChange,
  wrap,
  onWrapChange,
  lineNumbers,
  onLineNumbersChange,
  searchOpen,
  onToggleSearch,
  searchQuery,
  onSearchChange,
  onCopyPatch,
  onDownloadPatch,
  onCopyMarkdown,
  onExportHtml,
  patchReady,
  copied,
  copiedMarkdown,
}: DiffToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target as Node)
      ) {
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

  return (
    <>
      <div className="diff-toolbar">
        <div
          className="segmented"
          role="tablist"
          aria-label="View mode"
          onKeyDown={(e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            e.preventDefault();
            onViewModeChange(
              viewMode === 'side-by-side' ? 'inline' : 'side-by-side',
            );
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'side-by-side'}
            className={`segmented__btn ${viewMode === 'side-by-side' ? 'segmented__btn--active' : ''}`}
            onClick={() => onViewModeChange('side-by-side')}
          >
            Side by side
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'inline'}
            className={`segmented__btn ${viewMode === 'inline' ? 'segmented__btn--active' : ''}`}
            onClick={() => onViewModeChange('inline')}
          >
            Inline
          </button>
        </div>

        <div className="diff-toolbar__group">
          <button
            type="button"
            className="btn btn--small btn--toggle"
            aria-pressed={wrap}
            onClick={() => onWrapChange(!wrap)}
            title="Wrap long lines instead of scrolling horizontally"
            aria-label="Wrap lines"
          >
            <WrapTextIcon size={14} />
            <span className="btn__label">Wrap</span>
          </button>
          <button
            type="button"
            className="btn btn--small btn--toggle"
            aria-pressed={lineNumbers}
            onClick={() => onLineNumbersChange(!lineNumbers)}
            title="Show or hide line numbers"
            aria-label="Line numbers"
          >
            <HashIcon size={14} />
            <span className="btn__label">Numbers</span>
          </button>
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
        </div>

        <div className="diff-toolbar__spacer" />

        <div className="dropdown-wrapper" ref={exportMenuRef}>
          <button
            type="button"
            className="btn btn--small"
            onClick={() => setExportOpen((o) => !o)}
            title="Export the diff (patch, Markdown, HTML report)"
            aria-label="Export options"
            aria-expanded={exportOpen}
            aria-haspopup="menu"
          >
            <FileCodeIcon size={14} />
            <span className="btn__label">Export</span>
          </button>

          {exportOpen && (
            <div className="dropdown-menu dropdown-menu--right">
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  onCopyPatch();
                  setExportOpen(false);
                }}
                disabled={!patchReady}
              >
                <CopyIcon size={14} />
                <span>{copied ? 'Copied!' : 'Copy patch'}</span>
              </button>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  onDownloadPatch();
                  setExportOpen(false);
                }}
                disabled={!patchReady}
              >
                <DownloadIcon size={14} />
                <span>Download .patch</span>
              </button>
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
            </div>
          )}
        </div>
      </div>

      {searchOpen && (
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
    </>
  );
}
