import React, { useState } from 'react';
import {
  CloudStudyPact,
  normalizePactPerspective,
  StudyPactWeekSummary,
  buildCloudPactSummary
} from '../../../types/studyPact';
import { StudySession } from '../../../types/study';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import {
  Users,
  Copy,
  Check,
  RefreshCw,
  Award,
  Calendar,
  Target,
  Trash2,
  Clock,
  ArrowRight
} from 'lucide-react';
import './StudyPactCard.css';

export interface StudyPactCardProps {
  pact: CloudStudyPact;
  currentUserId?: string;
  sessions?: StudySession[];
  onSyncMinutes?: (pactId: string, minutes: number) => Promise<void>;
  onClosePact?: (pactId: string, summary: StudyPactWeekSummary) => Promise<void>;
  onDeletePact?: (pactId: string) => Promise<void>;
}

export const StudyPactCard: React.FC<StudyPactCardProps> = ({
  pact,
  currentUserId,
  sessions = [],
  onSyncMinutes,
  onClosePact,
  onDeletePact
}) => {
  const norm = normalizePactPerspective(pact, currentUserId);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(norm.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Compute minutes from real study sessions within the pact's week window
  const computedLoggedMinutes = React.useMemo(() => {
    if (!sessions || sessions.length === 0) return 0;
    const start = new Date(pact.weekStartDate + 'T00:00:00');
    const end = new Date(pact.weekEndDate + 'T23:59:59.999');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    return sessions.reduce((acc, sess) => {
      const sessDate = new Date(sess.completedAt);
      if (isNaN(sessDate.getTime())) return acc;
      if (sessDate.getTime() < start.getTime() || sessDate.getTime() > end.getTime()) {
        return acc;
      }
      if (pact.subjectId && sess.subjectId !== pact.subjectId) {
        return acc;
      }
      return acc + Math.max(0, Math.round(sess.durationMinutes || 0));
    }, 0);
  }, [sessions, pact.weekStartDate, pact.weekEndDate, pact.subjectId]);

  const handleAutoSync = async () => {
    if (!onSyncMinutes) return;
    try {
      setIsSyncing(true);
      await onSyncMinutes(pact.id, computedLoggedMinutes);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (!onSyncMinutes) return;
    const val = parseInt(manualInput, 10);
    if (isNaN(val) || val < 0) return;
    try {
      setIsSyncing(true);
      await onSyncMinutes(pact.id, val);
      setManualInput('');
      setShowManualInput(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloseWeek = async () => {
    if (!onClosePact) return;
    try {
      setIsClosing(true);
      const summary = buildCloudPactSummary(pact, currentUserId);
      await onClosePact(pact.id, summary);
    } finally {
      setIsClosing(false);
    }
  };

  const isPending = pact.status === 'pending';
  const isCompleted = pact.status === 'completed';

  return (
    <div className={`solis-study-pact-card ${isCompleted ? 'is-completed' : ''}`}>
      {/* Header */}
      <div className="solis-pact-card-header">
        <div className="solis-pact-header-left">
          <div className="solis-pact-title-row">
            <Users size={18} className="solis-pact-icon" />
            <h3 className="solis-pact-title">
              Pact with {norm.partnerDisplayName}
            </h3>
            {isPending && (
              <Badge variant="amber" showDot>
                Awaiting Partner
              </Badge>
            )}
            {pact.status === 'active' && (
              <Badge variant="sage" showDot>
                Active
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="neutral">
                Completed Week
              </Badge>
            )}
            {norm.mutualCommitmentMet && (
              <Badge variant="sage" showDot>
                Mutual Commitment Met
              </Badge>
            )}
          </div>

          <div className="solis-pact-meta-row">
            <span className="solis-pact-meta-item">
              <Calendar size={13} />
              {norm.weekStartDate} → {norm.weekEndDate}
            </span>
            {norm.subjectName && (
              <span className="solis-pact-meta-item">
                <Target size={13} />
                {norm.subjectName}
              </span>
            )}
            {norm.sharedObjective && (
              <span className="solis-pact-meta-item solis-pact-objective">
                "{norm.sharedObjective}"
              </span>
            )}
          </div>
        </div>

        {/* Invite Code or Actions */}
        <div className="solis-pact-header-right">
          {isPending && (
            <div className="solis-pact-invite-box">
              <span className="solis-pact-invite-label">Invite Code:</span>
              <button
                type="button"
                className="solis-pact-invite-code-btn"
                onClick={handleCopyCode}
                title="Click to copy invite code"
              >
                <code>{norm.inviteCode}</code>
                {copiedCode ? <Check size={14} color="var(--color-sage-500)" /> : <Copy size={14} />}
              </button>
            </div>
          )}
          {norm.isCreator && onDeletePact && !isCompleted && (
            <button
              type="button"
              className="solis-pact-delete-btn"
              onClick={() => onDeletePact(pact.id)}
              title="Disband Pact"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Dual Progress Sections */}
      <div className="solis-pact-dual-progress">
        {/* User Progress */}
        <div className="solis-pact-progress-column">
          <div className="solis-pact-column-header">
            <div className="solis-pact-user-label">
              <span className="solis-pact-avatar-chip">You</span>
              <strong>{norm.myName}</strong>
            </div>
            <div className="solis-pact-minutes-tally">
              <span className="solis-tally-current">{norm.myConfirmedMinutes}</span>
              <span className="solis-tally-sep">/</span>
              <span className="solis-tally-target">{norm.myTargetMinutes}m</span>
              <span className="solis-tally-percent">({norm.myProgressPercent}%)</span>
            </div>
          </div>

          <div className="solis-pact-bar-track">
            <div
              className="solis-pact-bar-fill solis-bar-user"
              style={{ width: `${Math.min(100, norm.myProgressPercent)}%` }}
            />
          </div>

          {/* Quick sync options */}
          {!isCompleted && onSyncMinutes && (
            <div className="solis-pact-sync-actions">
              <Button
                variant="subtle"
                size="sm"
                leftIcon={<RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />}
                onClick={handleAutoSync}
                disabled={isSyncing}
              >
                Sync Logged Sessions ({computedLoggedMinutes}m)
              </Button>
              <button
                type="button"
                className="solis-pact-manual-toggle"
                onClick={() => setShowManualInput(!showManualInput)}
              >
                {showManualInput ? 'Cancel' : 'Enter Manually'}
              </button>
            </div>
          )}

          {showManualInput && !isCompleted && (
            <div className="solis-pact-manual-input-row">
              <input
                type="number"
                min="0"
                placeholder="Minutes"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="solis-pact-input"
              />
              <Button variant="outline" size="sm" onClick={handleManualSync} disabled={isSyncing}>
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Partner Progress */}
        <div className="solis-pact-progress-column">
          <div className="solis-pact-column-header">
            <div className="solis-pact-user-label">
              <span className="solis-pact-avatar-chip solis-chip-partner">Peer</span>
              <strong>{norm.partnerDisplayName}</strong>
            </div>
            <div className="solis-pact-minutes-tally">
              {isPending ? (
                <span className="solis-tally-pending">Pledged {norm.partnerTargetMinutes}m</span>
              ) : (
                <>
                  <span className="solis-tally-current">{norm.partnerConfirmedMinutes}</span>
                  <span className="solis-tally-sep">/</span>
                  <span className="solis-tally-target">{norm.partnerTargetMinutes}m</span>
                  <span className="solis-tally-percent">({norm.partnerProgressPercent}%)</span>
                </>
              )}
            </div>
          </div>

          <div className="solis-pact-bar-track">
            <div
              className="solis-pact-bar-fill solis-bar-partner"
              style={{
                width: isPending ? '0%' : `${Math.min(100, norm.partnerProgressPercent)}%`
              }}
            />
          </div>

          <div className="solis-pact-partner-footnote">
            {isPending ? (
              <span className="solis-footnote-muted">
                Share invite code <code>{norm.inviteCode}</code> with your peer to link study sessions.
              </span>
            ) : (
              <span className="solis-footnote-muted">
                Peer progress updates via verified check-ins and cloud synchronization.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Completed Summary Narrative */}
      {isCompleted && (
        <div className="solis-pact-summary-box">
          <div className="solis-pact-summary-header">
            <Award size={15} color="var(--color-amber-500)" />
            <span>End-of-Week Reflection</span>
          </div>
          <p className="solis-pact-narrative">
            {pact.summary?.narrative || buildCloudPactSummary(pact, currentUserId).narrative}
          </p>
          {pact.completedAt && (
            <span className="solis-pact-closed-time">
              Concluded on {new Date(pact.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Week End Actions */}
      {!isCompleted && onClosePact && (
        <div className="solis-pact-footer-actions">
          {norm.isWeekOver && (
            <span className="solis-pact-week-over-note">
              <Clock size={13} /> This pact's week has concluded.
            </span>
          )}
          <Button
            variant="subtle"
            size="sm"
            rightIcon={<ArrowRight size={14} />}
            onClick={handleCloseWeek}
            disabled={isClosing}
          >
            {isClosing ? 'Closing Week...' : 'Close Week & Save Summary'}
          </Button>
        </div>
      )}
    </div>
  );
};
