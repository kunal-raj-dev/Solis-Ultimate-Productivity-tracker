import { IAnalyticsService } from '../../api.interface';
import { DailySummary, ProductivityMetric, DayStudyHeatmap } from '../../../types/analytics';
import { getISODateString } from '../../../utils/date';
import { calculateDailySummary } from '../../../utils/productivity';
import { queryCache } from '../../cache';
import { SupabaseServiceContext } from './types';

export class SupabaseAnalyticsService implements IAnalyticsService {
  constructor(private ctx: SupabaseServiceContext) {}

  getDailySummary = async (): Promise<DailySummary> => {
    const cacheKey = 'daily_summary';
    const cached = queryCache.get<DailySummary>(cacheKey);
    if (cached) return cached;

    const services = this.ctx.getServices();
    const [tasks, studySessions, focusSessions, habits, user] = await Promise.all([
      services.tasks.getTasks(),
      services.study.getRecentSessions(),
      services.focus.getRecentSessions(),
      services.habits.getHabits(),
      services.auth.getCurrentUser()
    ]);

    const { summary } = calculateDailySummary({
      tasks,
      studySessions,
      focusSessions,
      habits,
      dailyStudyGoalMinutes: user?.preferences?.dailyStudyGoalMinutes || 180,
      targetFocusMinutes: 120
    });

    queryCache.set(cacheKey, summary);
    return summary;
  };

  getProductivityMetrics = async (): Promise<ProductivityMetric[]> => {
    const services = this.ctx.getServices();
    const [tasks, studySessions, focusSessions, habits, user] = await Promise.all([
      services.tasks.getTasks(),
      services.study.getRecentSessions(),
      services.focus.getRecentSessions(),
      services.habits.getHabits(),
      services.auth.getCurrentUser()
    ]);

    const { summary, breakdown } = calculateDailySummary({
      tasks,
      studySessions,
      focusSessions,
      habits,
      dailyStudyGoalMinutes: user?.preferences?.dailyStudyGoalMinutes || 180,
      targetFocusMinutes: 120
    });

    return [
      { id: 'm1', label: 'Tasks Velocity', value: `${breakdown.taskScore}%`, changePercentage: null, trend: null, timeframe: 'today' },
      { id: 'm2', label: 'Study Volume', value: `${summary.totalStudyMinutes}m`, changePercentage: null, trend: null, timeframe: 'today' },
      { id: 'm3', label: 'Deep Focus Rate', value: `${breakdown.focusScore}%`, changePercentage: null, trend: null, timeframe: 'today' },
      { id: 'm4', label: 'Ritual Consistency', value: `${breakdown.habitScore}%`, changePercentage: null, trend: null, timeframe: 'today' }
    ];
  };

  getStudyHeatmap = async (days = 28): Promise<DayStudyHeatmap[]> => {
    const services = this.ctx.getServices();
    const sessions = await services.study.getRecentSessions();
    const heatmap: DayStudyHeatmap[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getISODateString(d);

      const daySessions = sessions.filter((s) => s.completedAt.startsWith(dateStr));
      const totalMinutes = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (totalMinutes > 0 && totalMinutes < 45) level = 1;
      else if (totalMinutes >= 45 && totalMinutes < 90) level = 2;
      else if (totalMinutes >= 90 && totalMinutes < 150) level = 3;
      else if (totalMinutes >= 150) level = 4;

      heatmap.push({
        date: dateStr,
        hours: Math.round((totalMinutes / 60) * 10) / 10,
        level
      });
    }

    return heatmap;
  };
}
