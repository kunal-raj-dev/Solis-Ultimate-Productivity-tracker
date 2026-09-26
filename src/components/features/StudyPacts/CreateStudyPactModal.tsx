import React, { useState } from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { CreateStudyPactPayload } from '../../../types/studyPact';
import { StudySubject } from '../../../types/study';
import { KeyRound, Sparkles, AlertCircle } from 'lucide-react';
import './CreateStudyPactModal.css';

export interface CreateStudyPactModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects?: StudySubject[];
  userDisplayName?: string;
  onCreatePact: (payload: CreateStudyPactPayload) => Promise<void>;
  onJoinPact: (inviteCode: string, partnerName?: string) => Promise<void>;
}

export const CreateStudyPactModal: React.FC<CreateStudyPactModalProps> = ({
  isOpen,
  onClose,
  subjects = [],
  userDisplayName,
  onCreatePact,
  onJoinPact
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create Form State
  const [partnerName, setPartnerName] = useState('');
  const [sharedObjective, setSharedObjective] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [myTargetMinutes, setMyTargetMinutes] = useState(300); // 5 hours default
  const [partnerTargetMinutes, setPartnerTargetMinutes] = useState(240); // 4 hours default

  // Join Form State
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinDisplayName, setJoinDisplayName] = useState(userDisplayName || '');

  const resetForm = () => {
    setPartnerName('');
    setSharedObjective('');
    setSelectedSubjectId('all');
    setMyTargetMinutes(300);
    setPartnerTargetMinutes(240);
    setInviteCodeInput('');
    setJoinDisplayName(userDisplayName || '');
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (myTargetMinutes < 15) {
      setErrorMessage('Your weekly study target must be at least 15 minutes.');
      return;
    }
    if (partnerTargetMinutes < 15) {
      setErrorMessage("Your partner's weekly study pledge must be at least 15 minutes.");
      return;
    }

    try {
      setIsSubmitting(true);
      const subject = selectedSubjectId !== 'all'
        ? subjects.find((s) => s.id === selectedSubjectId)
        : undefined;

      await onCreatePact({
        partnerName: partnerName.trim() || undefined,
        sharedObjective: sharedObjective.trim() || undefined,
        subjectId: subject?.id,
        subjectName: subject?.name,
        myWeeklyTargetMinutes: myTargetMinutes,
        partnerWeeklyTargetMinutes: partnerTargetMinutes
      });

      handleClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create study pact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = inviteCodeInput.trim().toUpperCase();
    if (cleanCode.length < 4) {
      setErrorMessage('Please enter a valid study pact invite code.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onJoinPact(cleanCode, joinDisplayName.trim() || undefined);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not join study pact with this code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Study Pact Accountability"
      className="solis-create-pact-modal"
    >
      {/* Mode Switcher Tabs */}
      <div className="solis-pact-modal-tabs">
        <button
          type="button"
          className={`solis-pact-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => { setActiveTab('create'); setErrorMessage(null); }}
        >
          <Sparkles size={15} /> Form a New Pact
        </button>
        <button
          type="button"
          className={`solis-pact-tab-btn ${activeTab === 'join' ? 'active' : ''}`}
          onClick={() => { setActiveTab('join'); setErrorMessage(null); }}
        >
          <KeyRound size={15} /> Join with Code
        </button>
      </div>

      {errorMessage && (
        <div className="solis-pact-error-banner">
          <AlertCircle size={15} />
          <span>{errorMessage}</span>
        </div>
      )}

      {activeTab === 'create' ? (
        <form onSubmit={handleCreateSubmit} className="solis-pact-form">
          <p className="solis-pact-form-lead">
            Commit to weekly focus goals alongside a peer. Solis automatically syncs your verified session minutes and provides gentle, anti-shame progress reflections.
          </p>

          <div className="solis-pact-form-group">
            <label htmlFor="pact-partner-name">Partner's Name (Optional)</label>
            <input
              id="pact-partner-name"
              type="text"
              placeholder="e.g. Alyssa Vance (or leave blank to invite via code)"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="solis-pact-modal-input"
            />
            <span className="solis-pact-input-hint">
              Leave blank if you plan to share an invite code with your peer later.
            </span>
          </div>

          <div className="solis-pact-form-group">
            <label htmlFor="pact-objective">Shared Weekly Objective</label>
            <input
              id="pact-objective"
              type="text"
              placeholder="e.g. Master dynamic programming & complete mock exam"
              value={sharedObjective}
              onChange={(e) => setSharedObjective(e.target.value)}
              className="solis-pact-modal-input"
            />
          </div>

          <div className="solis-pact-form-group">
            <label htmlFor="pact-subject">Subject Scope</label>
            <select
              id="pact-subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="solis-pact-modal-select"
            >
              <option value="all">All Subjects (General Focus)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Targets row */}
          <div className="solis-pact-targets-grid">
            <div className="solis-pact-target-card">
              <label htmlFor="pact-my-target">Your Weekly Pledge</label>
              <div className="solis-pact-minute-input-wrapper">
                <input
                  id="pact-my-target"
                  type="number"
                  min="15"
                  step="15"
                  value={myTargetMinutes}
                  onChange={(e) => setMyTargetMinutes(parseInt(e.target.value, 10) || 0)}
                  className="solis-pact-modal-input"
                />
                <span className="solis-pact-unit">minutes</span>
              </div>
              <span className="solis-pact-target-hrs">
                (~{(myTargetMinutes / 60).toFixed(1)} hrs/week)
              </span>
            </div>

            <div className="solis-pact-target-card">
              <label htmlFor="pact-partner-target">Peer's Weekly Pledge</label>
              <div className="solis-pact-minute-input-wrapper">
                <input
                  id="pact-partner-target"
                  type="number"
                  min="15"
                  step="15"
                  value={partnerTargetMinutes}
                  onChange={(e) => setPartnerTargetMinutes(parseInt(e.target.value, 10) || 0)}
                  className="solis-pact-modal-input"
                />
                <span className="solis-pact-unit">minutes</span>
              </div>
              <span className="solis-pact-target-hrs">
                (~{(partnerTargetMinutes / 60).toFixed(1)} hrs/week)
              </span>
            </div>
          </div>

          <div className="solis-pact-modal-actions">
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Pact...' : 'Create Study Pact'}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleJoinSubmit} className="solis-pact-form">
          <p className="solis-pact-form-lead">
            Have a 6-character code from a fellow scholar? Enter it below to join their study pact and link your mutual focus sessions.
          </p>

          <div className="solis-pact-form-group">
            <label htmlFor="pact-invite-code">Study Pact Invite Code</label>
            <input
              id="pact-invite-code"
              type="text"
              maxLength={8}
              placeholder="e.g. PACT9X"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              className="solis-pact-modal-input solis-pact-code-input"
              autoFocus
            />
          </div>

          <div className="solis-pact-form-group">
            <label htmlFor="pact-join-name">Your Display Name</label>
            <input
              id="pact-join-name"
              type="text"
              placeholder="e.g. Kunal Raj"
              value={joinDisplayName}
              onChange={(e) => setJoinDisplayName(e.target.value)}
              className="solis-pact-modal-input"
            />
          </div>

          <div className="solis-pact-modal-actions">
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Joining...' : 'Join Study Pact'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
