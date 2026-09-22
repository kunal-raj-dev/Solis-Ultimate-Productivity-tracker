import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Play,
  Pause,
  Clock,
  ArrowRight,
  Radio,
  Loader2,
  KeyRound,
  Coffee,
  Brain,
  Star,
  Lock,
  Sparkles
} from 'lucide-react';
import dataService from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Badge } from '../../components/ui/Badge/Badge';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { EmptyState } from '../../components/feedback/EmptyState/EmptyState';
import { SegmentedControl } from '../../components/ui/SegmentedControl/SegmentedControl';
import { CustomSelect } from '../../components/ui/Select/CustomSelect';
import { CreateRoomModal } from './CreateRoomModal';
import { StudyRoom, CreateRoomPayload, RoomReflection } from '../../types/room';
import { StudySubject } from '../../types/study';
import { formatDurationMinutes } from '../../utils/formatters';
import { formatFriendlyDate } from '../../utils/date';
import './RoomsPage.css';

export const RoomsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'sanctuaries' | 'history'>('sanctuaries');
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [historyReflections, setHistoryReflections] = useState<RoomReflection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterState, setFilterState] = useState<'all' | 'running' | 'idle'>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedModality, setSelectedModality] = useState<string>('all');

  // Direct Room Code Join State
  const [inputRoomCode, setInputRoomCode] = useState<string>('');
  const [isJoiningCode, setIsJoiningCode] = useState<boolean>(false);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [roomsData, subjectsData, historyData] = await Promise.allSettled([
        dataService.rooms.getRooms(),
        dataService.study.getSubjects(),
        dataService.rooms.getUserRoomHistory()
      ]);

      if (roomsData.status === 'fulfilled') setRooms(roomsData.value);
      if (subjectsData.status === 'fulfilled') setSubjects(subjectsData.value);
      if (historyData.status === 'fulfilled') setHistoryReflections(historyData.value);
    } catch (err: any) {
      console.error('Failed to load study rooms:', err);
      addToast({
        title: 'Error loading rooms',
        description: err?.message || 'Could not fetch active study sanctuaries.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
    const unsubscribe = dataService.subscribe(() => {
      loadData();
    });
    return () => {
      unsubscribe();
    };
  }, [loadData]);

  const handleCreateRoom = async (payload: CreateRoomPayload) => {
    const newRoom = await dataService.rooms.createRoom(payload);
    addToast({
      title: 'Study Sanctuary Created',
      description: `"${newRoom.title}" is ready. Code: ${newRoom.roomCode || ''}`,
      type: 'success'
    });
    navigate(`/app/rooms/${newRoom.id}`);
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputRoomCode.trim().toUpperCase();
    if (!trimmed) return;

    try {
      setIsJoiningCode(true);
      const targetRoom = await dataService.rooms.getRoomByCode(trimmed);
      if (!targetRoom) {
        addToast({
          title: 'Sanctuary Not Found',
          description: `No active study sanctuary matches code "${trimmed}".`,
          type: 'error'
        });
        return;
      }
      addToast({
        title: 'Sanctuary Located',
        description: `Entering "${targetRoom.title}"...`,
        type: 'success'
      });
      navigate(`/app/rooms/${targetRoom.id}`);
    } catch (err: any) {
      addToast({
        title: 'Failed to join by code',
        description: err?.message || 'Please verify the code and try again.',
        type: 'error'
      });
    } finally {
      setIsJoiningCode(false);
    }
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.roomCode && room.roomCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (room.sharedObjective && room.sharedObjective.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (room.hostName && room.hostName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (filterState === 'running' && room.timerState !== 'running') return false;
      if (filterState === 'idle' && room.timerState === 'running') return false;
      if (selectedSubjectId !== 'all' && room.subjectId !== selectedSubjectId) return false;
      if (selectedModality !== 'all' && room.sessionType !== selectedModality) return false;

      return true;
    });
  }, [rooms, searchQuery, filterState, selectedSubjectId, selectedModality]);

  const liveActiveCount = rooms.filter((r) => r.timerState === 'running').length;

  return (
    <div className="solis-rooms-page">
      {/* Header */}
      <div className="solis-rooms-header">
        <div>
          <h1 className="solis-rooms-header__title">
            <Radio size={24} color="var(--color-coral-500, #ff6b4a)" />
            Collaborative Study Sanctuaries
            {liveActiveCount > 0 && (
              <span className="solis-rooms-header__badge">
                <span className="solis-rooms-header__badge-dot" />
                {liveActiveCount} Live Flow
              </span>
            )}
          </h1>
          <p className="solis-rooms-header__subtitle">
            Synchronized co-working pods with shared objectives, peer reactions, and authoritative epoch timers.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus size={16} />}
        >
          Create Sanctuary
        </Button>
      </div>

      {/* Direct Room Code Quick-Join Bar */}
      <div className="solis-rooms-join-bar">
        <form onSubmit={handleJoinByCode} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <KeyRound size={18} color="var(--color-coral-500)" style={{ flexShrink: 0 }} />
          <Input
            placeholder="Enter 6-character room code (e.g. SOL789)..."
            value={inputRoomCode}
            onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
            maxLength={8}
            style={{ maxWidth: '300px' }}
          />
          <Button
            type="submit"
            variant="accent"
            size="sm"
            disabled={!inputRoomCode.trim() || isJoiningCode}
            isLoading={isJoiningCode}
          >
            Enter Sanctuary
          </Button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SegmentedControl
            variant="contained"
            size="sm"
            value={activeTab}
            onChange={(val) => setActiveTab(val as 'sanctuaries' | 'history')}
            options={[
              { value: 'sanctuaries', label: `Active Pods (${rooms.length})` },
              { value: 'history', label: `My Reflections (${historyReflections.length})` }
            ]}
          />
        </div>
      </div>

      {activeTab === 'sanctuaries' ? (
        <>
          {/* Controls, Subject Filter & Modality Bar */}
          <div className="solis-rooms-controls">
            <div className="solis-rooms-search">
              <Input
                placeholder="Search by topic, host, code, or shared goal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={16} />}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ width: '150px' }}>
                <CustomSelect
                  variant="surface"
                  value={selectedSubjectId}
                  onChange={setSelectedSubjectId}
                  options={[
                    { value: 'all', label: 'All Subjects' },
                    ...subjects.filter((s) => s.status !== 'archived').map((s) => ({ value: s.id, label: s.name }))
                  ]}
                />
              </div>

              <div style={{ width: '150px' }}>
                <CustomSelect
                  variant="surface"
                  value={selectedModality}
                  onChange={setSelectedModality}
                  options={[
                    { value: 'all', label: 'All Modalities' },
                    { value: 'deep_focus', label: 'Deep Focus' },
                    { value: 'pomodoro', label: 'Pomodoro' },
                    { value: 'exam_cram', label: 'Exam Prep' },
                    { value: 'silent_reading', label: 'Silent Reading' },
                    { value: 'code_review', label: 'Code Review' }
                  ]}
                />
              </div>

              <div className="solis-rooms-filters">
                <button
                  type="button"
                  className={`solis-rooms-filter-btn ${filterState === 'all' ? 'solis-rooms-filter-btn--active' : ''}`}
                  onClick={() => setFilterState('all')}
                >
                  All ({rooms.length})
                </button>
                <button
                  type="button"
                  className={`solis-rooms-filter-btn ${filterState === 'running' ? 'solis-rooms-filter-btn--active' : ''}`}
                  onClick={() => setFilterState('running')}
                >
                  In Session ({rooms.filter((r) => r.timerState === 'running').length})
                </button>
                <button
                  type="button"
                  className={`solis-rooms-filter-btn ${filterState === 'idle' ? 'solis-rooms-filter-btn--active' : ''}`}
                  onClick={() => setFilterState('idle')}
                >
                  Open ({rooms.filter((r) => r.timerState !== 'running').length})
                </button>
              </div>
            </div>
          </div>

          {/* Room Grid or Loading / Empty State */}
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
              <Loader2 size={32} className="solis-spin" style={{ color: 'var(--color-coral-500, #ff6b4a)' }} />
            </div>
          ) : filteredRooms.length === 0 ? (
            <EmptyState
              icon={Users}
              title={searchQuery || selectedSubjectId !== 'all' ? 'No matching Study Sanctuaries' : 'No Study Rooms Active'}
              description={
                searchQuery || selectedSubjectId !== 'all'
                  ? 'Try modifying your search or filters to discover active pods.'
                  : 'Create the first collaborative sanctuary to begin a synchronized focus session with peers.'
              }
              actionLabel="Create Sanctuary"
              onAction={() => setIsCreateModalOpen(true)}
            />
          ) : (
            <div className="solis-rooms-grid">
              {filteredRooms.map((room) => {
                const isHost = user && user.id === room.hostId;
                const targetMins = Math.round(room.targetDurationSeconds / 60);

                return (
                  <div
                    key={room.id}
                    className={`solis-room-card solis-room-card--${room.timerState}`}
                  >
                    <div>
                      <div className="solis-room-card__header">
                        <span
                          className={`solis-room-card__status-pill solis-room-card__status-pill--${room.timerState}`}
                        >
                          {room.isBreak ? (
                            <>
                              <Coffee size={10} /> Intermission Break
                            </>
                          ) : room.timerState === 'running' ? (
                            <>
                              <Play size={10} fill="currentColor" /> Session Active
                            </>
                          ) : room.timerState === 'paused' ? (
                            <>
                              <Pause size={10} /> Paused
                            </>
                          ) : (
                            <>
                              <Clock size={10} /> Ready to Flow
                            </>
                          )}
                        </span>

                        <span className="solis-room-card__duration-badge">
                          <Clock size={12} />
                          {formatDurationMinutes(targetMins)}
                        </span>
                      </div>

                      <h3 className="solis-room-card__title">{room.title}</h3>

                      {/* Room Code & Modality Badges */}
                      <div className="solis-room-card__tags">
                        {room.roomCode && (
                          <span className="solis-room-card__code-badge" title="Room Code for Direct Peer Invite">
                            #{room.roomCode}
                          </span>
                        )}
                        {room.subjectName && (
                          <Badge variant="coral">{room.subjectName}</Badge>
                        )}
                        {room.sessionType && (
                          <Badge variant="neutral">{room.sessionType.replace('_', ' ')}</Badge>
                        )}
                        {room.isPrivate && (
                          <Badge variant="amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Lock size={10} /> Private
                          </Badge>
                        )}
                      </div>

                      {/* Shared Objective */}
                      {room.sharedObjective && (
                        <div className="solis-room-card__objective">
                          🎯 "{room.sharedObjective}"
                        </div>
                      )}

                      <div className="solis-room-card__host">
                        <Avatar name={room.hostName || 'Host'} size="sm" />
                        <span>
                          Host: <strong>{room.hostName || 'Solis Scholar'}</strong>
                          {isHost && (
                            <span
                              style={{
                                marginLeft: '6px',
                                fontSize: 'var(--text-micro)',
                                color: 'var(--color-coral-500)',
                                fontWeight: 700
                              }}
                            >
                              (You)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="solis-room-card__footer">
                      <div className="solis-room-card__participants">
                        <Users size={15} />
                        <span>
                          {room.participantsCount ?? 1}{' '}
                          {(room.participantsCount ?? 1) === 1 ? 'scholar' : 'scholars'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="solis-room-card__enter-btn"
                        onClick={() => navigate(`/app/rooms/${room.id}`)}
                      >
                        Enter Sanctuary
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* History & Collaborative Reflections Tab */
        <div className="solis-rooms-history-section">
          {historyReflections.length === 0 ? (
            <EmptyState
              icon={Brain}
              title="No Past Study Reflections Yet"
              description="When you complete study room sessions, your personal takeaways, duration stats, and breakthroughs are preserved here."
            />
          ) : (
            <div className="solis-rooms-history-list">
              {historyReflections.map((ref) => (
                <div key={ref.id} className="solis-rooms-history-card">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h4 className="solis-rooms-history-title">{ref.roomTitle}</h4>
                      {ref.subjectName && <Badge variant="coral">{ref.subjectName}</Badge>}
                      <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                        {formatFriendlyDate(ref.createdAt)}
                      </span>
                    </div>

                    {ref.reflectionText && (
                      <p className="solis-rooms-history-quote">
                        <Sparkles size={12} color="var(--color-coral-500)" style={{ display: 'inline', marginRight: '6px' }} />
                        "{ref.reflectionText}"
                      </p>
                    )}

                    {ref.nextStep && (
                      <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)' }}>
                        Next focus: {ref.nextStep}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--color-coral-500)' }}>
                        {Math.round((ref.durationSeconds || 0) / 60)}m
                      </span>
                      <span style={{ display: 'block', fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                        invested
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          color={s <= (ref.retentionRating || 4) ? 'var(--color-amber-500, #f59e0b)' : 'var(--text-muted)'}
                          fill={s <= (ref.retentionRating || 4) ? 'var(--color-amber-500, #f59e0b)' : 'transparent'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRoom}
        subjects={subjects}
      />
    </div>
  );
};
