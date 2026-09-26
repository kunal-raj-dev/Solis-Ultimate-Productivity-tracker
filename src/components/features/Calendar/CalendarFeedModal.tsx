import React, { useState, useEffect } from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Badge } from '../../ui/Badge/Badge';
import { Textarea } from '../../ui/Textarea/Textarea';
import {
  Calendar,
  RefreshCw,
  Trash2,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { calendarService, CalendarFeed } from '../../../services/calendar/calendar.service';
import './CalendarFeedModal.css';

export interface CalendarFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFeedsUpdated?: () => void;
}

const COLOR_OPTIONS = [
  { label: 'Coral', value: '#E65A41' },
  { label: 'Sage', value: '#4E8752' },
  { label: 'Amber', value: '#D97706' },
  { label: 'Lavender', value: '#8B5CF6' },
  { label: 'Sky Blue', value: '#0284C7' },
  { label: 'Teal', value: '#0D9488' }
];

export const CalendarFeedModal: React.FC<CalendarFeedModalProps> = ({
  isOpen,
  onClose,
  onFeedsUpdated
}) => {
  const [tab, setTab] = useState<'feeds' | 'add_url' | 'import_file'>('feeds');
  const [feeds, setFeeds] = useState<CalendarFeed[]>([]);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // New URL Form
  const [feedName, setFeedName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  // Import raw .ics Form
  const [importName, setImportName] = useState('');
  const [importIcsText, setImportIcsText] = useState('');
  const [importColor, setImportColor] = useState(COLOR_OPTIONS[1].value);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const refreshFeeds = () => {
    setFeeds(calendarService.getFeeds());
  };

  useEffect(() => {
    if (isOpen) {
      refreshFeeds();
      const unsub = calendarService.subscribe(() => {
        refreshFeeds();
        if (onFeedsUpdated) onFeedsUpdated();
      });
      return unsub;
    }
  }, [isOpen, onFeedsUpdated]);

  if (!isOpen) return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedUrl.trim()) return;

    setIsSubscribing(true);
    setSubscribeError(null);
    try {
      await calendarService.addFeed({
        name: feedName.trim() || 'External Calendar',
        url: feedUrl.trim(),
        color: selectedColor,
        autoSync: true
      });
      setFeedName('');
      setFeedUrl('');
      setTab('feeds');
      refreshFeeds();
      if (onFeedsUpdated) onFeedsUpdated();
    } catch (err: unknown) {
      setSubscribeError(
        err instanceof Error
          ? err.message
          : 'Could not fetch or parse the calendar feed. Verify URL or try manual import.'
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!importName) {
      setImportName(file.name.replace(/\.ics$/i, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportIcsText(text);
    };
    reader.readAsText(file);
  };

  const handleManualImport = () => {
    if (!importIcsText.trim()) return;

    const res = calendarService.importIcsString(
      importName.trim() || 'Imported Calendar',
      importIcsText,
      importColor
    );

    setImportSuccess(`Successfully imported ${res.events.length} events!`);
    setImportName('');
    setImportIcsText('');
    setTimeout(() => {
      setImportSuccess(null);
      setTab('feeds');
      refreshFeeds();
      if (onFeedsUpdated) onFeedsUpdated();
    }, 1200);
  };

  const handleToggleFeed = (id: string) => {
    calendarService.toggleFeed(id);
    refreshFeeds();
    if (onFeedsUpdated) onFeedsUpdated();
  };

  const handleDeleteFeed = (id: string) => {
    calendarService.deleteFeed(id);
    refreshFeeds();
    if (onFeedsUpdated) onFeedsUpdated();
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      await calendarService.syncAllFeeds();
      refreshFeeds();
      if (onFeedsUpdated) onFeedsUpdated();
    } finally {
      setIsSyncingAll(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="External Calendar Subscriptions (.ics Feeds)"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Navigation Tabs */}
        <div className="solis-cal-modal-tabs">
          <button
            type="button"
            className={`solis-cal-tab-btn ${tab === 'feeds' ? 'solis-cal-tab-btn--active' : ''}`}
            onClick={() => setTab('feeds')}
          >
            Subscribed Feeds ({feeds.length})
          </button>
          <button
            type="button"
            className={`solis-cal-tab-btn ${tab === 'add_url' ? 'solis-cal-tab-btn--active' : ''}`}
            onClick={() => setTab('add_url')}
          >
            + Add URL Feed
          </button>
          <button
            type="button"
            className={`solis-cal-tab-btn ${tab === 'import_file' ? 'solis-cal-tab-btn--active' : ''}`}
            onClick={() => setTab('import_file')}
          >
            Upload / Paste .ics
          </button>
        </div>

        {/* Tab 1: Subscribed Feeds */}
        {tab === 'feeds' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                Harmonize university timetables, Canvas LMS, and Google Calendar.
              </span>
              {feeds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw size={14} className={isSyncingAll ? 'solis-spin' : ''} />}
                  onClick={handleSyncAll}
                  disabled={isSyncingAll}
                >
                  Sync Now
                </Button>
              )}
            </div>

            {feeds.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 16px',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <Calendar size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: 'var(--text-body-md)' }}>No Feeds Subscribed Yet</h4>
                <p style={{ margin: '0 0 16px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                  Subscribe to your Google Calendar, Canvas timetable, or Apple Calendar iCal URL.
                </p>
                <Button variant="accent" size="sm" onClick={() => setTab('add_url')}>
                  + Add Calendar Feed
                </Button>
              </div>
            ) : (
              <div>
                {feeds.map((feed) => (
                  <div key={feed.id} className="solis-cal-feed-row">
                    <div className="solis-cal-feed-info">
                      <div className="solis-cal-color-dot" style={{ backgroundColor: feed.color }} />
                      <div className="solis-cal-feed-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="solis-cal-feed-name">{feed.name}</span>
                          <Badge
                            variant={
                              feed.syncStatus === 'synced'
                                ? 'sage'
                                : feed.syncStatus === 'error'
                                ? 'coral'
                                : feed.syncStatus === 'syncing'
                                ? 'amber'
                                : 'neutral'
                            }
                            style={{ fontSize: '10px' }}
                          >
                            {feed.syncStatus}
                          </Badge>
                        </div>
                        <div className="solis-cal-feed-meta">
                          <span>{feed.eventCount} events</span>
                          <span>•</span>
                          <span>{feed.url.startsWith('local://') ? 'Manual Import' : 'Live Subscription'}</span>
                          {feed.lastSyncedAt && (
                            <>
                              <span>•</span>
                              <span>Synced {new Date(feed.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </>
                          )}
                        </div>
                        {feed.errorMessage && (
                          <span style={{ fontSize: '11px', color: 'var(--color-coral-500)', marginTop: '2px' }}>
                            {feed.errorMessage}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="solis-cal-actions">
                      <button
                        type="button"
                        onClick={() => handleToggleFeed(feed.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: feed.enabled ? 'var(--color-sage-500)' : 'var(--text-muted)' }}
                        title={feed.enabled ? 'Disable Feed' : 'Enable Feed'}
                      >
                        {feed.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFeed(feed.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        title="Delete Feed"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Add URL Feed */}
        {tab === 'add_url' && (
          <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: 'var(--text-caption)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Calendar Name
              </label>
              <Input
                placeholder="e.g. University Lectures or Canvas LMS"
                value={feedName}
                onChange={(e) => setFeedName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-caption)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                iCalendar Subscription Feed URL
              </label>
              <Input
                placeholder="https://... or webcal://..."
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Google Calendar: Calendar Settings &gt; Integrate Calendar &gt; Secret address in iCal format.
              </span>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-caption)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Color Indicator
              </label>
              <div className="solis-cal-color-palette">
                {COLOR_OPTIONS.map((c) => (
                  <div
                    key={c.value}
                    className={`solis-cal-color-option ${selectedColor === c.value ? 'solis-cal-color-option--selected' : ''}`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setSelectedColor(c.value)}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {subscribeError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(230, 90, 65, 0.08)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-caption)',
                  color: 'var(--color-coral-500)'
                }}
              >
                <AlertCircle size={16} />
                <span>{subscribeError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="ghost" size="sm" type="button" onClick={() => setTab('feeds')}>
                Cancel
              </Button>
              <Button variant="accent" size="sm" type="submit" disabled={isSubscribing || !feedUrl.trim()}>
                {isSubscribing ? 'Subscribing...' : 'Subscribe & Sync'}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Upload / Paste .ics */}
        {tab === 'import_file' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: 'var(--text-caption)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Calendar Name
              </label>
              <Input
                placeholder="e.g. Fall 2026 Timetable"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-caption)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Upload .ics File
              </label>
              <input
                type="file"
                accept=".ics,text/calendar"
                onChange={handleFileUpload}
                style={{ fontSize: 'var(--text-caption)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-caption)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Or Paste RFC 5545 iCalendar Text
              </label>
              <Textarea
                placeholder="BEGIN:VCALENDAR&#10;...&#10;END:VCALENDAR"
                value={importIcsText}
                onChange={(e) => setImportIcsText(e.target.value)}
                rows={5}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-caption)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Color Indicator
              </label>
              <div className="solis-cal-color-palette">
                {COLOR_OPTIONS.map((c) => (
                  <div
                    key={c.value}
                    className={`solis-cal-color-option ${importColor === c.value ? 'solis-cal-color-option--selected' : ''}`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setImportColor(c.value)}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {importSuccess && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(78, 135, 82, 0.08)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-caption)',
                  color: 'var(--color-sage-500)'
                }}
              >
                <Check size={16} />
                <span>{importSuccess}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="ghost" size="sm" onClick={() => setTab('feeds')}>
                Cancel
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={handleManualImport}
                disabled={!importIcsText.trim()}
              >
                Import Calendar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
