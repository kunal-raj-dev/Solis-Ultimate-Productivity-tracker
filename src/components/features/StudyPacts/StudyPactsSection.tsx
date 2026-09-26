import React, { useState, useEffect, useCallback } from 'react';
import dataService from '../../../services/dataService';
import {
  CloudStudyPact,
  CreateStudyPactPayload,
  StudyPactWeekSummary
} from '../../../types/studyPact';
import { StudySession, StudySubject } from '../../../types/study';
import { StudyPactCard } from './StudyPactCard';
import { CreateStudyPactModal } from './CreateStudyPactModal';
import { Button } from '../../ui/Button/Button';
import { EmptyState } from '../../feedback/EmptyState/EmptyState';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { Users, Plus, Award, ShieldCheck, Loader2 } from 'lucide-react';
import './StudyPactsSection.css';

export interface StudyPactsSectionProps {
  subjects?: StudySubject[];
}

export const StudyPactsSection: React.FC<StudyPactsSectionProps> = ({ subjects = [] }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [pacts, setPacts] = useState<CloudStudyPact[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [loadedPacts, loadedSessions] = await Promise.all([
        dataService.pacts.getPacts(),
        dataService.study.getRecentSessions()
      ]);
      setPacts(loadedPacts);
      setSessions(loadedSessions);
    } catch (err: any) {
      console.error('Failed to load study pacts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = dataService.subscribe(loadData, ['pacts', 'study']);
    return () => unsubscribe();
  }, [loadData]);

  const activePacts = pacts.filter((p) => p.status === 'active' || p.status === 'pending');
  const completedPacts = pacts.filter((p) => p.status === 'completed');

  const handleCreatePact = async (payload: CreateStudyPactPayload) => {
    try {
      const newPact = await dataService.pacts.createPact(payload);
      addToast({
        title: 'Study Pact Created',
        description: `Invite code: ${newPact.inviteCode}. Share this with your study partner.`,
        type: 'success'
      });
      await loadData();
    } catch (err: any) {
      addToast({
        title: 'Could not create pact',
        description: err?.message || 'Please check your inputs and try again.',
        type: 'error'
      });
      throw err;
    }
  };

  const handleJoinPact = async (inviteCode: string, partnerName?: string) => {
    try {
      const joined = await dataService.pacts.joinPactByInviteCode(inviteCode, partnerName);
      addToast({
        title: 'Joined Study Pact!',
        description: `You are now accountable with ${joined.creatorName} for this week.`,
        type: 'success'
      });
      await loadData();
    } catch (err: any) {
      addToast({
        title: 'Failed to join pact',
        description: err?.message || 'Check the invite code and try again.',
        type: 'error'
      });
      throw err;
    }
  };

  const handleSyncMinutes = async (pactId: string, minutes: number) => {
    try {
      await dataService.pacts.syncPactMinutes(pactId, minutes);
      addToast({
        title: 'Pact Minutes Synchronized',
        description: `${minutes} verified study minutes synced to the cloud.`,
        type: 'success'
      });
      await loadData();
    } catch (err: any) {
      addToast({
        title: 'Sync failed',
        description: err?.message || 'Could not update pact minutes.',
        type: 'error'
      });
    }
  };

  const handleClosePact = async (pactId: string, summary: StudyPactWeekSummary) => {
    try {
      await dataService.pacts.completePact(pactId, summary);
      addToast({
        title: 'Study Pact Concluded',
        description: 'Your end-of-week reflection has been archived below.',
        type: 'info'
      });
      await loadData();
    } catch (err: any) {
      addToast({
        title: 'Failed to close week',
        description: err?.message || 'Could not conclude pact.',
        type: 'error'
      });
    }
  };

  const handleDeletePact = async (pactId: string) => {
    if (!window.confirm('Are you sure you want to disband this study pact?')) return;
    try {
      await dataService.pacts.deletePact(pactId);
      addToast({
        title: 'Study Pact Disbanded',
        description: 'The pact has been removed.',
        type: 'info'
      });
      await loadData();
    } catch (err: any) {
      addToast({
        title: 'Failed to delete',
        description: err?.message || 'Could not remove pact.',
        type: 'error'
      });
    }
  };

  if (isLoading && pacts.length === 0) {
    return (
      <div className="solis-pacts-loading">
        <Loader2 className="animate-spin" size={24} color="var(--color-coral-500)" />
        <span>Loading study pacts...</span>
      </div>
    );
  }

  return (
    <div className="solis-study-pacts-section">
      {/* Top Banner & Action */}
      <div className="solis-pacts-section-header">
        <div>
          <h3 className="solis-pacts-section-title">
            <ShieldCheck size={20} color="var(--color-coral-500)" />
            Multi-User Study Pacts
          </h3>
          <p className="solis-pacts-section-subtitle">
            Weekly mutual accountability between peers. Track verified focus minutes without shame or surveillance.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsModalOpen(true)}
        >
          Form or Join Pact
        </Button>
      </div>

      {/* Active Pacts List */}
      <div className="solis-pacts-list-container">
        {activePacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Active Study Pacts"
            description="Commit to weekly goals with a friend or peer scholar. Solis syncs your logged sessions and keeps you mutually accountable."
            actionLabel="Form a Study Pact"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="solis-active-pacts-grid">
            {activePacts.map((pact) => (
              <StudyPactCard
                key={pact.id}
                pact={pact}
                currentUserId={user?.id}
                sessions={sessions}
                onSyncMinutes={handleSyncMinutes}
                onClosePact={handleClosePact}
                onDeletePact={handleDeletePact}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Completed Pacts & Reflections */}
      {completedPacts.length > 0 && (
        <div className="solis-past-pacts-wrapper">
          <div className="solis-past-pacts-header">
            <Award size={18} color="var(--color-amber-500)" />
            <h4>End-of-Week Summaries &amp; Archived Pacts</h4>
          </div>

          <div className="solis-past-pacts-grid">
            {completedPacts.map((pact) => (
              <StudyPactCard
                key={pact.id}
                pact={pact}
                currentUserId={user?.id}
                sessions={sessions}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create / Join Modal */}
      <CreateStudyPactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subjects={subjects}
        userDisplayName={user?.name}
        onCreatePact={handleCreatePact}
        onJoinPact={handleJoinPact}
      />
    </div>
  );
};
