import React from 'react';
import { Badge } from '../../ui/Badge/Badge';
import { CognitiveLoadReport } from '../../../utils/intelligence/masteryIntelligence';
import { Activity, AlertOctagon, AlertTriangle, Info } from 'lucide-react';

export interface CognitiveLoadAlertProps {
  report: CognitiveLoadReport;
}

export const CognitiveLoadAlert: React.FC<CognitiveLoadAlertProps> = ({ report }) => {
  const isHealthy = report.status === 'optimal' || report.status === 'moderate';

  const statusBadgeVariant =
    report.status === 'optimal'
      ? 'sage'
      : report.status === 'moderate'
      ? 'coral'
      : report.status === 'elevated'
      ? 'amber'
      : 'lavender';

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: isHealthy ? 'var(--bg-surface-primary)' : 'rgba(230, 90, 65, 0.06)',
        border: `1px solid ${isHealthy ? 'var(--border-subtle)' : 'rgba(230, 90, 65, 0.25)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--color-coral-500)" />
          <span style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
            Cognitive Load & Balance Sanctuary
          </span>
          <Badge variant={statusBadgeVariant}>
            {report.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          Balance Index: <strong>{report.score}/100</strong>
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        💡 <strong>Recommended Move:</strong> {report.recommendedAction}
      </p>

      {/* Alerts if any */}
      {report.alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
          {report.alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-surface-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-caption)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {alert.type === 'critical' ? (
                <AlertOctagon size={15} color="var(--color-coral-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : alert.type === 'warning' ? (
                <AlertTriangle size={15} color="var(--color-amber-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <Info size={15} color="var(--color-lavender-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                  {alert.title}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{alert.message}</span>
                <span style={{ display: 'block', color: 'var(--color-coral-500)', marginTop: '2px', fontWeight: 500 }}>
                  👉 {alert.suggestion}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
