import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, CheckCircle2, X, ArrowRight, Sparkles } from 'lucide-react';
import { SectionHeader } from '../../components/layout/SectionHeader/SectionHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Card, CardContent } from '../../components/ui/Card/Card';
import { EmptyState } from '../../components/feedback/EmptyState/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useGuide } from '../../context/GuideContext';
import { dataService } from '../../services/dataService';
import { Proposal } from '../../types/proposal';
import { formatErrorMessage } from '../../utils/errors';

/**
 * V2 Phase 1 (P1-13/C5) — the Triage inbox: every engine- or AI-proposed
 * change gathers here as one decision object with its evidence receipt.
 * Nothing edits the plan silently; this page is where the user disposes.
 */
export const TriagePage: React.FC = () => {
  const { addToast } = useToast();
  const { openGuide } = useGuide();
  const navigate = useNavigate();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const loadProposals = useCallback(async () => {
    try {
      const open = await dataService.proposals.list('open');
      setProposals(open);
    } catch (err) {
      console.error('Failed to load proposals:', err);
      addToast({ title: 'Could not load the triage inbox', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadProposals();
    const unsubscribe = dataService.subscribe(() => loadProposals(), ['proposals']);
    return () => unsubscribe();
  }, [loadProposals]);

  const handleApprove = async (proposal: Proposal) => {
    setDecidingId(proposal.id);
    try {
      await dataService.proposals.approve(proposal.id);

      // Insight-action proposals carry a route the approval executes — the
      // write-back loop closes with one tap, exactly as the research intends.
      const diff = (proposal.diff || {}) as { actionUrl?: string };
      if (diff.actionUrl) {
        navigate(diff.actionUrl);
        return;
      }

      addToast({ title: 'Proposal approved', description: proposal.title, type: 'success' });
      await loadProposals();
    } catch (err) {
      addToast({ title: 'Could not approve', description: formatErrorMessage(err), type: 'error' });
    } finally {
      setDecidingId(null);
    }
  };

  const handleDismiss = async (proposal: Proposal) => {
    setDecidingId(proposal.id);
    try {
      await dataService.proposals.dismiss(proposal.id);
      setProposals((prev) => prev.filter((p) => p.id !== proposal.id));
      addToast({
        title: 'Dismissed',
        description: 'Dismissed insights stay recorded — they will not nag you again.',
        type: 'info'
      });
    } catch (err) {
      addToast({ title: 'Could not dismiss', description: formatErrorMessage(err), type: 'error' });
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div className="solis-triage-view">
      <SectionHeader
        tag={<Badge variant="coral">Needs a decision</Badge>}
        title="Triage"
        subtitle="Every proposal Solis makes gathers here — with the evidence behind it. Nothing moves in your plan without your approval."
        guideId="triage"
        onOpenGuide={openGuide}
      />

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton height="92px" />
          <Skeleton height="92px" />
        </div>
      ) : proposals.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing needs a decision"
          description="Insights from your analytics, review proposals, and AI-drafted plans will appear here the moment Solis wants to change something. You always decide."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {proposals.map((proposal) => {
            const diff = (proposal.diff || {}) as { actionUrl?: string; actionLabel?: string };
            return (
              <Card key={proposal.id}>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Badge variant={proposal.source === 'ai' ? 'lavender' : 'amber'}>
                        {proposal.source === 'ai' ? 'AI proposal' : 'Engine proposal'}
                      </Badge>
                      <Badge variant="neutral" style={{ textTransform: 'capitalize' }}>
                        {proposal.kind.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <h3 style={{ margin: 0, fontSize: 'var(--text-body-md, 15px)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {proposal.title}
                    </h3>

                    {proposal.evidence && (
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-surface-secondary)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: 'var(--text-caption)',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5
                        }}
                      >
                        <strong style={{ color: 'var(--text-primary)' }}>Evidence:</strong> {proposal.evidence}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<X size={14} />}
                        onClick={() => handleDismiss(proposal)}
                        disabled={decidingId === proposal.id}
                      >
                        Dismiss
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="tactile-press"
                        leftIcon={diff.actionUrl ? <ArrowRight size={14} /> : <CheckCircle2 size={14} />}
                        onClick={() => handleApprove(proposal)}
                        disabled={decidingId === proposal.id}
                      >
                        {diff.actionLabel || 'Approve'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-caption)',
              color: 'var(--text-muted)'
            }}
          >
            <Sparkles size={13} aria-hidden="true" />
            <span>
              Dismissed proposals are never silently deleted — they stay in your history as the
              record of what Solis proposed and what you decided.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TriagePage;
