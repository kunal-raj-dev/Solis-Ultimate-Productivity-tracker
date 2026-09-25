import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card/Card';
import { calculateAvailableTime, AnyTimeBlock } from '../../../utils/calendar/availableTime';
import { DailyAvailableTimeReport } from '../../../types/calendar';
import { StudyPlanItem } from '../../../types/study';
import { formatDurationMinutes } from '../../../utils/formatters';

interface CalendarOverlayCardProps {
  date: string;
  solisBlocks?: AnyTimeBlock[];
  studyPlans?: StudyPlanItem[];
}

export const CalendarOverlayCard: React.FC<CalendarOverlayCardProps> = ({
  date,
  solisBlocks = [],
  studyPlans = []
}) => {
  // Computed honestly from the unified Solis schedule (time blocks, study plan,
  // routines projected by buildTimeBlocks) — no external calendar simulation.
  const report = useMemo<DailyAvailableTimeReport>(
    () => calculateAvailableTime({ date, externalEvents: [], solisBlocks, studyPlans }),
    [date, solisBlocks, studyPlans]
  );

  return (
    <Card className="solis-calendar-overlay-card" style={{ marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
      <CardHeader style={{ paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--color-coral-500)" />
          <CardTitle style={{ fontSize: 'var(--text-body-md)', fontWeight: 600 }}>
            Available Time Today
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        {/* Available-Time Metric Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'var(--bg-surface-secondary)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div>
            <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Planned Solis
            </span>
            <span style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--color-coral-500)' }}>
              {formatDurationMinutes(report.plannedSolisMinutes)}
            </span>
          </div>

          <div>
            <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              True Free Time
            </span>
            <span style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--color-sage-500)' }}>
              {formatDurationMinutes(report.unallocatedFreeMinutes)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
