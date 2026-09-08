import React from 'react';
import { Bookmark, Plus, AlertCircle } from 'lucide-react';
import { SectionHeader } from '../../../components/layout/SectionHeader/SectionHeader';
import { Badge } from '../../../components/ui/Badge/Badge';
import { Button } from '../../../components/ui/Button/Button';
import { ParallaxScene } from '../../../components/parallax/ParallaxScene';
import { ParallaxLayer } from '../../../components/parallax/ParallaxLayer';
import { AtmosphericOrb } from '../../../components/parallax/AtmosphericOrb';
import { StudySubject } from '../../../types/study';
import { StudyResource } from '../../../types/resource';

export interface SubjectListHeaderProps {
  resources: StudyResource[];
  subjects: StudySubject[];
  activeCount: number;
  archivedCount: number;
  subjectViewTab: 'active' | 'archived';
  onSelectTab: (tab: 'active' | 'archived') => void;
  onOpenResourceModal: () => void;
  onOpenAddSubjectModal: () => void;
  onOpenLogSessionModal: () => void;
  onOpenGuide: (guideId: string) => void;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  isRetrying: boolean;
  onRetry: () => void;
}

export const SubjectListHeader: React.FC<SubjectListHeaderProps> = ({
  resources,
  subjects,
  activeCount,
  archivedCount,
  subjectViewTab,
  onSelectTab,
  onOpenResourceModal,
  onOpenAddSubjectModal,
  onOpenLogSessionModal,
  onOpenGuide,
  syncStatus,
  isRetrying,
  onRetry
}) => {
  return (
    <>
      <ParallaxScene className="depth-1" style={{ borderRadius: 'var(--radius-2xl)', padding: 'var(--space-xl) var(--space-lg)' }}>
        <ParallaxLayer speed={0.04} isAbsolute>
          <AtmosphericOrb color="amber" sizePx={260} top="-30px" right="-20px" opacity={0.3} />
        </ParallaxLayer>
        <ParallaxLayer speed={0}>
          <SectionHeader
            tag={<Badge variant="amber">Study Architecture</Badge>}
            title="Study Sessions & Planning"
            subtitle="Manage subject syllabi, log focused cognitive blocks, and track weekly hour targets."
            guideId="study-studio"
            onOpenGuide={onOpenGuide}
            actions={
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button
                  variant="outline"
                  size="md"
                  className="tactile-press"
                  leftIcon={<Bookmark size={16} />}
                  onClick={onOpenResourceModal}
                >
                  Resource Library ({resources.length})
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="tactile-press"
                  leftIcon={<Plus size={16} />}
                  onClick={onOpenAddSubjectModal}
                >
                  Add Subject
                </Button>
                <Button
                  variant="accent"
                  size="md"
                  className="tactile-press"
                  leftIcon={<Plus size={16} />}
                  onClick={onOpenLogSessionModal}
                >
                  Log Session
                </Button>
              </div>
            }
          />
        </ParallaxLayer>
      </ParallaxScene>

      {/* Active vs Archived Subjects Tabs */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onSelectTab('active')}
              className="tactile-press"
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: 'var(--text-body-sm)',
                border: '1px solid',
                borderColor: subjectViewTab === 'active' ? 'var(--color-coral-500)' : 'var(--border-subtle)',
                background: subjectViewTab === 'active' ? 'var(--color-coral-500)' : 'var(--bg-surface-secondary)',
                color: subjectViewTab === 'active' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Active Subjects ({activeCount})
            </button>
            <button
              onClick={() => onSelectTab('archived')}
              className="tactile-press"
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: 'var(--text-body-sm)',
                border: '1px solid',
                borderColor: subjectViewTab === 'archived' ? 'var(--color-coral-500)' : 'var(--border-subtle)',
                background: subjectViewTab === 'archived' ? 'var(--color-coral-500)' : 'var(--bg-surface-secondary)',
                color: subjectViewTab === 'archived' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Archived ({archivedCount})
            </button>
          </div>
        </div>

        {/* Non-blocking background sync warning if data exists in memory */}
        {syncStatus === 'error' && subjects.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              backgroundColor: 'var(--status-warning-bg)',
              border: '1px solid var(--status-warning)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-md)',
              fontSize: 'var(--text-caption)',
              color: 'var(--text-primary)',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} color="var(--color-amber-500)" />
              <span>Couldn&apos;t sync latest changes with server. Displaying last saved version.</span>
            </div>
            <Button variant="outline" size="sm" onClick={onRetry} isLoading={isRetrying}>
              Retry Sync
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
