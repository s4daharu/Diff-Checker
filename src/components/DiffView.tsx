import { memo } from 'react';
import type { DiffRow, Span, ViewMode } from '../lib/types';

interface DiffViewProps {
  rows: DiffRow[];
  viewMode: ViewMode;
  wrap: boolean;
  lineNumbers: boolean;
}

function SpanText({ spans }: { spans?: Span[] }) {
  if (!spans) return null;
  return (
    <>
      {spans.map((span, i) => (
        <span
          key={i}
          className={span.added ? 'hl hl--add' : span.removed ? 'hl hl--del' : undefined}
        >
          {span.text}
        </span>
      ))}
    </>
  );
}

const RowSide = memo(function RowSide({
  row,
  side,
  lineNumbers,
}: {
  row: DiffRow;
  side: 'old' | 'new';
  lineNumbers: boolean;
}) {
  const isOld = side === 'old';
  const line = isOld ? row.oldLine : row.newLine;
  const num = isOld ? row.oldNum : row.newNum;
  const spans = isOld ? row.oldSpans : row.newSpans;

  if (line === null) {
    return (
      <>
        {lineNumbers && <span className="ln" />}
        <span className="cell cell--empty" />
      </>
    );
  }

  return (
    <>
      {lineNumbers && <span className="ln">{num}</span>}
      <span className="cell">
        {spans ? <SpanText spans={spans} /> : line}
      </span>
    </>
  );
});

function GapRow({ row }: { row: DiffRow }) {
  return (
    <div className="diff-row diff-row--gap" aria-hidden="true">
      <span className="gap-dots">…</span>
      {row.skipped != null && <span className="gap-count">{row.skipped} lines hidden</span>}
    </div>
  );
}

function SideBySide({ rows, wrap, lineNumbers }: DiffViewProps) {
  return (
    <div className={`diff-view diff-view--side${lineNumbers ? '' : ' no-line-nums'}`}>
      <div className="diff-col-head">
        {lineNumbers && <span className="ln ln--head" />}
        <span className="col-title col-title--old">Original</span>
        {lineNumbers && <span className="ln ln--head" />}
        <span className="col-title col-title--new">Changed</span>
      </div>
      <div className={`diff-scroll ${wrap ? 'diff-scroll--wrap' : ''}`}>
        {rows.map((row, i) =>
          row.kind === 'gap' ? (
            <GapRow key={i} row={row} />
          ) : (
            <div key={i} className={`diff-row diff-row--${row.kind}`}>
              <RowSide row={row} side="old" lineNumbers={lineNumbers} />
              <RowSide row={row} side="new" lineNumbers={lineNumbers} />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function InlineView({ rows, wrap, lineNumbers }: DiffViewProps) {
  const expandedRows: { row: DiffRow; sign: string }[] = [];
  for (const row of rows) {
    if (row.kind === 'modified') {
      expandedRows.push({ row, sign: '-' });
      expandedRows.push({ row, sign: '+' });
    } else {
      expandedRows.push({ row, sign: row.kind === 'added' ? '+' : row.kind === 'deleted' ? '-' : '' });
    }
  }

  return (
    <div className={`diff-view diff-view--inline${lineNumbers ? '' : ' no-line-nums'}`}>
      <div className="diff-col-head diff-col-head--inline">
        {lineNumbers && <span className="ln ln--head" />}
        <span className="ln ln--head" />
        <span className="col-title col-title--unified">Unified diff</span>
      </div>
      <div className={`diff-scroll ${wrap ? 'diff-scroll--wrap' : ''}`}>
        {expandedRows.map(({ row, sign }, i) => {
          if (row.kind === 'gap') {
            return <GapRow key={i} row={row} />;
          }
          const num = sign === '+' ? row.newNum : sign === '-' ? row.oldNum : row.oldNum;
          const line = sign === '+' ? row.newLine : row.oldLine;
          const spans = sign === '+' ? row.newSpans : row.oldSpans;
          const kind = row.kind === 'modified' ? (sign === '+' ? 'added' : 'deleted') : row.kind;
          return (
            <div key={i} className={`diff-row diff-row--${kind}`}>
              {lineNumbers && <span className="ln">{num}</span>}
              <span
                className={`sign ${
                  sign === '+' ? 'sign--added' : sign === '-' ? 'sign--deleted' : 'sign--equal'
                }`}
              >
                {sign}
              </span>
              <span className="cell">
                {spans && sign !== '' ? <SpanText spans={spans} /> : line}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DiffView(props: DiffViewProps) {
  return props.viewMode === 'side-by-side' ? (
    <SideBySide {...props} />
  ) : (
    <InlineView {...props} />
  );
}
