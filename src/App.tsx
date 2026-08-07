import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OptionsBar } from './components/OptionsBar';
import { StatsBar } from './components/StatsBar';
import { DiffView } from './components/DiffView';
import { LogoIcon, SwapIcon } from './components/Icons';
import {
  DEFAULT_OPTIONS,
  type DiffOptions,
  type DiffResult,
  type ViewMode,
} from './lib/types';
import {
  loadJson,
  loadString,
  save,
  storageKeys,
} from './lib/storage';
import { SAMPLE_CHANGED, SAMPLE_ORIGINAL } from './lib/sample';
import { applyContext } from './lib/diffEngine';
import { MAX_FILE_BYTES } from './components/InputPanel';

type Theme = 'light' | 'dark';

interface WorkerResponse {
  id: number;
  ok: boolean;
  result?: DiffResult;
  patch?: string;
  error?: string;
}

const DEBOUNCE_MS = 250;
const RENDER_CAP = 12000;

function usePersistedState<T>(
  key: string,
  fallback: T,
  sanitize?: (raw: unknown) => T,
): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const raw = loadJson(key, null);
    if (raw === null) return fallback;
    return sanitize ? sanitize(raw) : (raw as T);
  });
  const setPersisted = useCallback(
    (next: T) => {
      setValue(next);
      save(key, next);
    },
    [key],
  );
  return [value, setPersisted];
}

function sanitizeOptions(raw: unknown): DiffOptions {
  const o = (raw ?? {}) as Partial<DiffOptions>;
  return {
    ignoreCase: o.ignoreCase === true,
    ignoreWhitespace: o.ignoreWhitespace === true,
    ignoreLineEndings: o.ignoreLineEndings === true,
    context:
      o.context === 'all'
        ? 'all'
        : typeof o.context === 'number' && Number.isFinite(o.context)
          ? o.context
          : DEFAULT_OPTIONS.context,
    granularity: o.granularity === 'words' ? 'words' : 'chars',
  };
}

