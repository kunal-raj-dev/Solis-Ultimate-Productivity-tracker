import React, { useEffect, useRef, useState } from 'react';
import { Upload, CheckCircle2, FileJson, Layers, ArrowRight, ShieldAlert, RefreshCw } from 'lucide-react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import { CustomSelect } from '../../ui/Select/CustomSelect';
import { SegmentedControl } from '../../ui/SegmentedControl/SegmentedControl';
import { validateSolisBackup, executeWorkspaceImport, ImportConflictStrategy, BackupValidationResult } from '../../../utils/import';
import { DeckImportResult, parseDeckFile } from '../../../utils/import/deckImporter';
import { dataService } from '../../../services/dataService';
import { formatErrorMessage } from '../../../utils/errors';
import { StudySubject } from '../../../types/study';
import { useToast } from '../../../context/ToastContext';
import './ImportModal.css';

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Which flow the modal opens in (plan §4.4: "Import Deck" opens deck mode). */
  initialMode?: ImportMode;
}

export type ImportMode = 'workspace' | 'deck';

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'workspace'
}) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deckInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<ImportMode>(initialMode);
  const [validation, setValidation] = useState<BackupValidationResult | null>(null);
  const [strategy, setStrategy] = useState<ImportConflictStrategy>('merge_skip');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Deck import state (plan §4.4 — Anki .apkg / Quizlet text decks).
  const [deckResult, setDeckResult] = useState<DeckImportResult | null>(null);
  const [deckFileName, setDeckFileName] = useState('');
  const [isParsingDeck, setIsParsingDeck] = useState(false);
  const [deckSubjectId, setDeckSubjectId] = useState('');
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [isImportingDeck, setIsImportingDeck] = useState(false);
  const [autoCreateTopics, setAutoCreateTopics] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen || mode !== 'deck') return;
    // Refresh on every deck-mode open so newly created subjects appear.
    let cancelled = false;
    dataService.study
      .getSubjects()
      .then((all) => {
        if (cancelled) return;
        const active = all.filter((s) => s.status !== 'archived');
        setSubjects(active);
        setDeckSubjectId((prev) => (active.some((s) => s.id === prev) ? prev : active[0]?.id || ''));
      })
      .catch(() => {
        if (!cancelled) setSubjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateSolisBackup(content);
      setValidation(result);
      if (!result.isValid) {
        addToast({
          title: 'Invalid Backup File',
          description: result.error || 'The uploaded file does not conform to the solis-export-v1 schema.',
          type: 'error'
        });
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!validation?.isValid || !validation.backup) return;

    if (strategy === 'replace' && !confirmReplace) {
      addToast({
        title: 'Confirmation Required',
        description: 'Please confirm that you understand the replace strategy will overwrite existing items.',
        type: 'warning'
      });
      return;
    }

    setIsImporting(true);
    try {
      const result = await executeWorkspaceImport(validation.backup, strategy, dataService);
      addToast({
        title: 'Workspace Restored',
        description: `Successfully imported ${result.importedCount} records into your private workspace.`,
        type: 'success'
      });
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Import execution error:', err);
      addToast({
        title: 'Import Failed',
        description: 'An error occurred while importing your records. Please try again.',
        type: 'error'
      });
    } finally {
      setIsImporting(false);
    }
  };

  // ── Deck import (plan §4.4) ─────────────────────────────────────────────────

  const handleDeckFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingDeck(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const result = await parseDeckFile(file.name, buffer);
        setDeckResult(result);
        setDeckFileName(file.name);
        if (result.cards.length === 0) {
          addToast({
            title: 'No cards found',
            description: result.warnings[0] || 'This deck file does not contain any importable cards.',
            type: 'warning'
          });
        }
      } catch (err) {
        setDeckResult(null);
        setDeckFileName('');
        addToast({
          title: 'Could not read deck',
          description: err instanceof Error ? err.message : 'The deck file could not be parsed.',
          type: 'error'
        });
      } finally {
        setIsParsingDeck(false);
      }
    };
    reader.onerror = () => {
      setIsParsingDeck(false);
      addToast({
        title: 'Could not read deck',
        description: 'The file could not be read from disk.',
        type: 'error'
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteDeckImport = async () => {
    if (!deckResult || deckResult.cards.length === 0) return;
    const subjectId = deckSubjectId || subjects[0]?.id || '';
    if (!subjectId) {
      addToast({
        title: 'Subject required',
        description: 'Choose which subject the imported deck belongs to.',
        type: 'warning'
      });
      return;
    }

    setIsImportingDeck(true);
    let importedCount = 0;
    let skippedCount = 0;
    try {
      // Dedupe against the subject's existing deck so retrying after a
      // mid-loop failure never duplicates the cards already imported.
      const existingCards = await dataService.flashcards.getFlashcards({ subjectId });
      const existingPrompts = new Set(
        existingCards.map((card) => card.frontPrompt.trim().toLowerCase())
      );

      // If auto-create topics is enabled, resolve or create topics for subdecks
      const topicNameToId = new Map<string, string>();
      if (autoCreateTopics && subjectId) {
        try {
          const existingTopics = await dataService.study.getTopics(subjectId);
          for (const t of existingTopics) {
            topicNameToId.set(t.title.trim().toLowerCase(), t.id);
          }
          const topicsToCreate = (deckResult.detectedTopics || []).filter(
            (name) => !topicNameToId.has(name.trim().toLowerCase())
          );
          for (const topicName of topicsToCreate) {
            const created = await dataService.study.createTopic({
              subjectId,
              title: topicName,
              masteryLevel: 'unstudied'
            });
            topicNameToId.set(topicName.trim().toLowerCase(), created.id);
          }
        } catch (topicErr) {
          console.warn('Could not auto-create syllabus topics:', topicErr);
        }
      }

      for (const card of deckResult.cards) {
        const promptKey = card.frontPrompt.trim().toLowerCase();
        if (existingPrompts.has(promptKey)) {
          skippedCount += 1;
          continue;
        }

        const resolvedTopicId = card.topicTitle
          ? topicNameToId.get(card.topicTitle.trim().toLowerCase())
          : undefined;

        await dataService.flashcards.createFlashcard({
          subjectId,
          topicId: resolvedTopicId,
          topicTitle: card.topicTitle,
          frontPrompt: card.frontPrompt,
          backAnswer: card.backAnswer,
          cardType: card.cardType
        });
        existingPrompts.add(promptKey);
        importedCount += 1;
      }
      const subjectName = subjects.find((s) => s.id === subjectId)?.name || 'your deck';
      addToast({
        title: 'Deck Imported',
        description: `${importedCount} flashcards added to ${subjectName}${
          skippedCount > 0 ? ` (${skippedCount} already in the deck skipped)` : ''
        }.`,
        type: 'success'
      });
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      addToast({
        title: 'Deck import failed',
        description: `Imported ${importedCount} of ${deckResult.cards.length} cards before stopping. ${formatErrorMessage(err)}`,
        type: 'error'
      });
    } finally {
      setIsImportingDeck(false);
    }
  };

  const handleClose = () => {
    setValidation(null);
    setStrategy('merge_skip');
    setConfirmReplace(false);
    setIsImporting(false);
    setDeckResult(null);
    setDeckFileName('');
    setIsParsingDeck(false);
    setDeckSubjectId('');
    setIsImportingDeck(false);
    setAutoCreateTopics(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (deckInputRef.current) {
      deckInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'deck' ? 'Import Flashcard Deck' : 'Restore & Import Workspace Data'}
      className="solis-import-modal"
    >
      <div className="solis-import-content">
        <SegmentedControl
          variant="pills"
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'workspace', label: 'Workspace Backup' },
            { value: 'deck', label: 'Flashcard Deck' }
          ]}
        />

        {mode === 'deck' ? (
          !deckResult || deckResult.cards.length === 0 ? (
            <div className="solis-import-dropzone" onClick={() => deckInputRef.current?.click()}>
              <input
                ref={deckInputRef}
                type="file"
                accept=".apkg,.zip,.txt,.tsv,.csv"
                onChange={handleDeckFileChange}
                style={{ display: 'none' }}
              />
              <div className="solis-import-dropzone__icon">
                <Upload size={32} />
              </div>
              <h4 className="solis-import-dropzone__title">
                {isParsingDeck ? 'Parsing deck…' : 'Select an Anki (.apkg) or Quizlet (.txt/.tsv/.csv) deck'}
              </h4>
              <p className="solis-import-dropzone__subtitle">
                Parsing happens entirely on this device. Cloze markers <code>&#123;&#123;c1::term&#125;&#125;</code> are
                mapped to Solis cloze cards automatically.
              </p>
              <Button type="button" variant="outline" size="sm" leftIcon={<Layers size={14} />}>
                Choose Deck File
              </Button>
            </div>
          ) : (
            <div className="solis-import-preview">
              <div className="solis-import-preview__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="var(--status-success)" />
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-body)' }}>
                    {deckResult.deckName || deckFileName || 'Deck parsed'}
                  </span>
                </div>
                <Badge variant="coral">
                  {deckResult.sourceFormat === 'anki_apkg' ? 'Anki .apkg' : 'Quizlet text'}
                </Badge>
              </div>

              <div className="solis-import-grid">
                <div className="solis-import-stat">
                  <span className="solis-import-stat__num">{deckResult.cards.length}</span>
                  <span className="solis-import-stat__label">Cards Found</span>
                </div>
                <div className="solis-import-stat">
                  <span className="solis-import-stat__num">
                    {deckResult.cards.filter((card) => card.cardType === 'cloze').length}
                  </span>
                  <span className="solis-import-stat__label">Cloze Cards</span>
                </div>
              </div>

              {deckResult.warnings.length > 0 && (
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                  {deckResult.warnings.slice(0, 5).map((warning, i) => (
                    <p key={i} style={{ margin: '2px 0' }}>• {warning}</p>
                  ))}
                </div>
              )}

              <CustomSelect
                label="Import into Subject"
                value={deckSubjectId}
                onChange={setDeckSubjectId}
                options={subjects.map((s) => ({ value: s.id, label: s.name, badge: s.code }))}
                placeholder="Choose a subject"
              />

              {deckResult.detectedTopics && deckResult.detectedTopics.length > 0 && (
                <div
                  className="solis-deck-detected-topics"
                  style={{
                    padding: '12px 14px',
                    background: 'var(--surface-sunken, rgba(255, 255, 255, 0.03))',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Detected Subdecks ({deckResult.detectedTopics.length})
                    </span>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-caption)', cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={autoCreateTopics}
                        onChange={(e) => setAutoCreateTopics(e.target.checked)}
                      />
                      <span>Auto-create Syllabus Topics</span>
                    </label>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {deckResult.detectedTopics.map((topic, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          background: 'var(--surface-elevated, rgba(255, 255, 255, 0.06))',
                          borderRadius: '12px',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="solis-import-actions">
                <Button type="button" variant="outline" size="md" onClick={() => setDeckResult(null)}>
                  Choose Different File
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  size="md"
                  leftIcon={isImportingDeck ? <RefreshCw className="solis-spin" size={16} /> : <ArrowRight size={16} />}
                  onClick={handleExecuteDeckImport}
                  isLoading={isImportingDeck}
                  disabled={deckResult.cards.length === 0}
                >
                  Import {deckResult.cards.length} Cards
                </Button>
              </div>
            </div>
          )
        ) : !validation?.isValid ? (
          <div className="solis-import-dropzone" onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div className="solis-import-dropzone__icon">
              <Upload size={32} />
            </div>
            <h4 className="solis-import-dropzone__title">Select a Solis Workspace Backup (.json)</h4>
            <p className="solis-import-dropzone__subtitle">
              Upload a valid <code>solis-export-v1</code> backup file to preview and restore your study environment.
            </p>
            <Button type="button" variant="outline" size="sm" leftIcon={<FileJson size={14} />}>
              Choose JSON File
            </Button>
          </div>
        ) : (
          <div className="solis-import-preview">
            <div className="solis-import-preview__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="var(--status-success)" />
                <span style={{ fontWeight: 600, fontSize: 'var(--text-body)' }}>Valid Solis Backup Detected</span>
              </div>
              <Badge variant="coral">solis-export-v1</Badge>
            </div>

            {/* Inventory Grid */}
            <div className="solis-import-grid">
              <div className="solis-import-stat">
                <span className="solis-import-stat__num">{validation.summary?.subjectsCount || 0}</span>
                <span className="solis-import-stat__label">Subjects</span>
              </div>
              <div className="solis-import-stat">
                <span className="solis-import-stat__num">{validation.summary?.topicsCount || 0}</span>
                <span className="solis-import-stat__label">Topics</span>
              </div>
              <div className="solis-import-stat">
                <span className="solis-import-stat__num">{validation.summary?.tasksCount || 0}</span>
                <span className="solis-import-stat__label">Tasks</span>
              </div>
              <div className="solis-import-stat">
                <span className="solis-import-stat__num">{validation.summary?.notesCount || 0}</span>
                <span className="solis-import-stat__label">Notes</span>
              </div>
              <div className="solis-import-stat">
                <span className="solis-import-stat__num">{validation.summary?.studySessionsCount || 0}</span>
                <span className="solis-import-stat__label">Study Logs</span>
              </div>
              <div className="solis-import-stat">
                <span className="solis-import-stat__num">{validation.summary?.habitsCount || 0}</span>
                <span className="solis-import-stat__label">Habits</span>
              </div>
              <div className="solis-import-stat">
                <span className="solis-import-stat__num">{validation.summary?.routinesCount || 0}</span>
                <span className="solis-import-stat__label">Routines</span>
              </div>
              <div className="solis-import-stat">
                <span className="solis-import-stat__num">{validation.summary?.resourcesCount || 0}</span>
                <span className="solis-import-stat__label">Resources</span>
              </div>
              <div className="solis-import-stat">
                <span className="solis-import-stat__num">{validation.summary?.timeBlocksCount || 0}</span>
                <span className="solis-import-stat__label">Time Blocks</span>
              </div>
              <div className="solis-import-stat">
                <span className="solis-import-stat__num">{validation.summary?.flashcardsCount || 0}</span>
                <span className="solis-import-stat__label">Flashcards</span>
              </div>
              <div className="solis-import-stat">
                <span className="solis-import-stat__num">{validation.summary?.reflectionsCount || 0}</span>
                <span className="solis-import-stat__label">Reflections</span>
              </div>
            </div>

            {/* Conflict Strategy Selector */}
            <div className="solis-import-strategy-section">
              <label className="solis-import-strategy-title">Conflict Resolution Strategy</label>
              <div className="solis-import-strategies">
                <label className={`solis-strategy-card ${strategy === 'merge_skip' ? 'solis-strategy-card--active' : ''}`}>
                  <input
                    type="radio"
                    name="strategy"
                    value="merge_skip"
                    checked={strategy === 'merge_skip'}
                    onChange={() => setStrategy('merge_skip')}
                  />
                  <div>
                    <strong>Merge & Skip Duplicates (Recommended)</strong>
                    <p>Keeps current workspace and safely adds new items from the backup.</p>
                  </div>
                </label>

                <label className={`solis-strategy-card ${strategy === 'create_copies' ? 'solis-strategy-card--active' : ''}`}>
                  <input
                    type="radio"
                    name="strategy"
                    value="create_copies"
                    checked={strategy === 'create_copies'}
                    onChange={() => setStrategy('create_copies')}
                  />
                  <div>
                    <strong>Create Copies</strong>
                    <p>Generates new items for all backup records without overwriting existing data.</p>
                  </div>
                </label>

                <label className={`solis-strategy-card ${strategy === 'replace' ? 'solis-strategy-card--active' : ''}`}>
                  <input
                    type="radio"
                    name="strategy"
                    value="replace"
                    checked={strategy === 'replace'}
                    onChange={() => setStrategy('replace')}
                  />
                  <div>
                    <strong>Full Restore (Replace)</strong>
                    <p>Replaces existing workspace records with backup data.</p>
                  </div>
                </label>
              </div>

              {strategy === 'replace' && (
                <div className="solis-import-warning">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <ShieldAlert size={18} color="var(--status-error)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', color: 'var(--status-error)', fontWeight: 600 }}>
                        Destructive Restore Safeguard
                      </p>
                      <p style={{ margin: '4px 0 8px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                        This will replace your existing subjects, tasks, notes, habits, goals, sessions, flashcards, routines, resources, time blocks, and reflections with the contents of this backup.
                      </p>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-caption)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={confirmReplace}
                          onChange={(e) => setConfirmReplace(e.target.checked)}
                        />
                        <span>I understand and want to overwrite my current workspace</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="solis-import-actions">
              <Button type="button" variant="outline" size="md" onClick={() => setValidation(null)}>
                Choose Different File
              </Button>
              <Button
                type="button"
                variant="accent"
                size="md"
                leftIcon={isImporting ? <RefreshCw className="solis-spin" size={16} /> : <ArrowRight size={16} />}
                onClick={handleExecuteImport}
                isLoading={isImporting}
                disabled={strategy === 'replace' && !confirmReplace}
              >
                Execute Restore
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
