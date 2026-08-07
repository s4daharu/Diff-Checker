export type Granularity = 'chars' | 'words';
export type ViewMode = 'side-by-side' | 'inline';
export type ContextSetting = number | 'all';

export interface DiffOptions {
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
  ignoreLineEndings: boolean;
  context: ContextSetting;
  granularity: Granularity;
}

export type RowKind = 'equal' | 'added' | 'deleted' | 'modified' | 'gap';

export interface Span {
  text: string;
  added?: boolean;
  removed?: boolean;
}

export interface DiffRow {
  kind: RowKind;
  oldLine: string | null;
  newLine: string | null;
  oldNum: number | null;
  newNum: number | null;
  oldSpans?: Span[];
  newSpans?: Span[];
  skipped?: number;
}

export interface DiffStats {
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
  oldLines: number;
  newLines: number;
}

export interface DiffResult {
  rows: DiffRow[];
  stats: DiffStats | null;
  aborted: boolean;
  timeMs: number;
}

export const DEFAULT_OPTIONS: DiffOptions = {
  ignoreCase: false,
  ignoreWhitespace: false,
  ignoreLineEndings: false,
  context: 'all',
  granularity: 'chars',
};
