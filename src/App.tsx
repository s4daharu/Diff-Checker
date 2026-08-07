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

type Theme = 'light' | 'dark';

interface WorkerResponse {
  id: number;
  ok: boolean;
  result?: DiffResult;
  patch?: string;
  error?: string;
}

const DEBOUNCE_MS = 250;

function usePersistedState<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => loadJson(key, fallback));
  const setPersisted = useCallback(
    (next: T) => {
      setValue(next);
      save(key, next);
    },
    [key],
  );
  return [value, setPersisted];
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
  );
  const [viewMode, setViewMode] = usePersistedState<ViewMode>(
    storageKeys.viewMode,
    'side-by-side',
  );
  const [wrap, setWrap] = usePersistedState(storageKeys.wrap, false);
  const [lineNumbers, setLineNumbers] = usePersistedState(
    storageKeys.lineNumbers,
    true,
  );
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const [result, setResult] = useState<DiffResult | null>(null);
  const [computing, setComputing] = useState(false);
  const [patch, setPatch] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const seqRef = useRef(0);
  const toastTimerRef = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

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
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('./diffWorker.ts', import.meta.url),
        { type: 'module' },
      );
      workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
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
    }
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [showToast]);

  useEffect(() => {
    setComputing(true);
    const id = ++seqRef.current;
    const timer = window.setTimeout(() => {
      workerRef.current?.postMessage({
        id,
        oldText,
        newText,
        options,
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [oldText, newText, options]);

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
    a.download = 'diff.patch';
    a.click();
    URL.revokeObjectURL(url);
  }, [patch]);

  const hasInput = oldText !== '' || newText !== '';
  const identical =
    result?.stats != null &&
    result.stats.added + result.stats.removed + result.stats.changed === 0;
  const visibleRows = useMemo(
    () => (result ? applyContext(result.rows, options.context) : []),
    [result, options.context],
  );

  return (
    <div className="app">
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
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
            </>
          )}
        </section>

        {computing && hasInput && result !== null && (
          <div className="notice notice--muted">Computing differences…</div>
        )}
      </main>

      <footer className="footer">
        <p>
          OpenDiff — an open source diff checker. Runs entirely in your browser;
          no data is uploaded anywhere. Built with React, TypeScript and jsdiff.
        </p>
      </footer>

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
