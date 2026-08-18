import React from 'react';
import { Badge } from '../../ui/Badge/Badge';
import { RetentionForecast } from '../../../utils/intelligence/masteryIntelligence';
import { TrendingDown, Clock } from 'lucide-react';

export interface RetentionForecastGraphProps {
  topicTitle: string;
  forecast: RetentionForecast;
}

export const RetentionForecastGraph: React.FC<RetentionForecastGraphProps> = ({ topicTitle, forecast }) => {
  return (
    <div
      style={{
        padding: '12px 14px',
        backgroundColor: 'var(--bg-surface-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
            {topicTitle}
          </span>
          <span style={{ display: 'block', fontSize: 'var(--text-micro)', color: 'var(--text-secondary)' }}>
            Ebbinghaus Decay Curve Projection
          </span>
        </div>

        {forecast.daysUntilDecayBelow80 > 0 ? (
          <Badge variant="coral">
            <Clock size={12} style={{ marginRight: '4px' }} />
            {forecast.daysUntilDecayBelow80}d until &lt;80%
          </Badge>
        ) : (
          <Badge variant="amber">
            <TrendingDown size={12} style={{ marginRight: '4px' }} />
            Review Needed
          </Badge>
        )}
      </div>

      {/* Projection Bars: Today -> 7 Days -> 14 Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', marginTop: '4px' }}>
        <div style={{ padding: '6px 8px', backgroundColor: 'var(--bg-surface-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)', display: 'block' }}>Now</span>
          <strong style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-coral-500)' }}>{forecast.currentRetention}%</strong>
        </div>

        <div style={{ padding: '6px 8px', backgroundColor: 'var(--bg-surface-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)', display: 'block' }}>+7 Days</span>
          <strong style={{ fontSize: 'var(--text-body-sm)', color: forecast.forecast7Day >= 80 ? 'var(--color-sage-500)' : 'var(--color-amber-500)' }}>
            {forecast.forecast7Day}%
          </strong>
        </div>

        <div style={{ padding: '6px 8px', backgroundColor: 'var(--bg-surface-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)', display: 'block' }}>+14 Days</span>
          <strong style={{ fontSize: 'var(--text-body-sm)', color: forecast.forecast14Day >= 80 ? 'var(--color-sage-500)' : 'var(--color-coral-500)' }}>
            {forecast.forecast14Day}%
          </strong>
        </div>
      </div>
    </div>
  );
};
