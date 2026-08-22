import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User, Sliders, Moon, Sun, Shield, LogOut, Download, FileJson, FileSpreadsheet, Upload, Bell, BookOpen, RotateCcw } from 'lucide-react';
import { SectionHeader } from '../../components/layout/SectionHeader/SectionHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card/Card';
import { Input } from '../../components/ui/Input/Input';
import { Switch } from '../../components/ui/Switch/Switch';
import { ImportModal } from '../../components/features/ImportModal/ImportModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useGuide } from '../../context/GuideContext';
import { dataService } from '../../services/dataService';
import { resetActivation } from '../../utils/activation';
import './SettingsPage.css';
import {
  createWorkspaceBackup,
  convertTasksToCSV,
  convertStudySessionsToCSV,
  convertFocusSessionsToCSV,
  convertNotesToCSV,
  convertHabitsToCSV,
  convertGoalsToCSV,
  triggerDownload
} from '../../utils/export';
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  requestNotificationPermission,
  NotificationPreferences
} from '../../utils/notifications';
import { getISODateString } from '../../utils/date';

export const SettingsPage: React.FC = () => {
  const { user, logout, isLoggingOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { openGuide } = useGuide();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || 'Scholar');
  const [email, setEmail] = useState(user?.email || '');
  const [focusField, setFocusField] = useState(user?.focusField || 'General Mastery');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [focusDuration, setFocusDuration] = useState('25');
  const [breakDuration, setBreakDuration] = useState('5');
  const [dailyGoal, setDailyGoal] = useState('180');
  const [weekStart, setWeekStart] = useState(() => localStorage.getItem('solis_week_start') || 'monday');
  const [density, setDensity] = useState(() => localStorage.getItem('solis_density') || 'comfortable');
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(loadNotificationPreferences);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.focusField) setFocusField(user.focusField);
    }
  }, [user]);

  const handleExportFullBackup = async () => {
    setIsExporting(true);
    try {
      const [subjects, studyPlans, studySessions, focusSessions, tasks, habits, goals, notes] = await Promise.all([
        dataService.study.getSubjects(true),
        dataService.study.getTodayPlan(),
        dataService.study.getRecentSessions(),
        dataService.focus.getRecentSessions(),
        dataService.tasks.getTasks(),
        dataService.habits.getHabits(),
        dataService.goals.getGoals(),
        dataService.notes.getNotes()
      ]);

      const topicsArrays = await Promise.all(subjects.map((s) => dataService.study.getTopics(s.id)));
      const topics = topicsArrays.flat();

      const backup = createWorkspaceBackup({
        profile: user,
        subjects,
        topics,
        studyPlans,
        studySessions,
        focusSessions,
        tasks,
        habits,
        goals,
        notes
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveNotificationPreferences(notifPrefs);
    localStorage.setItem('solis_week_start', weekStart);
    localStorage.setItem('solis_density', density);
    addToast({
      title: 'Preferences Saved',
      description: 'Your study system configuration, calendar, and notification preferences are updated.',
      type: 'success'
    });
  };

  const handleEnableBrowserNotifications = async () => {
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
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
                  <Input
                    label="Focus Block (Minutes)"
                    type="number"
                    value={focusDuration}
                    onChange={(e) => setFocusDuration(e.target.value)}
                  />
                  <Input
                    label="Short Rest (Minutes)"
                    type="number"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(e.target.value)}
                  />
                </div>
                <Input
                  label="Daily Study Goal Target (Minutes)"
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(e.target.value)}
                />
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
                  : theme === 'light'
                  ? 'Active: Warm Ivory sunlit editorial environment.'
                  : 'Active: Automatically matches your operating system appearance.'}
              </p>
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
                    <Input
                      label="Quiet Hours Start"
                      type="time"
                      value={notifPrefs.quietHoursStart}
                      onChange={(e) => setNotifPrefs((prev) => ({ ...prev, quietHoursStart: e.target.value }))}
                    />
                    <Input
                      label="Quiet Hours End"
                      type="time"
                      value={notifPrefs.quietHoursEnd}
                      onChange={(e) => setNotifPrefs((prev) => ({ ...prev, quietHoursEnd: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div>
            <Button type="submit" variant="accent" size="lg" leftIcon={<Save size={16} />}>
              Save Preferences
            </Button>
          </div>
        </form>

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
