import type { DiffOptions, Granularity, ViewMode } from '../lib/types';

interface OptionsBarProps {
  options: DiffOptions;
  onOptionsChange: (next: DiffOptions) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  wrap: boolean;
  onWrapChange: (wrap: boolean) => void;
  lineNumbers: boolean;
  onLineNumbersChange: (show: boolean) => void;
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <select
      className="select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function OptionsBar({
  options,
  onOptionsChange,
  viewMode,
  onViewModeChange,
  wrap,
  onWrapChange,
  lineNumbers,
  onLineNumbersChange,
}: OptionsBarProps) {
  return (
    <div className="optionsbar">
      <div className="optionsbar__group">
        <Checkbox
          label="Ignore case"
          checked={options.ignoreCase}
          onChange={(ignoreCase) => onOptionsChange({ ...options, ignoreCase })}
        />
        <Checkbox
          label="Ignore whitespace"
          checked={options.ignoreWhitespace}
          onChange={(ignoreWhitespace) =>
            onOptionsChange({ ...options, ignoreWhitespace })
          }
        />
        <Checkbox
          label="Ignore line endings (CRLF)"
          checked={options.ignoreLineEndings}
          onChange={(ignoreLineEndings) =>
            onOptionsChange({ ...options, ignoreLineEndings })
          }
        />
      </div>

      <div className="optionsbar__group optionsbar__group--compact">
        <Select
          ariaLabel="Context lines"
          value={String(options.context)}
          onChange={(value) =>
            onOptionsChange({
              ...options,
              context: value === 'all' ? 'all' : Number(value),
            })
          }
          options={[
            { value: 'all', label: 'Context: all' },
            { value: '0', label: 'Context: 0' },
            { value: '3', label: 'Context: 3' },
            { value: '5', label: 'Context: 5' },
            { value: '10', label: 'Context: 10' },
          ]}
        />
        <Select
          ariaLabel="Granularity"
          value={options.granularity}
          onChange={(value) =>
            onOptionsChange({ ...options, granularity: value as Granularity })
          }
          options={[
            { value: 'chars', label: 'Char level' },
            { value: 'words', label: 'Word level' },
          ]}
        />
      </div>

      <div className="optionsbar__group optionsbar__group--compact">
        <Checkbox
          label="Wrap lines"
          checked={wrap}
          onChange={onWrapChange}
        />
        <Checkbox
          label="Line numbers"
          checked={lineNumbers}
          onChange={onLineNumbersChange}
        />
      </div>

      <div className="optionsbar__group optionsbar__group--end">
        <div className="segmented" role="tablist" aria-label="View mode">
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
      </div>
    </div>
  );
}
