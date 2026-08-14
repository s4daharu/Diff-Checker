import { useEffect } from 'react';
import { CloseIcon, KeyboardIcon } from './Icons';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Ctrl / ⌘ + 1', desc: 'Switch to Side-by-Side view' },
  { key: 'Ctrl / ⌘ + 2', desc: 'Switch to Inline unified view' },
  { key: 'Ctrl / ⌘ + S', desc: 'Download .patch file' },
  { key: 'Ctrl / ⌘ + F', desc: 'Find within diff' },
  { key: 'Ctrl / ⌘ + E', desc: 'Focus Original (left) text panel' },
  { key: 'Alt + N / Alt + ↓', desc: 'Jump to Next difference' },
  { key: 'Alt + P / Alt + ↑', desc: 'Jump to Previous difference' },
  { key: '?', desc: 'Toggle keyboard shortcuts help' },
  { key: 'Esc', desc: 'Close dialogs / search' },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <header className="modal-header">
          <div className="modal-title">
            <KeyboardIcon size={18} />
            <h3>Keyboard Shortcuts</h3>
          </div>
          <button
            type="button"
            className="btn btn--small btn--icon btn--ghost"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <CloseIcon size={16} />
          </button>
        </header>

        <div className="modal-body">
          <table className="shortcuts-table">
            <tbody>
              {SHORTCUTS.map((item, idx) => (
                <tr key={idx}>
                  <td className="shortcuts-key">
                    <kbd>{item.key}</kbd>
                  </td>
                  <td className="shortcuts-desc">{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="modal-footer">
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Got it
          </button>
        </footer>
      </div>
    </div>
  );
}
