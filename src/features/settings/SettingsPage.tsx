import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User, Sliders, Moon, Sun, Shield, LogOut, Download, FileJson, FileSpreadsheet, Upload, Bell, BookOpen, RotateCcw, Sparkles, Calendar, Check, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { SectionHeader } from '../../components/layout/SectionHeader/SectionHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card/Card';
import { Input } from '../../components/ui/Input/Input';
import { TimePicker } from '../../components/ui/DatePicker';
import { Switch } from '../../components/ui/Switch/Switch';
import { Select } from '../../components/ui/Select/Select';
import { ImportModal } from '../../components/features/ImportModal/ImportModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useGuide } from '../../context/GuideContext';
import { dataService } from '../../services/dataService';
import { aiService } from '../../services/ai/ai.service';
import { resetActivation } from '../../utils/activation';
import './SettingsPage.css';
import {
  createWorkspaceBackup,
  fetchAllTimeBlocks,
  convertTasksToCSV,
  convertStudySessionsToCSV,
  convertFocusSessionsToCSV,
  convertNotesToCSV,
  convertHabitsToCSV,
  convertGoalsToCSV,
  triggerDownload
} from '../../utils/export';
import { notificationService } from '../../services/notifications/notification.service';
import type { SmartNotificationPreferences } from '../../types/notification';
import type { UserPreferences } from '../../types/auth';
import { getISODateString } from '../../utils/date';
import { generateIcsCalendar } from '../../utils/calendar/icsGenerator';

/** Plan §1.6 — the Gemini key is a session-scoped secret, never a persistent one. */
const GEMINI_KEY_STORAGE = 'solis_gemini_api_key';

/** Reads the key from sessionStorage; lifts any legacy plaintext localStorage copy up. */
function readStoredGeminiKey(): string {
  try {
    const sessionKey = sessionStorage.getItem(GEMINI_KEY_STORAGE);
    if (sessionKey) return sessionKey;
    const legacyKey = localStorage.getItem(GEMINI_KEY_STORAGE);
    if (legacyKey) {
      // Secrets hygiene: remove the long-lived plaintext copy.
      sessionStorage.setItem(GEMINI_KEY_STORAGE, legacyKey);
      localStorage.removeItem(GEMINI_KEY_STORAGE);
    }
    return legacyKey || '';
  } catch {
    return '';
  }
}

/** Inline validation message below a bounded numeric input (plan §1.6). */
const FieldError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <p
      role="alert"
      style={{
        margin: '6px 0 0',
        fontSize: 'var(--text-caption, 12px)',
        color: 'var(--status-warning, #B45309)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      <AlertCircle size={12} /> {message}
    </p>
  );
};

