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
  disabled?: boolean;
}

function Checkbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`checkbox ${disabled ? 'checkbox--disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
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
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <select
      className="select"
      value={value}
      disabled={disabled}
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
  disabled = false,
}: OptionsBarProps) {
  return (
    <div className={`optionsbar ${disabled ? 'optionsbar--disabled' : ''}`} aria-disabled={disabled}>
      <div className="optionsbar__group">
        <Checkbox
          label="Ignore case"
          checked={options.ignoreCase}
          disabled={disabled}
          onChange={(ignoreCase) => onOptionsChange({ ...options, ignoreCase })}
        />
        <Checkbox
          label="Ignore whitespace"
          checked={options.ignoreWhitespace}
          disabled={disabled}
          onChange={(ignoreWhitespace) =>
            onOptionsChange({ ...options, ignoreWhitespace })
          }
        />
        <Checkbox
          label="Ignore line endings (CRLF)"
          checked={options.ignoreLineEndings}
          disabled={disabled}
          onChange={(ignoreLineEndings) =>
            onOptionsChange({ ...options, ignoreLineEndings })
          }
        />
      </div>

      <div className="optionsbar__group optionsbar__group--compact">
        <Select
          ariaLabel="Context lines"
          value={String(options.context)}
          disabled={disabled}
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
          disabled={disabled}
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
          disabled={disabled}
          onChange={onWrapChange}
        />
        <Checkbox
          label="Line numbers"
          checked={lineNumbers}
          disabled={disabled}
          onChange={onLineNumbersChange}
        />
      </div>

      <div className="optionsbar__group optionsbar__group--end">
        <div
          className="segmented"
          role="tablist"
          aria-label="View mode"
          onKeyDown={(e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            e.preventDefault();
            onViewModeChange(viewMode === 'side-by-side' ? 'inline' : 'side-by-side');
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
      </div>
    </div>
  );
}
