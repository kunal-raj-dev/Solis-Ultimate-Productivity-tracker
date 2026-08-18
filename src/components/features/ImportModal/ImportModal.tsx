import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, FileJson, ArrowRight, ShieldAlert, RefreshCw } from 'lucide-react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import { validateSolisBackup, executeWorkspaceImport, ImportConflictStrategy, BackupValidationResult } from '../../../utils/import';
import { dataService } from '../../../services/dataService';
import { useToast } from '../../../context/ToastContext';
import './ImportModal.css';

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [validation, setValidation] = useState<BackupValidationResult | null>(null);
  const [strategy, setStrategy] = useState<ImportConflictStrategy>('merge_skip');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  const handleClose = () => {
    setValidation(null);
    setStrategy('merge_skip');
    setConfirmReplace(false);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Restore & Import Workspace Data"
      className="solis-import-modal"
    >
      <div className="solis-import-content">
        {!validation?.isValid ? (
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
                        This will replace existing tasks, notes, and habits with the contents of this backup.
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