function getInitialTheme(): Theme {
  const stored = loadString(storageKeys.theme, '');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export default function App() {
  const [oldText, setOldText] = useState(() => loadString(storageKeys.oldText, ''));
  const [newText, setNewText] = useState(() => loadString(storageKeys.newText, ''));
  const [options, setOptions] = usePersistedState<DiffOptions>(
    storageKeys.options,
    DEFAULT_OPTIONS,
    sanitizeOptions,
  );
  const [viewMode, setViewMode] = usePersistedState<ViewMode>(
    storageKeys.viewMode,
    'side-by-side',
    (v) => (v === 'inline' ? 'inline' : 'side-by-side'),
  );
  const [wrap, setWrap] = usePersistedState(
    storageKeys.wrap,
    false,
    (v) => v === true,
  );
  const [lineNumbers, setLineNumbers] = usePersistedState(
    storageKeys.lineNumbers,
    true,
    (v) => v === true,
  );
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const [result, setResult] = useState<DiffResult | null>(null);
  const [computing, setComputing] = useState(false);
  const [patch, setPatch] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [renderAll, setRenderAll] = useState(false);
  const [globalDrag, setGlobalDrag] = useState(false);
  const [fileNames, setFileNames] = useState<{
    old: string | null;
    new: string | null;
  }>({ old: null, new: null });

  const workerRef = useRef<Worker | null>(null);
  const seqRef = useRef(0);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const themeOverridden = useRef(loadString(storageKeys.theme, '') !== '');

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  const makeWorker = useCallback(() => {
    const w = new Worker(
      new URL('./diffWorker.ts', import.meta.url),
      { type: 'module' },
    );
    w.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.id !== seqRef.current) return;
      setComputing(false);
      if (!msg.ok) {
        setResult(null);
        showToast(msg.error ?? 'Something went wrong while diffing.');
        return;
      }
      setResult(msg.result ?? null);
      setPatch(msg.patch ?? null);
    };
    return w;
  }, [showToast]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    save(storageKeys.theme, theme);
  }, [theme]);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.header');
    const root = document.documentElement;
    if (!header) return;
    const update = () =>
      root.style.setProperty('--header-h', `${header.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      if (!themeOverridden.current) setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
    },
    [],
  );

  useEffect(() => {
    setComputing(true);
    const id = ++seqRef.current;
    const timer = window.setTimeout(() => {
      workerRef.current?.terminate();
      workerRef.current = makeWorker();
      workerRef.current.postMessage({
        id,
        oldText,
        newText,
        options,
        oldName: fileNames.old ?? undefined,
        newName: fileNames.new ?? undefined,
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [oldText, newText, options, fileNames, makeWorker]);

  useEffect(() => {
    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes('Files');
    const onDragEnter = (e: DragEvent) => {
      if (hasFiles(e)) setGlobalDrag(true);
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDragLeave = (e: DragEvent) => {
      if (!e.relatedTarget) setGlobalDrag(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setGlobalDrag(false);
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (file.size > MAX_FILE_BYTES) {
        showToast(`"${file.name}" is larger than the 10 MB limit.`);
        return;
      }
      file
        .text()
        .then((text) => {
          const targetLeft = e.clientX < window.innerWidth / 2;
          setFileNames((names) => ({
            ...names,
            [targetLeft ? 'old' : 'new']: file.name,
          }));
          if (targetLeft) setOldText(text);
          else setNewText(text);
        })
        .catch(() => showToast(`Could not read "${file.name}".`));
    };
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      save(storageKeys.oldText, oldText);
      save(storageKeys.newText, newText);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [oldText, newText]);

  const handleNewDiff = useCallback(() => {
    setOldText('');
    setNewText('');
    setOptions(DEFAULT_OPTIONS);
    setFileNames({ old: null, new: null });
    setRenderAll(false);
    save(storageKeys.oldText, '');
    save(storageKeys.newText, '');
    save(storageKeys.options, DEFAULT_OPTIONS);
  }, [setOptions]);

  const handleLoadSample = useCallback(() => {
    setOldText(SAMPLE_ORIGINAL);
    setNewText(SAMPLE_CHANGED);
  }, []);

  const handleSwap = useCallback(() => {
    setOldText(newText);
    setNewText(oldText);
    setFileNames((names) => ({ old: names.new, new: names.old }));
  }, [oldText, newText]);

  const handleCopyPatch = useCallback(async () => {
    if (patch === null) return;
    try {
      await navigator.clipboard.writeText(patch);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Could not access the clipboard.');
    }
  }, [patch, showToast]);

  const handleDownloadPatch = useCallback(() => {
    if (patch === null) return;
    const blob = new Blob([patch], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const base = (name: string | null) =>
      name ? name.replace(/\.[^./\\]+$/, '') : 'diff';
    a.download = `${base(fileNames.new)}.patch`;
    a.click();
    URL.revokeObjectURL(url);
  }, [patch, fileNames.new]);

  const hasInput = oldText !== '' || newText !== '';

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === '1') {
        e.preventDefault();
        setViewMode('side-by-side');
      } else if (key === '2') {
        e.preventDefault();
        setViewMode('inline');
      } else if (key === 's') {
        e.preventDefault();
        handleDownloadPatch();
      } else if (key === 'e') {
        e.preventDefault();
        document
          .querySelector<HTMLTextAreaElement>('.input-panel--left textarea')
          ?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setViewMode, handleDownloadPatch]);

  const identical =
    result?.stats != null &&
    result.stats.added + result.stats.removed + result.stats.changed === 0;
  const { rows: visibleRows, totalRows } = useMemo(() => {
    const all = result ? applyContext(result.rows, options.context) : [];
    if (renderAll || all.length <= RENDER_CAP) {
      return { rows: all, totalRows: all.length };
    }
    return { rows: all.slice(0, RENDER_CAP), totalRows: all.length };
  }, [result, options.context, renderAll]);

  return (
    <div className="app">
      <Header
        theme={theme}
        onToggleTheme={() => {
          themeOverridden.current = true;
          setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
        }}
        onNewDiff={handleNewDiff}
        busy={computing}
      />

      <main className="main">
        <div className="panels">
          <InputPanel
            title="Original text"
            accent="left"
            value={oldText}
            onChange={setOldText}
            onError={showToast}
            onFileInfo={(name) =>
              setFileNames((names) => ({ ...names, old: name }))
            }
          />
          <div className="panels__swap">
            <button
              type="button"
              className="btn btn--round"
              onClick={handleSwap}
              title="Swap original and changed text"
              aria-label="Swap texts"
            >
              <SwapIcon size={18} />
            </button>
          </div>
          <InputPanel
            title="Changed text"
            accent="right"
            value={newText}
            onChange={setNewText}
            onError={showToast}
            onFileInfo={(name) =>
              setFileNames((names) => ({ ...names, new: name }))
            }
          />
        </div>

        {hasInput && (
          <OptionsBar
            options={options}
            onOptionsChange={setOptions}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            wrap={wrap}
            onWrapChange={setWrap}
            lineNumbers={lineNumbers}
            onLineNumbersChange={setLineNumbers}
          />
        )}

        <section className="results" aria-live="polite">
          {!hasInput && (
            <div className="empty">
              <LogoIcon size={44} />
              <h2>Compare two texts</h2>
              <p>
                Paste text or open files in the two panels above. Everything is
                computed locally — your text never leaves this device.
              </p>
              <button type="button" className="btn btn--primary" onClick={handleLoadSample}>
                Try with sample text
              </button>
            </div>
          )}

          {hasInput && result?.aborted && (
            <div className="notice">
              <strong>This diff was too large to compute.</strong> Try comparing
              smaller files, or enable an ignore option to reduce the search
              space.
            </div>
          )}

          {hasInput && result && !result.aborted && result.rows.length > 0 && (
            <>
              <StatsBar
                stats={result.stats}
                identical={identical}
                timeMs={result.timeMs}
                onCopyPatch={handleCopyPatch}
                onDownloadPatch={handleDownloadPatch}
                patchReady={patch !== null}
                copied={copied}
              />
              <DiffView
                rows={visibleRows}
                viewMode={viewMode}
                wrap={wrap}
                lineNumbers={lineNumbers}
              />
              {totalRows > RENDER_CAP && !renderAll && (
                <div className="notice notice--muted">
                  Showing the first {RENDER_CAP.toLocaleString()} of{' '}
                  {totalRows.toLocaleString()} rows.
                  <button
                    type="button"
                    className="btn btn--small"
                    style={{ marginLeft: 8 }}
                    onClick={() => setRenderAll(true)}
                  >
                    Render all
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {computing && hasInput && (
          <div className="notice notice--muted">Computing differences…</div>
        )}
      </main>

      <footer className="footer">
        <p>
          OpenDiff — an open source diff checker. Runs entirely in your browser;
          no data is uploaded anywhere. Built with React, TypeScript and jsdiff.
        </p>
      </footer>

      {globalDrag && (
        <div className="drop-overlay" aria-hidden="true">
          Drop to compare — left half fills Original, right half fills Changed
        </div>
      )}

      {toast && (
        <div className="toast" role="alert">
          {toast}
          <button
            type="button"
            className="toast__close"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
