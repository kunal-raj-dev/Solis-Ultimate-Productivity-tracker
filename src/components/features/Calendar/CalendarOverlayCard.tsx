import React, { useState, useEffect } from 'react';
import {
  Calendar,
  AlertTriangle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card/Card';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { calendarService } from '../../../services/calendar/calendar.service';
import { DailyAvailableTimeReport, CalendarConflictAlert } from '../../../types/calendar';
import { AnyTimeBlock } from '../../../utils/calendar/availableTime';
import { StudyPlanItem } from '../../../types/study';
import { formatDurationMinutes } from '../../../utils/formatters';

interface CalendarOverlayCardProps {
  date: string;
  solisBlocks?: AnyTimeBlock[];
  studyPlans?: StudyPlanItem[];
  onResolveConflict?: (conflict: CalendarConflictAlert) => void;
}

export const CalendarOverlayCard: React.FC<CalendarOverlayCardProps> = ({
  date,
  solisBlocks = [],
  studyPlans = [],
  onResolveConflict
}) => {
  const [report, setReport] = useState<DailyAvailableTimeReport>(() =>
    calendarService.getAvailableTimeReport(date, solisBlocks, studyPlans)
  );
  const [config, setConfig] = useState(calendarService.getConfig());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const update = () => {
      setConfig(calendarService.getConfig());
      setReport(calendarService.getAvailableTimeReport(date, solisBlocks, studyPlans));
    };

    update();
    const unsub = calendarService.subscribe(update);
    return () => unsub();
  }, [date, solisBlocks, studyPlans]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await calendarService.syncNow();
    } finally {
      setIsSyncing(false);
    }
  };

  const isConnected = config.status === 'synced' || config.status === 'syncing';

  return (
    <Card className="solis-calendar-overlay-card" style={{ marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
      <CardHeader style={{ paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--color-coral-500)" />
            <CardTitle style={{ fontSize: 'var(--text-body-md)', fontWeight: 600 }}>
              External Schedule & Available Time
            </CardTitle>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge variant={isConnected ? 'sage' : 'neutral'} style={{ fontSize: '11px', textTransform: 'capitalize' }}>
              {isConnected ? 'Calendar Synced' : 'Offline / Unlinked'}
            </Badge>
            {isConnected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                isLoading={isSyncing}
                title="Sync calendar now"
                aria-label="Sync external calendar"
              >
                <RefreshCw size={13} className={isSyncing ? 'solis-spin' : ''} />
              </Button>
            )}
          </div>
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
            borderRadius: 'var(--radius-md)',
            marginBottom: report.conflicts.length > 0 ? '16px' : '12px'
          }}
        >
          <div>
            <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              External Busy
            </span>
            <span style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatDurationMinutes(report.externalCommitmentsMinutes)}
            </span>
          </div>

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

          <div>
            <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Focus Windows (≥45m)
            </span>
            <span style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--color-lavender-500)' }}>
              {report.availableSlots.filter((s) => s.isOptimalForFocus).length} Slots
            </span>
          </div>
        </div>

        {/* Conflict Alerts if any */}
        {report.conflicts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {report.conflicts.map((conflict) => (
              <div
                key={conflict.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(215, 107, 72, 0.08)',
                  border: '1px solid rgba(215, 107, 72, 0.3)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={16} color="var(--color-coral-500)" />
                  <div>
                    <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {conflict.title}
                    </div>
                    <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                      {conflict.description}
                    </div>
                  </div>
                </div>

                {onResolveConflict && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResolveConflict(conflict)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {conflict.suggestedAction.label}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Optimal Continuous Study Slots */}
        {report.availableSlots.filter((s) => s.isOptimalForFocus).length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
            <Zap size={14} color="var(--color-lavender-400)" />
            <span>
              Best open study blocks today:{' '}
              {report.availableSlots
                .filter((s) => s.isOptimalForFocus)
                .slice(0, 2)
                .map((s) => `${s.startTime}–${s.endTime} (${s.durationMinutes}m)`)
                .join(', ')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
