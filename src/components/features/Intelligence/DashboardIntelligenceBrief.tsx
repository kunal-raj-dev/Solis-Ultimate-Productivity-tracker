import React from 'react';
import { Gauge, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { ExplainableRecommendation } from '../../../types/learningIntelligence';
import { ProductivityScoreBreakdown } from '../../../utils/productivity';
import { DailySummary } from '../../../types/analytics';
import './DashboardIntelligenceBrief.css';

export interface DashboardIntelligenceBriefProps {
  breakdown: ProductivityScoreBreakdown;
  summary: DailySummary;
  topRecommendations: ExplainableRecommendation[];
  onRecommendationAction: (rec: ExplainableRecommendation) => void;
}

function formatStudyMinutes(minutes: number): string {
  if (!minutes) return '0m studied';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m studied`;
  return m > 0 ? `${h}h ${m}m studied` : `${h}h studied`;
}

/**
 * Phase 0 P0.4/P0.5 — surfaces what the intelligence engine already computes:
 * the deterministic daily momentum score and the top 1–2 explainable study
 * recommendations, as a compact strip under the dashboard greeting.
 */
export const DashboardIntelligenceBrief: React.FC<DashboardIntelligenceBriefProps> = ({
  breakdown,
  summary,
  topRecommendations,
  onRecommendationAction
}) => {
  const contextLine = [
    formatStudyMinutes(summary.totalStudyMinutes),
    `${summary.completedTasksCount}/${summary.totalTasksCount} tasks done`,
    `${summary.habitsCompletedRatio} habits`
  ].join(' · ');

  return (
    <div className="solis-intel-brief" role="region" aria-label="Daily momentum and study recommendation">
      <div className="solis-intel-brief__score" title="Momentum = 30% tasks + 30% study + 20% focus + 20% habits">
        <Gauge size={18} className="solis-intel-brief__score-icon" aria-hidden="true" />
        <div className="solis-intel-brief__score-body">
          <span className="solis-intel-brief__score-value">
            {breakdown.totalMomentumScore}
            <span className="solis-intel-brief__score-max">/100</span>
          </span>
          <span className="solis-intel-brief__score-label">Daily Momentum</span>
          <span className="solis-intel-brief__context">{contextLine}</span>
        </div>
      </div>

      <div className="solis-intel-brief__recs">
        {topRecommendations.length === 0 ? (
          <p className="solis-intel-brief__empty">
            Log a few study sessions and Solis will suggest what to study next.
          </p>
        ) : (
          topRecommendations.map((rec, index) => (
            <div
              key={rec.id}
              className={`solis-intel-brief__rec ${index === 0 ? 'solis-intel-brief__rec--primary' : ''}`}
            >
              <Sparkles size={14} className="solis-intel-brief__rec-icon" aria-hidden="true" />
              <div className="solis-intel-brief__rec-text">
                <span className="solis-intel-brief__rec-title">{rec.title}</span>
                <span className="solis-intel-brief__rec-why" title={rec.evidence}>
                  {rec.evidence}
                </span>
              </div>
              <Button
                variant={index === 0 ? 'subtle' : 'ghost'}
                size="sm"
                className="solis-intel-brief__rec-action tactile-press"
                onClick={() => onRecommendationAction(rec)}
                title={rec.whyExplanation}
              >
                {rec.actionLabel}
                <ArrowRight size={12} />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
