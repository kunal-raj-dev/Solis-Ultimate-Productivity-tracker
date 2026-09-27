import React from 'react';
import { History, RotateCcw } from 'lucide-react';
import { NoteSnapshot } from '../../../utils/notes/noteHistory';

export interface NoteHistoryPanelProps {
  history: NoteSnapshot[];
  onRestore: (content: string) => void;
  onClose: () => void;
}

/** Phase 2 (P2.5) — recent synced snapshots of the open note, restorable. */
export const NoteHistoryPanel: React.FC<NoteHistoryPanelProps> = ({ history, onRestore, onClose }) => {
  if (history.length === 0) return null;
  return (
    <div className="solis-note-history" role="dialog" aria-label="Note version history">
      <div className="solis-note-history__header">
        <History size={13} />
        <span>Version History</span>
        <button
          type="button"
          className="solis-note-history__close"
          onClick={onClose}
          aria-label="Close version history"
        >
          ✕
        </button>
      </div>
      <div className="solis-note-history__list">
        {history.map((snap, i) => {
          const when = new Date(snap.at);
          const label = isNaN(when.getTime())
            ? snap.at
            : when.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const words = snap.content.trim() ? snap.content.trim().split(/\s+/).length : 0;
          return (
            <div key={`${snap.at}-${i}`} className="solis-note-history__item">
              <span className="solis-note-history__when">{label}</span>
              <span className="solis-note-history__words">{words}w</span>
              <button
                type="button"
                className="solis-note-history__restore tactile-press"
                onClick={() => {
                  onRestore(snap.content);
                  onClose();
                }}
                title="Restore this version into the editor"
              >
                <RotateCcw size={11} />
                Restore
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
