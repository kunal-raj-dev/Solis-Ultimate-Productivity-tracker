import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Settings2, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card/Card';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import { calculateAvailableTime, AnyTimeBlock } from '../../../utils/calendar/availableTime';
import { DailyAvailableTimeReport, ExternalCalendarEvent } from '../../../types/calendar';
import { StudyPlanItem } from '../../../types/study';
import { formatDurationMinutes } from '../../../utils/formatters';
import { calendarService } from '../../../services/calendar/calendar.service';
import { CalendarFeedModal } from './CalendarFeedModal';

interface CalendarOverlayCardProps {
  date: string;
  solisBlocks?: AnyTimeBlock[];
  studyPlans?: StudyPlanItem[];
  onOpenFeedModal?: () => void;
}

export const CalendarOverlayCard: React.FC<CalendarOverlayCardProps> = ({
  date,
  solisBlocks = [],
  studyPlans = [],
  onOpenFeedModal
}) => {
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [externalEvents, setExternalEvents] = useState<ExternalCalendarEvent[]>([]);
  const feedsCount = calendarService.getFeeds().filter((f) => f.enabled).length;

  useEffect(() => {
    const updateEvents = () => {
      setExternalEvents(calendarService.getAllEvents(date));
    };

    updateEvents();
    const unsubscribe = calendarService.subscribe(updateEvents);
    return unsubscribe;
  }, [date]);

  // Computed honestly from unified Solis schedule + live external calendar feeds
  const report = useMemo<DailyAvailableTimeReport>(
    () => calculateAvailableTime({ date, externalEvents, solisBlocks, studyPlans }),
    [date, externalEvents, solisBlocks, studyPlans]
  );

  const handleOpenFeeds = () => {
    if (onOpenFeedModal) {
      onOpenFeedModal();
    } else {
      setIsFeedModalOpen(true);
    }
  };

  return (
    <>
      <Card className="solis-calendar-overlay-card" style={{ marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
        <CardHeader style={{ paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--color-coral-500)" />
              <CardTitle style={{ fontSize: 'var(--text-body-md)', fontWeight: 600 }}>
                Available Time &amp; Schedule Realism
              </CardTitle>
              {feedsCount > 0 && (
                <Badge variant="sage" style={{ fontSize: '10px' }}>
                  {feedsCount} Feed{feedsCount > 1 ? 's' : ''} Synced
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Settings2 size={13} />}
              onClick={handleOpenFeeds}
              style={{ fontSize: 'var(--text-caption)', height: '28px' }}
            >
              Feeds (.ics)
            </Button>
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
          </div>

          {/* Schedule Conflicts Alert Banner */}
          {report.conflicts.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {report.conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(230, 90, 65, 0.08)',
                    border: '1px solid rgba(230, 90, 65, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-caption)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={15} color="var(--color-coral-500)" style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Clash:</strong> &quot;{conflict.solisPlanTitle || 'Solis Block'}&quot; overlaps with external &quot;{conflict.externalEventTitle}&quot; ({conflict.externalStartTime.slice(11, 16)}–{conflict.externalEndTime.slice(11, 16)})
                    </span>
                  </div>
                  {conflict.suggestedAction.proposedStartTime && (
                    <span style={{ fontSize: '11px', color: 'var(--color-coral-500)', fontWeight: 600 }}>
                      Suggested: {conflict.suggestedAction.proposedStartTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CalendarFeedModal
        isOpen={isFeedModalOpen}
        onClose={() => setIsFeedModalOpen(false)}
      />
    </>
  );
};
