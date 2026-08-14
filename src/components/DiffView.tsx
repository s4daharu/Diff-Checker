import { memo, useMemo, useRef, useState, useEffect } from 'react';
import type { DiffRow, Span, ViewMode } from '../lib/types';
import {
  CopyIcon,
  CheckIcon,
  ExpandAllIcon,
  ExpandDownIcon,
  ExpandUpIcon,
} from './Icons';

interface DiffViewProps {
  rows: DiffRow[];
  viewMode: ViewMode;
  wrap: boolean;
  lineNumbers: boolean;
  searchQuery?: string;
  activeChangeRowIndex?: number | null;
  onExpandGap?: (startRow: number, endRow: number, count: number) => void;
  onCopyNotice?: (msg: string) => void;
}

function highlightMatches(text: string, query?: string) {
  if (!query || !query.trim() || !text) return text;
  const q = query.trim();
  const lowerText = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  if (!lowerText.includes(lowerQ)) return text;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let idx = lowerText.indexOf(lowerQ);

  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push(text.slice(lastIndex, idx));
    }
    parts.push(
      <mark key={`${idx}-${parts.length}`} className="search-match">
        {text.slice(idx, idx + q.length)}
      </mark>,
    );
    lastIndex = idx + q.length;
    idx = lowerText.indexOf(lowerQ, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

function SpanText({
  spans,
  searchQuery,
}: {
  spans?: Span[];
  searchQuery?: string;
}) {
  if (!spans) return null;
  return (
    <>
      {spans.map((span, i) => (
        <span
          key={i}
          className={
            span.added ? 'hl hl--add' : span.removed ? 'hl hl--del' : undefined
          }
        >
          {highlightMatches(span.text, searchQuery)}
        </span>
      ))}
    </>
  );
}

const RowSide = memo(function RowSide({
  row,
  side,
  lineNumbers,
  searchQuery,
  onCopy,
}: {
  row: DiffRow;
  side: 'old' | 'new';
  lineNumbers: boolean;
  searchQuery?: string;
  onCopy?: (text: string) => void;
}) {
  const isOld = side === 'old';
  const line = isOld ? row.oldLine : row.newLine;
  const num = isOld ? row.oldNum : row.newNum;
  const spans = isOld ? row.oldSpans : row.newSpans;
  const [copied, setCopied] = useState(false);

  if (line === null) {
    return (
      <>
        {lineNumbers && <span className="ln" />}
        <span className="cell cell--empty" />
      </>
    );
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(line).then(() => {
      setCopied(true);
      onCopy?.('Copied line to clipboard');
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <>
      {lineNumbers && <span className="ln">{num}</span>}
      <span className="cell group-cell">
        <span className="cell__text">
          {spans ? (
            <SpanText spans={spans} searchQuery={searchQuery} />
          ) : (
            highlightMatches(line, searchQuery)
          )}
        </span>
        <button
          type="button"
          className={`cell-copy-btn ${copied ? 'cell-copy-btn--copied' : ''}`}
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy this line'}
          aria-label="Copy line"
        >
          {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
        </button>
      </span>
    </>
  );
});

function GapRow({
  row,
  onExpandGap,
}: {
  row: DiffRow;
  onExpandGap?: (start: number, end: number, count: number) => void;
}) {
  const hasRange = row.gapStartRow != null && row.gapEndRow != null;
  const skipped =
    row.skipped ??
    (hasRange ? row.gapEndRow! - row.gapStartRow! + 1 : undefined);

  return (
    <div className="diff-row diff-row--gap" role="row">
      <div className="gap-content">
        {hasRange && onExpandGap && (
          <button
            type="button"
            className="gap-btn"
            title="Expand 10 lines above"
            onClick={() =>
              onExpandGap(
                row.gapStartRow!,
                Math.min(row.gapEndRow!, row.gapStartRow! + 9),
                10,
              )
            }
          >
            <ExpandUpIcon size={13} />
            <span>+10 above</span>
          </button>
        )}
        <span className="gap-label">
          <span className="gap-dots">…</span>
          {skipped != null ? ` ${skipped} lines hidden ` : ' lines hidden '}
          <span className="gap-dots">…</span>
        </span>
        {hasRange && onExpandGap && (
          <>
            <button
              type="button"
              className="gap-btn gap-btn--all"
              title={`Expand all ${skipped ?? ''} hidden lines`}
              onClick={() =>
                onExpandGap(
                  row.gapStartRow!,
                  row.gapEndRow!,
                  skipped ?? row.gapEndRow! - row.gapStartRow! + 1,
                )
              }
            >
              <ExpandAllIcon size={13} />
              <span>Expand all</span>
            </button>
            <button
              type="button"
              className="gap-btn"
              title="Expand 10 lines below"
              onClick={() =>
                onExpandGap(
                  Math.max(row.gapStartRow!, row.gapEndRow! - 9),
                  row.gapEndRow!,
                  10,
                )
              }
            >
              <ExpandDownIcon size={13} />
              <span>+10 below</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MinimapGutter({
  rows,
  onJumpToRow,
}: {
  rows: DiffRow[];
  onJumpToRow: (rowIndex: number) => void;
}) {
  const markers = useMemo(() => {
    const total = rows.length;
    if (total === 0) return [];
    const list: { index: number; percent: number; kind: string }[] = [];
    rows.forEach((row, i) => {
      if (row.kind !== 'equal' && row.kind !== 'gap') {
        list.push({
          index: i,
          percent: (i / Math.max(1, total - 1)) * 100,
          kind: row.kind,
        });
      }
    });
    return list;
  }, [rows]);

  if (markers.length === 0) return null;

  return (
    <div className="diff-minimap" aria-hidden="true" title="Difference minimap — click to jump">
      {markers.map((m) => (
        <div
          key={m.index}
          className={`minimap-marker minimap-marker--${m.kind}`}
          style={{ top: `${m.percent}%` }}
          onClick={() => onJumpToRow(m.index)}
        />
      ))}
    </div>
  );
}

function SideBySide({
  rows,
  wrap,
  lineNumbers,
  searchQuery,
  activeChangeRowIndex,
  onExpandGap,
  onCopyNotice,
}: DiffViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const jumpToRow = (rowIndex: number) => {
    const el = document.getElementById(`diff-row-side-${rowIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div
      className={`diff-view diff-view--side${lineNumbers ? '' : ' no-line-nums'}`}
    >
      <div className="diff-col-head">
        {lineNumbers && <span className="ln ln--head" />}
        <span className="col-title col-title--old">Original</span>
        {lineNumbers && <span className="ln ln--head" />}
        <span className="col-title col-title--new">Changed</span>
      </div>
      <div
        ref={scrollRef}
        className={`diff-scroll ${wrap ? 'diff-scroll--wrap' : ''}`}
      >
        <div className="diff-rows-container">
          {rows.map((row, i) =>
            row.kind === 'gap' ? (
              <GapRow key={i} row={row} onExpandGap={onExpandGap} />
            ) : (
              <div
                id={`diff-row-side-${i}`}
                key={i}
                className={`diff-row diff-row--${row.kind} ${
                  activeChangeRowIndex === i ? 'diff-row--active' : ''
                }`}
              >
                <RowSide
                  row={row}
                  side="old"
                  lineNumbers={lineNumbers}
                  searchQuery={searchQuery}
                  onCopy={onCopyNotice}
                />
                <RowSide
                  row={row}
                  side="new"
                  lineNumbers={lineNumbers}
                  searchQuery={searchQuery}
                  onCopy={onCopyNotice}
                />
              </div>
            ),
          )}
        </div>
        <MinimapGutter rows={rows} onJumpToRow={jumpToRow} />
      </div>
    </div>
  );
}

function InlineView({
  rows,
  wrap,
  lineNumbers,
  searchQuery,
  activeChangeRowIndex,
  onExpandGap,
  onCopyNotice,
}: DiffViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const expandedRows = useMemo(() => {
    const res: {
      row: DiffRow;
      sign: string;
      subIndex: number;
      parentRowIndex: number;
    }[] = [];
    rows.forEach((row, parentIndex) => {
      if (row.kind === 'modified') {
        res.push({
          row,
          sign: '-',
          subIndex: 0,
          parentRowIndex: parentIndex,
        });
        res.push({
          row,
          sign: '+',
          subIndex: 1,
          parentRowIndex: parentIndex,
        });
      } else {
        res.push({
          row,
          sign:
            row.kind === 'added'
              ? '+'
              : row.kind === 'deleted'
                ? '-'
                : '',
          subIndex: 0,
          parentRowIndex: parentIndex,
        });
      }
    });
    return res;
  }, [rows]);

  const jumpToRow = (rowIndex: number) => {
    const el = document.getElementById(`diff-row-inline-p${rowIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCopyLine = (text: string, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedIdx(idx);
      onCopyNotice?.('Copied line to clipboard');
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  return (
    <div
      className={`diff-view diff-view--inline${lineNumbers ? '' : ' no-line-nums'}`}
    >
      <div className="diff-col-head diff-col-head--inline">
        {lineNumbers && <span className="ln ln--head" title="Original line #" />}
        {lineNumbers && <span className="ln ln--head" title="Changed line #" />}
        <span className="sign sign--head" />
        <span className="col-title col-title--unified">Unified diff</span>
      </div>
      <div
        ref={scrollRef}
        className={`diff-scroll ${wrap ? 'diff-scroll--wrap' : ''}`}
      >
        <div className="diff-rows-container">
          {expandedRows.map(({ row, sign, parentRowIndex }, i) => {
            if (row.kind === 'gap') {
              return (
                <GapRow key={i} row={row} onExpandGap={onExpandGap} />
              );
            }
            const oldNum =
              sign === '+' ? null : row.oldNum;
            const newNum =
              sign === '-' ? null : row.newNum;
            const line = sign === '+' ? row.newLine : row.oldLine;
            const spans = sign === '+' ? row.newSpans : row.oldSpans;
            const kind =
              row.kind === 'modified'
                ? sign === '+'
                  ? 'added'
                  : 'deleted'
                : row.kind;

            const isCopied = copiedIdx === i;

            return (
              <div
                id={`diff-row-inline-p${parentRowIndex}`}
                key={i}
                className={`diff-row diff-row--${kind} ${
                  activeChangeRowIndex === parentRowIndex
                    ? 'diff-row--active'
                    : ''
                }`}
              >
                {lineNumbers && (
                  <span className="ln ln--old">{oldNum ?? ''}</span>
                )}
                {lineNumbers && (
                  <span className="ln ln--new">{newNum ?? ''}</span>
                )}
                <span
                  className={`sign ${
                    sign === '+'
                      ? 'sign--added'
                      : sign === '-'
                        ? 'sign--deleted'
                        : 'sign--equal'
                  }`}
                >
                  {sign}
                </span>
                <span className="cell group-cell">
                  <span className="cell__text">
                    {spans && sign !== '' ? (
                      <SpanText spans={spans} searchQuery={searchQuery} />
                    ) : (
                      highlightMatches(line ?? '', searchQuery)
                    )}
                  </span>
                  {line != null && (
                    <button
                      type="button"
                      className={`cell-copy-btn ${
                        isCopied ? 'cell-copy-btn--copied' : ''
                      }`}
                      onClick={(e) => handleCopyLine(line, i, e)}
                      title={isCopied ? 'Copied!' : 'Copy this line'}
                      aria-label="Copy line"
                    >
                      {isCopied ? (
                        <CheckIcon size={12} />
                      ) : (
                        <CopyIcon size={12} />
                      )}
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <MinimapGutter rows={rows} onJumpToRow={jumpToRow} />
      </div>
    </div>
  );
}

export function DiffView(props: DiffViewProps) {
  useEffect(() => {
    if (props.activeChangeRowIndex != null) {
      const prefix =
        props.viewMode === 'side-by-side'
          ? 'diff-row-side-'
          : 'diff-row-inline-p';
      const el = document.getElementById(
        `${prefix}${props.activeChangeRowIndex}`,
      );
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [props.activeChangeRowIndex, props.viewMode]);

  return props.viewMode === 'side-by-side' ? (
    <SideBySide {...props} />
  ) : (
    <InlineView {...props} />
  );
}
