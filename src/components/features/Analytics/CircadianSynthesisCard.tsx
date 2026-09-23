import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  ArrowRight,
  ShieldAlert,
  Compass
} from 'lucide-react';
import { Card } from '../../ui/Card/Card';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Progress } from '../../ui/Progress/Progress';
import {
  CircadianResonanceResult
} from '../../../utils/intelligence/circadianSynthesis';
import './CircadianSynthesisCard.css';

export interface CircadianSynthesisCardProps {
  synthesis: CircadianResonanceResult;
  onActionClick?: (payload: any) => void;
  className?: string;
}

export const CircadianSynthesisCard: React.FC<CircadianSynthesisCardProps> = ({
  synthesis,
  onActionClick,
  className
}) => {
  const navigate = useNavigate();
  const {
    phase,
    solarTimestamp,
    solarElevationDegrees,
    archetitle,
    advice,
    biologicalContext,
    capacityRemainingMinutes,
    capacityPercentUsed,
    isCeilingReached,
    primaryAction,
    resonanceMetrics
  } = synthesis;

  const handleLaunchPrimary = () => {
    if (!primaryAction) return;

    if (onActionClick) {
      onActionClick(primaryAction.actionPayload);
      return;
    }

    const { type, subjectId, topicId, durationMinutes } = primaryAction.actionPayload;
    if (type === 'start_focus') {
      const subjectParam = subjectId ? `&subjectId=${subjectId}` : '';
      const topicParam = topicId ? `&topicId=${topicId}` : '';
      navigate(`/app/focus?duration=${durationMinutes || 25}${subjectParam}${topicParam}`);
    } else if (type === 'drill_flashcards') {
      navigate('/app/study');
    } else if (type === 'open_study_plan') {
      navigate('/app/study');
    } else {
      navigate('/app/tasks');
    }
  };

  const phaseBadgeVariant =
    phase === 'zenith'
      ? 'coral'
      : phase === 'dawn'
      ? 'amber'
      : phase === 'dusk'
      ? 'lavender'
      : 'neutral';

  return (
    <Card
      variant="primary"
      className={`solis-circadian-synthesis-card ${className || ''}`}
      role="region"
      aria-label="Circadian Creative Synthesis Advisory"
    >
      {/* Top Chronobiological Telemetry Header */}
      <div className="solis-synthesis-header">
        <div className="solis-synthesis-header__meta">
          <div className="solis-synthesis-solar-indicator">
            <span className="solis-synthesis-solar-indicator__orbit">
              <Sun size={14} className="solis-synthesis-solar-icon" aria-hidden="true" />
            </span>
            <span className="solis-synthesis-solar-text">{solarTimestamp}</span>
            <span className="solis-synthesis-divider">•</span>
            <span className="solis-synthesis-elevation">
              ALT {solarElevationDegrees > 0 ? `+${solarElevationDegrees}°` : `${solarElevationDegrees}°`}
            </span>
          </div>
          <Badge variant={phaseBadgeVariant} showDot={true}>
            {phase.toUpperCase()} PHASE
          </Badge>
        </div>

        <div className="solis-synthesis-capacity-meter">
          <div className="solis-synthesis-capacity-info">
            <span className="solis-synthesis-capacity-label">Cognitive Budget</span>
            <span className="solis-synthesis-capacity-val">
              {capacityRemainingMinutes}m left ({capacityPercentUsed}% spent)
            </span>
          </div>
          <Progress
            value={capacityPercentUsed}
            variant={isCeilingReached ? 'coral' : capacityPercentUsed > 75 ? 'amber' : 'sage'}
            size="sm"
          />
        </div>
      </div>

      {/* Main Archival Lead */}
      <div className="solis-synthesis-body">
        <h3 className="solis-synthesis-title">{archetitle}</h3>
        <p className="solis-synthesis-advice">{advice}</p>
        <p className="solis-synthesis-context">{biologicalContext}</p>
      </div>

      {/* Primary Resonant Action Anchor */}
      {primaryAction && (
        <div className="solis-synthesis-action-panel">
          <div className="solis-synthesis-action-info">
            <div className="solis-synthesis-action-badge-row">
              <span className="solis-synthesis-action-kicker">
                <Compass size={12} className="inline mr-1" aria-hidden="true" />
                HIGHEST CIRCADIAN RESONANCE
              </span>
              <span className="solis-synthesis-resonance-score">
                Fit Score: {resonanceMetrics.circadianFitScore}/100
              </span>
            </div>
            <h4 className="solis-synthesis-action-title">{primaryAction.title}</h4>
            <div className="solis-synthesis-action-evidence">
              <span className="solis-synthesis-evidence-tag">Evidence:</span> {primaryAction.evidence}
            </div>
          </div>

          <div className="solis-synthesis-action-cta">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight size={14} />}
              onClick={handleLaunchPrimary}
              data-cursor="action"
            >
              {primaryAction.actionLabel || 'Launch Focus'}
            </Button>
          </div>
        </div>
      )}

      {/* Ceiling Warning if reached */}
      {isCeilingReached && (
        <div className="solis-synthesis-ceiling-alert" role="alert">
          <ShieldAlert size={15} color="var(--accent-terracotta)" aria-hidden="true" />
          <span>
            Daily 5.5h deep cognitive ceiling reached. Solis advises transitioning to passive reading or archival closure.
          </span>
        </div>
      )}
    </Card>
  );
};
