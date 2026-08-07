import { useRef, useState, type DragEvent } from 'react';
import { CloseIcon, UploadIcon } from './Icons';
import { countLines } from '../lib/diffEngine';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface InputPanelProps {
  title: string;
  accent: 'left' | 'right';
  value: string;
  onChange: (value: string) => void;
  onError: (message: string) => void;
  placeholder?: string;
}

export function InputPanel({
  title,
  accent,
  value,
  onChange,
  onError,
  placeholder,
}: InputPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      onError(`"${file.name}" is larger than the 10 MB limit.`);
      return;
    }
    try {
      onChange(await file.text());
    } catch {
      onError(`Could not read "${file.name}".`);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const chars = value.length;
  const lines = countLines(value);

  return (
    <section className={`panel input-panel input-panel--${accent}`}>
      <div
        className="input-panel__dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        data-dragover={dragOver || undefined}
      >
        <header className="input-panel__header">
          <span className="input-panel__title">{title}</span>
          <div className="input-panel__actions">
            <button
              type="button"
              className="btn btn--small"
              onClick={() => fileRef.current?.click()}
            >
              <UploadIcon size={14} />
              <span className="btn__label">Open file</span>
            </button>
            {value && (
              <button
                type="button"
                className="btn btn--small btn--icon"
                onClick={() => onChange('')}
                title="Clear text"
                aria-label={`Clear ${title.toLowerCase()}`}
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>
        </header>

        <textarea
          className="input-panel__textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            placeholder ?? 'Paste text here, or drop a file onto this panel…'
          }
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />

        <footer className="input-panel__footer">
          <span>{lines} lines</span>
          <span>{chars.toLocaleString()} chars</span>
        </footer>
      </div>
      <input
        ref={fileRef}
        type="file"
        hidden
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </section>
  );
}
