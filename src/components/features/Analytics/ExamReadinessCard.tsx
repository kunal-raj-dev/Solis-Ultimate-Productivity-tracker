import React from 'react';
import { Badge } from '../../ui/Badge/Badge';
import { Progress } from '../../ui/Progress/Progress';
import { ExamReadinessResult } from '../../../utils/intelligence/masteryIntelligence';
import { AlertTriangle } from 'lucide-react';
import './ExamReadinessCard.css';

export interface ExamReadinessCardProps {
  result: ExamReadinessResult;
  goalTitle: string;
}

export const ExamReadinessCard: React.FC<ExamReadinessCardProps> = ({ result, goalTitle }) => {
  return (
    <div className="solis-readiness-card">
      <div className="solis-readiness-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Badge variant={result.gradeColor}>{result.grade}</Badge>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              {result.daysRemaining} days remaining
            </span>
          </div>
          <h4 style={{ margin: 0, fontSize: 'var(--text-heading-3)', fontWeight: 600 }}>
            {goalTitle}
          </h4>
        </div>

        <div className="solis-readiness-score-display">
          <span className="solis-readiness-number">{result.readinessScore}%</span>
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Exam Readiness
          </span>
        </div>
      </div>

      {/* 4-Component Progress Breakdown */}
      <div className="solis-readiness-grid">
        <div className="solis-readiness-component">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Topics (35%)</span>
            <strong>{result.componentScores.topicsScore}%</strong>
          </div>
          <Progress value={result.componentScores.topicsScore} variant="coral" size="sm" />
        </div>

        <div className="solis-readiness-component">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>SM-2 Recall (30%)</span>
            <strong>{result.componentScores.retentionScore}%</strong>
          </div>
          <Progress value={result.componentScores.retentionScore} variant="amber" size="sm" />
        </div>

        <div className="solis-readiness-component">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Habits (20%)</span>
            <strong>{result.componentScores.habitScore}%</strong>
          </div>
          <Progress value={result.componentScores.habitScore} variant="sage" size="sm" />
        </div>

        <div className="solis-readiness-component">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Milestones (15%)</span>
            <strong>{result.componentScores.milestoneScore}%</strong>
          </div>
          <Progress value={result.componentScores.milestoneScore} variant="lavender" size="sm" />
        </div>
      </div>

      {/* Actionable Risk Diagnostics */}
      {result.riskDiagnostics.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          {result.riskDiagnostics.map((diag, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                backgroundColor: 'rgba(230, 90, 65, 0.08)',
                border: '1px solid rgba(230, 90, 65, 0.2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-caption)',
                color: 'var(--text-primary)'
              }}
            >
              <AlertTriangle size={14} color="var(--color-coral-500)" style={{ flexShrink: 0 }} />
              <span>{diag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