export const SettingsPage: React.FC = () => {
  const { user, logout, isLoggingOut, updateProfile } = useAuth();
  const { theme, setTheme, density, setDensity, readableFont, setReadableFont } = useTheme();
  const { openGuide } = useGuide();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const savedLocalPrefs = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('solis_user_preferences');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [name, setName] = useState(user?.name || 'Scholar');
  const [email, setEmail] = useState(user?.email || '');
  const [focusField, setFocusField] = useState(user?.focusField || 'General Mastery');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    user?.preferences?.soundEnabled ?? savedLocalPrefs?.soundEnabled ?? true
  );
  const [focusDuration, setFocusDuration] = useState<string>(
    String(user?.preferences?.defaultFocusDurationMinutes ?? savedLocalPrefs?.defaultFocusDurationMinutes ?? 25)
  );
  const [breakDuration, setBreakDuration] = useState<string>(
    String(user?.preferences?.defaultBreakDurationMinutes ?? savedLocalPrefs?.defaultBreakDurationMinutes ?? 5)
  );
  const [dailyGoal, setDailyGoal] = useState<string>(
    String(user?.preferences?.dailyStudyGoalMinutes ?? savedLocalPrefs?.dailyStudyGoalMinutes ?? 360)
  );
  const [weekStart, setWeekStart] = useState(() => localStorage.getItem('solis_week_start') || 'monday');
  const [geminiApiKey, setGeminiApiKey] = useState(() => readStoredGeminiKey());
  const [geminiModel, setGeminiModel] = useState(() => {
    const stored = localStorage.getItem('solis_gemini_model');
    if (stored && (stored === 'gemini-2.5-flash' || stored.startsWith('gemini-1.5') || stored.startsWith('gemini-2.0'))) {
      return 'gemini-3.8-flash';
    }
    if (stored === 'gemini-3.8-pro' || stored === 'gemini-3.1-pro') {
      return 'gemini-3.1-pro-preview';
    }
    return stored || 'gemini-3.8-flash';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isAiTesting, setIsAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<SmartNotificationPreferences>(
    () => notificationService.getPreferences()
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    focusDuration?: string;
    breakDuration?: string;
    dailyGoal?: string;
  }>({});

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.focusField) setFocusField(user.focusField);
      if (user.preferences) {
        if (typeof user.preferences.soundEnabled === 'boolean') {
          setSoundEnabled(user.preferences.soundEnabled);
        }
        if (user.preferences.defaultFocusDurationMinutes) {
          setFocusDuration(String(user.preferences.defaultFocusDurationMinutes));
        }
        if (user.preferences.defaultBreakDurationMinutes) {
          setBreakDuration(String(user.preferences.defaultBreakDurationMinutes));
        }
        if (user.preferences.dailyStudyGoalMinutes) {
          setDailyGoal(String(user.preferences.dailyStudyGoalMinutes));
        }
      }
    }
  }, [user]);

  const handleExportFullBackup = async () => {
    setIsExporting(true);
    try {
      const [
        subjects,
        studyPlans,
        studySessions,
        focusSessions,
        tasks,
        habits,
        goals,
        notes,
        studyRoutines,
        studyResources,
        flashcards,
        dailyReflections,
        taskTimeBlocks
      ] = await Promise.all([
        dataService.study.getSubjects(true),
        dataService.study.getTodayPlan(),
        dataService.study.getRecentSessions(),
        dataService.focus.getRecentSessions(),
        dataService.tasks.getTasks(),
        dataService.habits.getHabits(),
        dataService.goals.getGoals(),
        dataService.notes.getNotes(),
        dataService.routines.getRoutines(),
        dataService.resources.getResources(),
        dataService.flashcards.getFlashcards(),
        // One reflection per day; 3650 covers ~10 years of daily entries.
        dataService.reflections.getReflections(3650),
        fetchAllTimeBlocks(dataService)
      ]);

      const topicsArrays = await Promise.all(subjects.map((s) => dataService.study.getTopics(s.id)));
      const topics = topicsArrays.flat();

      const backup = createWorkspaceBackup({
        profile: user,
        subjects,
        topics,
        studyPlans,
        studySessions,
        studyRoutines,
        studyResources,
        focusSessions,
        tasks,
        taskTimeBlocks,
        habits,
        goals,
        notes,
        flashcards,
        dailyReflections
      });

      const jsonStr = JSON.stringify(backup, null, 2);
      const dateStr = getISODateString(new Date());
      triggerDownload(jsonStr, `solis-backup-${dateStr}.json`, 'application/json');

      addToast({
        title: 'Backup Downloaded',
        description: 'Complete workspace backup (solis-export-v1) created successfully.',
        type: 'success'
      });
    } catch (err) {
      console.error('Export failed:', err);
      addToast({
        title: 'Export Failed',
        description: 'Could not generate full workspace backup. Please try again.',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Plan §8.1 — One-Way Read-Only `.ics` Calendar Feed: exports every
   * scheduled time block plus active exam-horizon dates as an RFC 5545
   * calendar file that Google Calendar / Apple Calendar can import or
   * subscribe to, with no two-way OAuth involved.
   */
  const handleDownloadIcsFeed = async () => {
    setIsExporting(true);
    try {
      const [timeBlocks, goals] = await Promise.all([
        fetchAllTimeBlocks(dataService),
        dataService.goals.getGoals()
      ]);
      const icsContent = generateIcsCalendar({ timeBlocks, examGoals: goals });
      const dateStr = getISODateString(new Date());
      triggerDownload(icsContent, `solis-calendar-feed-${dateStr}.ics`, 'text/calendar;charset=utf-8;');
      addToast({
        title: 'Calendar Feed Downloaded',
        description: 'Import the .ics file into Google Calendar or Apple Calendar to mirror your time blocks and exam dates.',
        type: 'success'
      });
    } catch (err) {
      console.error('ICS export failed:', err);
      addToast({
        title: 'Calendar Export Failed',
        description: 'Could not generate the .ics calendar feed. Please try again.',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async (entity: 'tasks' | 'study' | 'focus' | 'notes' | 'habits' | 'goals') => {
    setIsExporting(true);
    try {
      const dateStr = getISODateString(new Date());
      let csvContent = '';
      let filename = `solis-${entity}-${dateStr}.csv`;

      if (entity === 'tasks') {
        const data = await dataService.tasks.getTasks();
        csvContent = convertTasksToCSV(data);
      } else if (entity === 'study') {
        const data = await dataService.study.getRecentSessions();
        csvContent = convertStudySessionsToCSV(data);
      } else if (entity === 'focus') {
        const data = await dataService.focus.getRecentSessions();
        csvContent = convertFocusSessionsToCSV(data);
      } else if (entity === 'notes') {
        const data = await dataService.notes.getNotes();
        csvContent = convertNotesToCSV(data);
      } else if (entity === 'habits') {
        const data = await dataService.habits.getHabits();
        csvContent = convertHabitsToCSV(data);
      } else if (entity === 'goals') {
        const data = await dataService.goals.getGoals();
        csvContent = convertGoalsToCSV(data);
      }

      triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
      addToast({
        title: 'Collection Exported',
        description: `${entity.charAt(0).toUpperCase() + entity.slice(1)} exported to ${filename}.`,
        type: 'success'
      });
    } catch (err) {
      console.error('CSV Export failed:', err);
      addToast({
        title: 'Export Failed',
        description: `Could not export ${entity}. Please try again.`,
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  /** Plan §1.6 — integer bounds: focus 1–180m, break 1–60m, daily goal 15–960m. */
  const validateBounds = (): boolean => {
    const errors: typeof fieldErrors = {};
    const focus = Number.parseInt(focusDuration, 10);
    if (!Number.isInteger(focus) || focus < 1 || focus > 180) {
      errors.focusDuration = 'Focus block must be a whole number between 1 and 180 minutes.';
    }
    const brk = Number.parseInt(breakDuration, 10);
    if (!Number.isInteger(brk) || brk < 1 || brk > 60) {
      errors.breakDuration = 'Short rest must be a whole number between 1 and 60 minutes.';
    }
    const goal = Number.parseInt(dailyGoal, 10);
    if (!Number.isInteger(goal) || goal < 15 || goal > 960) {
      errors.dailyGoal = 'Daily capacity must be a whole number between 15 and 960 minutes.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const persistProfileToCloud = async (nextPreferences: Partial<UserPreferences>) => {
    await updateProfile({
      name: name.trim(),
      email: email.trim(),
      focusField: focusField.trim(),
      preferences: nextPreferences
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBounds()) {
      // Inline FieldError messages guide the fix; nothing is saved while
      // values are out of bounds.
      return;
    }
    const parsedFocus = Math.max(1, parseInt(focusDuration, 10) || 25);
    const parsedBreak = Math.max(1, parseInt(breakDuration, 10) || 5);
    const parsedDailyGoal = Math.max(15, parseInt(dailyGoal, 10) || 360);

    notificationService.updatePreferences(notifPrefs);
    localStorage.setItem('solis_week_start', weekStart);
    localStorage.setItem('solis_density', density);
    try {
      // Plan §1.6 — the Gemini key is session-scoped (see Solis Intelligence card).
      if (geminiApiKey.trim()) {
        sessionStorage.setItem(GEMINI_KEY_STORAGE, geminiApiKey.trim());
      } else {
        sessionStorage.removeItem(GEMINI_KEY_STORAGE);
      }
    } catch {
      // Storage unavailable — non-fatal.
    }
    localStorage.setItem('solis_gemini_model', geminiModel);

    const nextPreferences = {
      ...(user?.preferences || {}),
      theme,
      soundEnabled,
      defaultFocusDurationMinutes: parsedFocus,
      defaultBreakDurationMinutes: parsedBreak,
      dailyStudyGoalMinutes: parsedDailyGoal
    };

    try {
      // Plan §7.3: keep the readable-font choice in the same sanctioned
      // preferences JSON so a general Save never clobbers it.
      localStorage.setItem('solis_user_preferences', JSON.stringify({ ...nextPreferences, readableFont }));
    } catch {
      // Ignore storage errors
    }

    try {
      await persistProfileToCloud(nextPreferences);
      setCloudSyncError(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('solis:preferences-updated', { detail: nextPreferences }));
      }
      addToast({
        title: 'Preferences Saved',
        description: 'Your learner profile, focus timer durations, daily capacity, and notifications are updated.',
        type: 'success'
      });
    } catch (err: any) {
      // Local cache already written above; surface the cloud failure honestly.
      setCloudSyncError(err?.message || 'Could not reach the cloud.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('solis:preferences-updated', { detail: nextPreferences }));
      }
    }
  };

  const retryCloudSync = async () => {
    if (!validateBounds()) return;
    const parsedFocus = Math.max(1, parseInt(focusDuration, 10) || 25);
    const parsedBreak = Math.max(1, parseInt(breakDuration, 10) || 5);
    const parsedDailyGoal = Math.max(15, parseInt(dailyGoal, 10) || 360);
    const nextPreferences = {
      ...(user?.preferences || {}),
      theme,
      soundEnabled,
      defaultFocusDurationMinutes: parsedFocus,
      defaultBreakDurationMinutes: parsedBreak,
      dailyStudyGoalMinutes: parsedDailyGoal
    };
    setIsRetryingSync(true);
    try {
      await persistProfileToCloud(nextPreferences);
      setCloudSyncError(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('solis:preferences-updated', { detail: nextPreferences }));
      }
      addToast({
        title: 'Cloud Sync Restored',
        description: 'Your preferences are now synced to your account.',
        type: 'success'
      });
    } catch (err: any) {
      setCloudSyncError(err?.message || 'Could not reach the cloud.');
      addToast({
        title: 'Retry failed',
        description: err?.message || 'Cloud sync is still unavailable.',
        type: 'error'
      });
    } finally {
      setIsRetryingSync(false);
    }
  };

  const handleSaveIntelligence = () => {
    const trimmedKey = geminiApiKey.trim();
    try {
      if (trimmedKey) {
        sessionStorage.setItem(GEMINI_KEY_STORAGE, trimmedKey);
      } else {
        sessionStorage.removeItem(GEMINI_KEY_STORAGE);
      }
      localStorage.setItem('solis_gemini_model', geminiModel);
    } catch {
      // Honest failure: no simulated success state (master.md §1.2 rule 5).
      addToast({
        title: 'Could Not Save Key',
        description: 'Browser storage rejected the write. The key was not saved for this session.',
        type: 'error'
      });
      return;
    }
    const modelFriendlyName = geminiModel === 'gemini-3.1-pro-preview'
      ? 'Gemini 3.1 Pro'
      : geminiModel === 'gemini-3.8-flash'
        ? 'Gemini 3.8 Flash'
        : geminiModel;
    addToast({
      title: 'Intelligence Settings Saved',
      description: trimmedKey
        ? `API key saved for this browser session with ${modelFriendlyName}.`
        : 'API key cleared.',
      type: 'success'
    });
  };

  const handleTestIntelligence = async () => {
    const keyToTest =
      geminiApiKey.trim() ||
      (() => {
        try {
          return sessionStorage.getItem(GEMINI_KEY_STORAGE) || localStorage.getItem(GEMINI_KEY_STORAGE) || '';
        } catch {
          return '';
        }
      })();
    if (!keyToTest) {
      addToast({
        title: 'API Key Required',
        description: 'Please enter a Gemini API Key before testing.',
        type: 'warning'
      });
      return;
    }
    setIsAiTesting(true);
    setAiTestResult(null);
    try {
      const res = await aiService.testConnection(keyToTest, geminiModel);
      setAiTestResult(res);
      if (res.success) {
        addToast({
          title: 'Connection Succeeded',
          description: res.message,
          type: 'success'
        });
      } else {
        addToast({
          title: 'Connection Failed',
          description: res.message,
          type: 'error'
        });
      }
    } catch (err: any) {
      const msg = err?.message || 'Could not reach Gemini API.';
      setAiTestResult({ success: false, message: msg });
      addToast({
        title: 'Connection Error',
        description: msg,
        type: 'error'
      });
    } finally {
      setIsAiTesting(false);
    }
  };

  const handleEnableBrowserNotifications = async () => {
    const granted = await notificationService.requestBrowserPermission();
    if (granted) {
      addToast({
        title: 'Browser Notifications Active',
        description: 'Solis will deliver study prompts and timer completions.',
        type: 'success'
      });
    } else {
      addToast({
        title: 'Notifications Blocked',
        description: 'Permission denied. Please allow notifications in your browser settings.',
        type: 'warning'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      addToast({
        title: 'Signed out',
        description: 'Your study session has ended securely.',
        type: 'info'
      });
      navigate('/auth/login', { replace: true });
    } catch {
      navigate('/auth/login', { replace: true });
    }
  };

  return (
    <div>
      <SectionHeader
        tag={<Badge variant="neutral">Preferences</Badge>}
        title="System Settings"
        subtitle="Fine-tune your cognitive environment, focus durations, and study horizons."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="var(--color-coral-500)" />
                <CardTitle>Learner Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Primary Focus Field"
                  value={focusField}
                  onChange={(e) => setFocusField(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Focus Timer Configuration */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="var(--color-amber-500)" />
                <CardTitle>Focus Pod Timers</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="solis-settings-form-grid">
                  <div>
                    <Input
                      label="Focus Block (Minutes)"
                      type="number"
                      value={focusDuration}
                      onChange={(e) => {
                        setFocusDuration(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, focusDuration: undefined }));
                      }}
                      aria-invalid={Boolean(fieldErrors.focusDuration)}
                    />
                    <FieldError message={fieldErrors.focusDuration} />
                  </div>
                  <div>
                    <Input
                      label="Short Rest (Minutes)"
                      type="number"
                      value={breakDuration}
                      onChange={(e) => {
                        setBreakDuration(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, breakDuration: undefined }));
                      }}
                      aria-invalid={Boolean(fieldErrors.breakDuration)}
                    />
                    <FieldError message={fieldErrors.breakDuration} />
                  </div>
                </div>
                <div>
                  <Input
                    label="Daily Study Goal Target (Minutes)"
                    type="number"
                    value={dailyGoal}
                    onChange={(e) => {
                      setDailyGoal(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, dailyGoal: undefined }));
                    }}
                    aria-invalid={Boolean(fieldErrors.dailyGoal)}
                  />
                  <FieldError message={fieldErrors.dailyGoal} />
                </div>
                <div style={{ paddingTop: '8px' }}>
                  <Switch
                    label="Play ambient bell upon session completion"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                  />
                </div>

                <div className="solis-settings-form-grid--compact">
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                      Week Starts On
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button
                        type="button"
                        variant={weekStart === 'monday' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setWeekStart('monday')}
                      >
                        Monday
                      </Button>
                      <Button
                        type="button"
                        variant={weekStart === 'sunday' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setWeekStart('sunday')}
                      >
                        Sunday
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                      Interface Density
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button
                        type="button"
                        variant={density === 'comfortable' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setDensity('comfortable')}
                      >
                        Comfortable
                      </Button>
                      <Button
                        type="button"
                        variant={density === 'compact' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setDensity('compact')}
                      >
                        Compact
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Intelligence Configuration */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--color-coral-500)" />
                  <CardTitle>Solis Intelligence</CardTitle>
                </div>
                {geminiApiKey.trim() ? (
                  <Badge variant="sage" showDot>Active (this session)</Badge>
                ) : (
                  <Badge variant="neutral">Key Not Configured</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Provide a Google Gemini API Key to enable AI-powered study features (Flashcard Generation, Semantic Search, Weekly Synthesis, and &ldquo;Ask Solis&rdquo;). All core features work deterministically without a key.
                </p>
                <div
                  role="note"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md, 8px)',
                    background: 'rgba(217, 119, 6, 0.08)',
                    border: '1px solid rgba(217, 119, 6, 0.35)',
                    fontSize: 'var(--text-body-sm, 13px)',
                    color: 'var(--text-primary, #1C1917)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--color-amber-500, #D97706)' }} />
                  <span>
                    <strong>Session-only storage:</strong> your API key is kept in this browser tab&rsquo;s
                    sessionStorage and is cleared when the tab closes. It never leaves your device except in
                    direct requests to Google&rsquo;s Gemini API.
                  </span>
                </div>
                <Input
                  label="Gemini API Key"
                  type={showApiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => {
                    setGeminiApiKey(e.target.value);
                    if (aiTestResult) setAiTestResult(null);
                  }}
                  placeholder="AIzaSy..."
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  helperText="Stored in this browser tab's sessionStorage only — never written to persistent storage, never transmitted to external servers."
                />
                <Select
                  label="Gemini Model"
                  value={geminiModel}
                  onChange={(e) => {
                    setGeminiModel(e.target.value);
                    if (aiTestResult) setAiTestResult(null);
                  }}
                  options={[
                    { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Recommended — Fast & Intelligent)' },
                    { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (High Reasoning)' },
                    { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' }
                  ]}
                  helperText="Default: gemini-3.8-flash. Choose Gemini 3.8 Flash for fast daily operations or Gemini 3.1 Pro for deep multi-step reasoning."
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      leftIcon={<Save size={16} />}
                      onClick={handleSaveIntelligence}
                    >
                      Save Intelligence Settings
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      leftIcon={<Sparkles size={16} />}
                      onClick={handleTestIntelligence}
                      disabled={isAiTesting || !geminiApiKey.trim()}
                    >
                      {isAiTesting ? 'Testing Connection...' : 'Test Connection'}
                    </Button>
                  </div>
                  {(() => {
                    let hasSessionKey = false;
                    try {
                      hasSessionKey = Boolean(sessionStorage.getItem(GEMINI_KEY_STORAGE));
                    } catch {
                      hasSessionKey = false;
                    }
                    return hasSessionKey ? (
                      <span style={{ fontSize: 'var(--text-body-xs, 12px)', color: 'var(--color-sage-600, #10b981)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={13} /> Active in this session
                      </span>
                    ) : null;
                  })()}
                </div>

                {aiTestResult && (
                  <div
                    role="status"
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md, 8px)',
                      fontSize: 'var(--text-body-sm, 13px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: aiTestResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      border: `1px solid ${aiTestResult.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                      color: aiTestResult.success ? 'var(--color-sage-600, #10b981)' : 'var(--color-coral-500, #ef4444)'
                    }}
                  >
                    {aiTestResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
                    <span>{aiTestResult.message}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {theme === 'dark' ? (
                  <Moon size={18} color="var(--color-coral-500)" />
                ) : (
                  <Sun size={18} color="var(--color-coral-500)" />
                )}
                <CardTitle>Atmosphere Theme</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <Button
                  type="button"
                  variant={theme === 'light' ? 'primary' : 'outline'}
                  size="md"
                  leftIcon={<Sun size={16} />}
                  onClick={() => setTheme('light')}
                  aria-pressed={theme === 'light'}
                >
                  Warm Ivory (Day)
                </Button>
                <Button
                  type="button"
                  variant={theme === 'dark' ? 'primary' : 'outline'}
                  size="md"
                  leftIcon={<Moon size={16} />}
                  onClick={() => setTheme('dark')}
                  aria-pressed={theme === 'dark'}
                >
                  Deep Charcoal (Night)
                </Button>
                <Button
                  type="button"
                  variant={theme === 'sepia' ? 'primary' : 'outline'}
                  size="md"
                  leftIcon={<BookOpen size={16} />}
                  onClick={() => setTheme('sepia')}
                  aria-pressed={theme === 'sepia'}
                >
                  Sepia (Low-Stimulation)
                </Button>
                <Button
                  type="button"
                  variant={theme === 'system' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setTheme('system')}
                  aria-pressed={theme === 'system'}
                >
                  System (Auto)
                </Button>
              </div>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                {theme === 'dark'
                  ? 'Active: Deep Charcoal sanctuary with warm graphite tones.'
                  : theme === 'sepia'
                  ? 'Active: Sepia low-stimulation reading mode — warm monochrome palette with no saturated alert colors.'
                  : theme === 'light'
                  ? 'Active: Warm Ivory sunlit editorial environment.'
                  : 'Active: Automatically matches your operating system appearance.'}
              </p>

              {/* Plan §7.3: hyper-legible readable typefaces (OpenDyslexic / Atkinson) */}
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                  Hyper-Legible Typeface
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <Button
                    type="button"
                    variant={readableFont === 'default' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setReadableFont('default')}
                    aria-pressed={readableFont === 'default'}
                  >
                    Default
                  </Button>
                  <Button
                    type="button"
                    variant={readableFont === 'opendyslexic' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setReadableFont('opendyslexic')}
                    aria-pressed={readableFont === 'opendyslexic'}
                  >
                    OpenDyslexic
                  </Button>
                  <Button
                    type="button"
                    variant={readableFont === 'atkinson' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setReadableFont('atkinson')}
                    aria-pressed={readableFont === 'atkinson'}
                  >
                    Atkinson Hyperlegible
                  </Button>
                </div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                  Both typefaces ship with Solis and apply instantly. Timers and code keep their monospaced face for alignment.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification & Quiet Hours */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="var(--color-coral-500)" />
                <CardTitle>Notifications & Quiet Hours</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px' }}>
                  <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
                    Browser Notifications
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEnableBrowserNotifications}
                  >
                    Request Permission
                  </Button>
                </div>

                <Switch
                  label="Study Session & Queue Reminders"
                  checked={notifPrefs.studyReminders}
                  onChange={(e) => setNotifPrefs((prev) => ({ ...prev, studyReminders: e.target.checked }))}
                />
                <Switch
                  label="Focus Timer Completion Alerts"
                  checked={notifPrefs.focusReminders}
                  onChange={(e) => setNotifPrefs((prev) => ({ ...prev, focusReminders: e.target.checked }))}
                />
                <Switch
                  label="Daily Habit Consistency Nudges"
                  checked={notifPrefs.habitReminders}
                  onChange={(e) => setNotifPrefs((prev) => ({ ...prev, habitReminders: e.target.checked }))}
                />
                <Switch
                  label="Enable Quiet Hours (Suppress Non-Urgent Prompts)"
                  checked={notifPrefs.quietHoursEnabled}
                  onChange={(e) => setNotifPrefs((prev) => ({ ...prev, quietHoursEnabled: e.target.checked }))}
                />

                {notifPrefs.quietHoursEnabled && (
                  <div className="solis-settings-form-grid--compact">
                    <TimePicker
                      label="Quiet Hours Start"
                      value={notifPrefs.quietHoursStart}
                      onChange={(val) => setNotifPrefs((prev) => ({ ...prev, quietHoursStart: val }))}
                    />
                    <TimePicker
                      label="Quiet Hours End"
                      value={notifPrefs.quietHoursEnd}
                      onChange={(val) => setNotifPrefs((prev) => ({ ...prev, quietHoursEnd: val }))}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recurring Commitments */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--color-coral-500)" />
                <CardTitle>Recurring Commitments</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                  Recurring classes and commitments are managed as Routines on the Today page — use the Routines button in the 24-Hour Schedule header to create, pause, or remove them. Active routines project onto your daily schedule.
                </p>
                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  onClick={() => navigate('/app/dashboard')}
                >
                  Manage Routines
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Plan §1.6 — honest cloud-sync failure surfacing (never a "saved" claim). */}
          {cloudSyncError && (
            <div
              role="alert"
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md, 8px)',
                background: 'rgba(225, 90, 71, 0.08)',
                border: '1px solid rgba(225, 90, 71, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <span style={{ fontSize: 'var(--text-body-sm, 13px)', color: 'var(--text-primary, #1C1917)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} style={{ color: 'var(--status-error, #E11D48)', flexShrink: 0 }} />
                <span>
                  <strong>Cloud Sync Failed:</strong> Changes cached locally on this device only.
                </span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={retryCloudSync}
                isLoading={isRetryingSync}
              >
                Retry Sync
              </Button>
            </div>
          )}

          <div>
            <Button type="submit" variant="accent" size="lg" leftIcon={<Save size={16} />}>
              Save Preferences
            </Button>
          </div>
        </form>

        {/* Plan §8.1 — One-Way Read-Only .ics Calendar Feed */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--color-coral-500)" />
              <CardTitle>Calendar Feed (.ics)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Export your scheduled time blocks and upcoming exam dates as a standard RFC 5545
                <code style={{ fontFamily: 'var(--font-mono)', padding: '0 4px' }}>.ics</code> calendar file.
                Import it into Google Calendar or Apple Calendar — a one-way, read-only mirror of your Solis
                schedule with no two-way OAuth connection required. The file is a snapshot of the moment you
                download it: re-download after schedule changes to refresh what your calendar app shows.
              </p>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  leftIcon={<Calendar size={16} />}
                  onClick={handleDownloadIcsFeed}
                  isLoading={isExporting}
                >
                  Download .ics Calendar Feed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Ownership & Export Hub */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} color="var(--color-coral-500)" />
              <CardTitle>Data Ownership & Portability</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Your study history, notes, tasks, habits, and goals belong exclusively to you. All data is protected under PostgreSQL Row Level Security (RLS). You can download a complete backup at any time or export individual collections to CSV.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '6px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    leftIcon={<FileJson size={16} />}
                    onClick={handleExportFullBackup}
                    isLoading={isExporting}
                  >
                    Download Complete Workspace Backup (.json)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    leftIcon={<Upload size={16} />}
                    onClick={() => setIsImportModalOpen(true)}
                  >
                    Restore from Backup (.json)
                  </Button>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Export Individual Collections (.csv)
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<FileSpreadsheet size={14} />}
                      onClick={() => handleExportCSV('tasks')}
                      disabled={isExporting}
                    >
                      Tasks CSV
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<FileSpreadsheet size={14} />}
                      onClick={() => handleExportCSV('study')}
                      disabled={isExporting}
                    >
                      Study Sessions CSV
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<FileSpreadsheet size={14} />}
                      onClick={() => handleExportCSV('focus')}
                      disabled={isExporting}
                    >
                      Focus Sessions CSV
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<FileSpreadsheet size={14} />}
                      onClick={() => handleExportCSV('notes')}
                      disabled={isExporting}
                    >
                      Notes CSV
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<FileSpreadsheet size={14} />}
                      onClick={() => handleExportCSV('habits')}
                      disabled={isExporting}
                    >
                      Habits CSV
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<FileSpreadsheet size={14} />}
                      onClick={() => handleExportCSV('goals')}
                      disabled={isExporting}
                    >
                      Goals CSV
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learnability & Guidance */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--color-coral-500)" />
              <CardTitle>Learnability & Guidance System</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Solis features self-service guide documentation and adaptive onboarding to help you master every environment.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  leftIcon={<BookOpen size={16} />}
                  onClick={() => openGuide()}
                >
                  Open Guide Center
                </Button>
                <Button
                  type="button"
                  variant="subtle"
                  size="md"
                  leftIcon={<RotateCcw size={16} />}
                  onClick={() => {
                    resetActivation(user?.id);
                    addToast({
                      title: 'Onboarding Reset',
                      description: 'Getting Started walkthrough has been reset and will appear on your dashboard.',
                      type: 'info'
                    });
                    navigate('/app/dashboard?onboarding=true');
                  }}
                >
                  Replay Getting Started
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account & Session Security */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--text-secondary)" />
              <CardTitle>Account & Session Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                Signed in as <strong>{user?.email || 'scholar@solis.space'}</strong>. Ending your session clears all active authentication tokens.
              </p>
              <div style={{ paddingTop: '4px' }}>
                <Button
                  type="button"
                  variant="subtle"
                  size="md"
                  onClick={handleLogout}
                  isLoading={isLoggingOut}
                  leftIcon={<LogOut size={16} color="var(--status-error)" />}
                  style={{ color: 'var(--status-error)' }}
                >
                  Sign Out of Solis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
