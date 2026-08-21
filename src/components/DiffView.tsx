import { memo, useMemo, useRef, useState, useEffect } from 'react';
import type { ThemedToken } from 'shiki';
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
  getTokens?: ((line: string) => ThemedToken[] | null) | null;
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

function SyntaxText({
  tokens,
  line,
  searchQuery,
}: {
  tokens: ThemedToken[] | null;
  line: string;
  searchQuery?: string;
}) {
  if (!tokens || tokens.length === 0) {
    return <>{highlightMatches(line, searchQuery)}</>;
  }
  return (
    <>
      {tokens.map((token, i) =>
        token.content ? (
          <span key={i} style={{ color: token.color }}>
            {highlightMatches(token.content, searchQuery)}
          </span>
        ) : null,
      )}
    </>
  );
}

const RowSide = memo(function RowSide({
  row,
  side,
  lineNumbers,
  searchQuery,
  onCopy,
  getTokens,
}: {
  row: DiffRow;
  side: 'old' | 'new';
  lineNumbers: boolean;
  searchQuery?: string;
  onCopy?: (text: string) => void;
  getTokens?: ((line: string) => ThemedToken[] | null) | null;
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
    navigator.clipboard
      ?.writeText(line)
      .then(() => {
        setCopied(true);
        onCopy?.('Copied line to clipboard');
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => onCopy?.('Clipboard permission denied'));
  };

  return (
    <>
      {lineNumbers && <span className="ln">{num}</span>}
      <span className="cell group-cell">
        <span className="cell__text">
          {spans ? (
            <SpanText spans={spans} searchQuery={searchQuery} />
          ) : getTokens ? (
            <SyntaxText
              tokens={getTokens(line)}
              line={line}
              searchQuery={searchQuery}
            />
          ) : null}
          {!spans && !getTokens && highlightMatches(line, searchQuery)}
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
  const gutterRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<
    { index: number; percent: number; kind: string }[]
  >([]);

  useEffect(() => {
    const gutter = gutterRef.current;
    if (!gutter) return;
    const scroller = gutter.parentElement;
    const content = scroller?.querySelector<HTMLElement>('.diff-rows-container') ?? null;

    const compute = () => {
      const total = rows.length;
      const viewH = gutter.clientHeight;
      const contentH = content?.scrollHeight ?? 0;
      if (total === 0 || viewH === 0 || contentH === 0) {
        setMarkers([]);
        return;
      }
      // Fraction of the gutter that actually contains rendered content
      const scale = Math.min(1, contentH / viewH);
      // bucket markers to avoid overlapping clutter on huge files
      const buckets = new Map<number, { index: number; kind: string }>();
      rows.forEach((row, i) => {
        if (row.kind !== 'equal' && row.kind !== 'gap') {
          const bucket = Math.floor((i / Math.max(1, total)) * 200);
          if (!buckets.has(bucket)) {
            buckets.set(bucket, { index: i, kind: row.kind as string });
          }
        }
      });
      const list: { index: number; percent: number; kind: string }[] = [];
      for (const [bucket, v] of buckets) {
        list.push({
          index: v.index,
          percent: (bucket / 200) * scale * 100,
          kind: v.kind,
        });
      }
      setMarkers(list);
    };

    compute();
    const ro = new ResizeObserver(compute);
    if (content) ro.observe(content);
    return () => ro.disconnect();
  }, [rows]);

  const hasChanges = useMemo(
    () => rows.some((r) => r.kind !== 'equal' && r.kind !== 'gap'),
    [rows],
  );

  if (!hasChanges) return null;

  const handleGutterClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const pct = y / rect.height;
    const contentH =
      e.currentTarget.parentElement?.querySelector<HTMLElement>(
        '.diff-rows-container',
      )?.scrollHeight ?? 0;
    const scale = contentH > 0 ? Math.min(1, contentH / rect.height) : 1;
    const targetIndex = Math.max(
      0,
      Math.min(rows.length - 1, Math.floor((pct / scale) * rows.length)),
    );
    // find nearest diff marker
    let nearest = markers[0]?.index ?? 0;
    let best = Infinity;
    for (const m of markers) {
      const d = Math.abs(m.index - targetIndex);
      if (d < best) {
        best = d;
        nearest = m.index;
      }
    }
    onJumpToRow(nearest);
  };

  return (
    <div
      ref={gutterRef}
      className="diff-minimap"
      aria-hidden="true"
      title="Difference minimap — click to jump to nearest change"
      onClick={handleGutterClick}
    >
      {markers.map((m) => (
        <div
          key={m.index}
          className={`minimap-marker minimap-marker--${m.kind}`}
          style={{ top: `${m.percent}%` }}
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
  getTokens,
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
                  getTokens={getTokens}
                />
                <RowSide
                  row={row}
                  side="new"
                  lineNumbers={lineNumbers}
                  searchQuery={searchQuery}
                  onCopy={onCopyNotice}
                  getTokens={getTokens}
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
  getTokens,
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
    const el =
      document.getElementById(`diff-row-inline-p${rowIndex}-0`) ??
      document.getElementById(`diff-row-inline-p${rowIndex}-1`) ??
      document.getElementById(`diff-row-inline-p${rowIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCopyLine = (text: string, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopiedIdx(idx);
        onCopyNotice?.('Copied line to clipboard');
        setTimeout(() => setCopiedIdx(null), 1500);
      })
      .catch(() => onCopyNotice?.('Clipboard permission denied'));
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
          {expandedRows.map(({ row, sign, parentRowIndex, subIndex }, i) => {
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
                id={`diff-row-inline-p${parentRowIndex}-${subIndex}`}
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
                    ) : getTokens && line != null ? (
                      <SyntaxText
                        tokens={getTokens(line)}
                        line={line}
                        searchQuery={searchQuery}
                      />
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
      if (props.viewMode === 'side-by-side') {
        const el = document.getElementById(
          `diff-row-side-${props.activeChangeRowIndex}`,
        );
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // inline modified rows have two sub-rows; prefer the '-' then '+'
        const el0 = document.getElementById(
          `diff-row-inline-p${props.activeChangeRowIndex}-0`,
        );
        const el = el0 ?? document.getElementById(`diff-row-inline-p${props.activeChangeRowIndex}-1`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [props.activeChangeRowIndex, props.viewMode]);

  return props.viewMode === 'side-by-side' ? (
    <SideBySide {...props} />
  ) : (
    <InlineView {...props} />
  );
}
