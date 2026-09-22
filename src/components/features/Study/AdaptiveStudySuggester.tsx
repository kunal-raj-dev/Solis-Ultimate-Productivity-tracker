import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { Sparkles, BrainCircuit, ArrowRight } from 'lucide-react';
import { aiService } from '../../../services/ai/ai.service';
import { dataService } from '../../../services/dataService';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  buildAdaptiveStudyContext,
  resolveStudySuggestionRoute,
  generateDeterministicStudyRecommendations
} from '../../../utils/study/adaptivePlanner';

export const AdaptiveStudySuggester: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[] | null>(null);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      // Gather context
      const subjects = await dataService.study.getSubjects();
      const sessions = await dataService.study.getRecentSessions();
      const contextData = buildAdaptiveStudyContext(subjects, sessions);

      try {
        const sugs = await aiService.suggestNextStudyActions(contextData);
        setSuggestions(sugs);
      } catch (aiErr: any) {
        // Fallback to deterministic algorithmic recommendations
        console.warn('AI unavailable, falling back to deterministic recommendations:', aiErr);
        const fallback = generateDeterministicStudyRecommendations({
          subjects,
          recentSessions: sessions
        });
        setSuggestions(fallback);
        addToast({
          title: 'Algorithmic Suggestions',
          description: 'Loaded deterministic study recommendations (AI offline/unconfigured).',
          type: 'info'
        });
      }
    } catch (err: any) {
      addToast({ title: 'Intelligence Error', description: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card style={{ marginBottom: '20px', border: '1px solid var(--color-coral-500)', boxShadow: '0 4px 12px rgba(215, 107, 72, 0.05)' }}>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainCircuit size={18} color="var(--color-coral-500)" />
          <CardTitle>Solis Adaptive Planner</CardTitle>
        </div>
        {!suggestions && (
          <Button variant="accent" size="sm" leftIcon={<Sparkles size={14} />} onClick={fetchSuggestions} isLoading={isLoading}>
            Analyze & Suggest
          </Button>
        )}
      </CardHeader>
      
      {suggestions && (
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: 0 }}>
              Based on your mastery signals and recent gaps, here are the most high-yield study actions:
            </p>
            {suggestions.map((sug, i) => (
              <div key={i} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>{sug.title}</div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '4px' }}>{sug.reason}</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  rightIcon={<ArrowRight size={14} />}
                  onClick={() => navigate(resolveStudySuggestionRoute(sug), {
                    state: {
                      subjectId: sug.actionPayload?.subjectId,
                      title: sug.title
                    }
                  })}
                >
                  Action
                </Button>
              </div>
            ))}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
               <Button variant="ghost" size="sm" onClick={() => setSuggestions(null)}>Dismiss</Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
