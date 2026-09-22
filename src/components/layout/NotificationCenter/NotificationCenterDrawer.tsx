import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  Check,
  Trash2,
  Calendar,
  BookOpen,
  Users,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Moon
} from 'lucide-react';
import { notificationService } from '../../../services/notifications/notification.service';
import { SolisNotification, NotificationCategory } from '../../../types/notification';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { formatFriendlyDate } from '../../../utils/date';
import './NotificationCenterDrawer.css';

interface NotificationCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterDrawer: React.FC<NotificationCenterDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SolisNotification[]>(() =>
    notificationService.getNotifications()
  );
  const [selectedFilter, setSelectedFilter] = useState<'all' | NotificationCategory>('all');

  useEffect(() => {
    const update = () => {
      setNotifications(notificationService.getNotifications());
    };
    update();
    const unsub = notificationService.subscribe(update);
    return () => unsub();
  }, []);

  // Keyboard close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (selectedFilter === 'all') return true;
    return n.category === selectedFilter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isQuiet = notificationService.isInQuietHours();

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'calendar':
        return <Calendar size={14} color="var(--color-coral-500)" />;
      case 'study':
        return <BookOpen size={14} color="var(--color-amber-500)" />;
      case 'room':
        return <Users size={14} color="var(--color-lavender-500)" />;
      case 'task':
        return <CheckSquare size={14} color="var(--color-sage-500)" />;
      case 'intelligence':
        return <Sparkles size={14} color="var(--color-coral-400)" />;
      default:
        return <Bell size={14} />;
    }
  };

  const handleActionClick = (notif: SolisNotification) => {
    notificationService.markAsRead(notif.id);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
      onClose();
    }
  };

  return createPortal(
    <div className="solis-notif-backdrop" onClick={onClose}>
      <div className="solis-notif-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="solis-notif-header">
          <div className="solis-notif-title-group">
            <Bell size={18} color="var(--color-coral-500)" />
            <h3 className="solis-notif-title">Notifications</h3>
            {unreadCount > 0 && <Badge variant="coral">{unreadCount} new</Badge>}
          </div>

          <div className="solis-notif-actions">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => notificationService.markAllAsRead()}
                title="Mark all as read"
              >
                <Check size={14} />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => notificationService.clearAll()}
                title="Clear all"
              >
                <Trash2 size={14} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close notifications">
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Quiet Hours Banner if active */}
        {isQuiet && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--bg-surface-secondary)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: 'var(--text-micro)',
              color: 'var(--text-muted)'
            }}
          >
            <Moon size={12} />
            <span>Quiet Hours Active — Non-urgent notifications silenced until morning.</span>
          </div>
        )}

        {/* Filters */}
        <div className="solis-notif-filters">
          {(['all', 'study', 'task', 'calendar', 'room'] as const).map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedFilter(filter)}
              style={{ textTransform: 'capitalize', fontSize: '11px', padding: '4px 10px' }}
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="solis-notif-list">
          {filtered.length === 0 ? (
            <div className="solis-notif-empty">
              <Bell size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: 'var(--text-body-sm)' }}>All caught up.</p>
              <span style={{ fontSize: 'var(--text-micro)' }}>No new alerts or reminders.</span>
            </div>
          ) : (
            filtered.map((notif) => (
              <div
                key={notif.id}
                className={`solis-notif-card ${!notif.read ? 'solis-notif-card--unread' : ''}`}
                onClick={() => notificationService.markAsRead(notif.id)}
              >
                <div style={{ marginTop: '2px' }}>{getCategoryIcon(notif.category)}</div>
                <div className="solis-notif-content">
                  <div className="solis-notif-card-header">
                    <h4 className="solis-notif-card-title">{notif.title}</h4>
                    <span className="solis-notif-card-time">
                      {formatFriendlyDate(notif.createdAt)}
                    </span>
                  </div>
                  <p className="solis-notif-card-message">{notif.message}</p>
                  {notif.actionUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={<ArrowRight size={12} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionClick(notif);
                      }}
                      style={{ fontSize: '11px', padding: '2px 8px', height: '24px' }}
                    >
                      {notif.actionLabel || 'View'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
