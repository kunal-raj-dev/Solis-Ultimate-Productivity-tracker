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
  Sparkles,
  Target,
  Trash2,
  UserCheck,
  TrendingUp,
  Award
} from 'lucide-react';
import dataService from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Badge } from '../../components/ui/Badge/Badge';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { EmptyState } from '../../components/feedback/EmptyState/EmptyState';
import { ConfirmationDialog } from '../../components/feedback/ConfirmationDialog/ConfirmationDialog';
import { SegmentedControl } from '../../components/ui/SegmentedControl/SegmentedControl';
import { CustomSelect } from '../../components/ui/Select/CustomSelect';
import { CreateRoomModal } from './CreateRoomModal';
import { StudyRoom, CreateRoomPayload, RoomReflection } from '../../types/room';
import { StudySubject, StudySession } from '../../types/study';
import {
  StudyPact,
  StudyPactWeekSummary,
  buildPactWeekSummary,
  computePactMinutesThisWeek,
  createStudyPact,
  getPactWeekWindow,
  isPactWeekOver
} from '../../types/studyPact';
import { formatDurationMinutes } from '../../utils/formatters';
import { formatFriendlyDate } from '../../utils/date';
import './RoomsPage.css';

/**
 * Plan §8.3 — Study Pact persistence. Pacts are a client-side accountability
 * layer (no new domain table in master.md §13), so they live under this
 * dedicated localStorage key and progress is always computed from real logged
 * StudySessions via dataService.
 */
const STUDY_PACTS_STORAGE_KEY = 'solis_study_pacts_v1';

function readStoredPacts(): StudyPact[] {
  try {
    const raw = localStorage.getItem(STUDY_PACTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StudyPact[]) : [];
  } catch {
    return [];
  }
}

function writeStoredPacts(pacts: StudyPact[]): void {
  try {
    localStorage.setItem(STUDY_PACTS_STORAGE_KEY, JSON.stringify(pacts));
  } catch {
    // Storage unavailable — pacts stay in memory for this session only.
  }
}

export const RoomsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'sanctuaries' | 'pact' | 'history'>('sanctuaries');
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [roomToDelete, setRoomToDelete] = useState<StudyRoom | null>(null);
  const [historyReflections, setHistoryReflections] = useState<RoomReflection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Study Pact (plan §8.3)
  const [pacts, setPacts] = useState<StudyPact[]>(() => readStoredPacts());
  const [sessions, setSessions] = useState<StudySession[]>([]);
  // Review P8F1: auto-freezing must never run against the empty initial
  // session list, or an elapsed pact is permanently frozen with a 0-minute
  // summary before real sessions load.
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [myPledgeMinutes, setMyPledgeMinutes] = useState('300');
  const [partnerPledgeMinutes, setPartnerPledgeMinutes] = useState('300');
  const [pactSubjectId, setPactSubjectId] = useState('all');
  const [pactObjective, setPactObjective] = useState('');
  const [partnerCheckInMinutes, setPartnerCheckInMinutes] = useState('');

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
      const [roomsData, subjectsData, historyData, sessionsData] = await Promise.allSettled([
        dataService.rooms.getRooms(),
        dataService.study.getSubjects(),
        dataService.rooms.getUserRoomHistory(),
        dataService.study.getRecentSessions()
      ]);

      if (roomsData.status === 'fulfilled') setRooms(roomsData.value);
      if (subjectsData.status === 'fulfilled') setSubjects(subjectsData.value);
      if (historyData.status === 'fulfilled') setHistoryReflections(historyData.value);
      if (sessionsData.status === 'fulfilled') setSessions(sessionsData.value);
    } catch (err: any) {
      console.error('Failed to load study rooms:', err);
      addToast({
        title: 'Error loading rooms',
        description: err?.message || 'Could not fetch active study sanctuaries.',
        type: 'error'
      });
    } finally {
      // Review P8F1: the first completed load attempt (fulfilled or not)
      // unlocks pact reconciliation so freezing never sees the empty seed.
      setSessionsLoaded(true);
      setIsLoading(false);
    }
  }, [addToast]);

  // Plan §8.3: automatic end-of-week progress summaries — an active pact whose
  // week window has fully elapsed is frozen with a deterministic summary
  // computed from real logged sessions (never re-opened, never re-computed).
  const reconcilePacts = useCallback(
    (loaded: StudyPact[], studySessions: StudySession[]): StudyPact[] => {
      const now = new Date();
      let changed = false;
      const next = loaded.map((pact) => {
        if (pact.status !== 'active' || !isPactWeekOver(pact, now)) return pact;
        changed = true;
        const minutes = computePactMinutesThisWeek(pact, studySessions);
        return {
          ...pact,
          status: 'completed' as const,
          completedAt: now.toISOString(),
          summary: buildPactWeekSummary(pact, minutes)
        };
      });
      if (changed) writeStoredPacts(next);
      return next;
    },
    []
  );

  useEffect(() => {
    loadData();
    // Plan §6.1 scoped entity pub/sub: rooms and room history broadcast on
    // 'all' (they reach every subscriber), so only the subjects filter
    // context needs the 'study' channel here.
    const unsubscribe = dataService.subscribe(() => {
      loadData();
    }, ['study']);
    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Re-run pact reconciliation once sessions have actually loaded and on
  // every session refetch afterwards (review P8F1).
  useEffect(() => {
    if (!sessionsLoaded) return;
    setPacts((prev) => reconcilePacts(prev, sessions));
  }, [sessionsLoaded, sessions, reconcilePacts]);

  const handleCreateRoom = async (payload: CreateRoomPayload) => {
    const newRoom = await dataService.rooms.createRoom(payload);
    try {
      localStorage.setItem(`solis_created_room_${newRoom.id}`, 'true');
    } catch {}
    addToast({
      title: 'Study Sanctuary Created',
      description: `"${newRoom.title}" is ready. Code: ${newRoom.roomCode || ''}`,
      type: 'success'
    });
    navigate(`/app/rooms/${newRoom.id}`);
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      await dataService.rooms.deleteRoom(roomToDelete.id);
      addToast({
        title: 'Sanctuary Disbanded',
        description: `"${roomToDelete.title}" has been deleted.`,
        type: 'info'
      });
      setRoomToDelete(null);
      await loadData();
    } catch (err: any) {
      addToast({
        title: 'Delete Failed',
        description: err?.message || 'Could not delete study room.',
        type: 'error'
      });
    }
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

  // ── Study Pact (plan §8.3) ─────────────────────────────────────────────────
  const activePact = useMemo(
    () => pacts.find((p) => p.status === 'active') || null,
    [pacts]
  );
  const completedPacts = useMemo(
    () => pacts.filter((p) => p.status === 'completed').sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || '')),
    [pacts]
  );
  const activePactMinutes = activePact ? computePactMinutesThisWeek(activePact, sessions) : 0;

  const handleCreatePact = () => {
    if (activePact) {
      addToast({
        title: 'Pact Already Active',
        description: 'Close the current pact week before forming a new one.',
        type: 'warning'
      });
      return;
    }
    const subject = pactSubjectId === 'all' ? undefined : subjects.find((s) => s.id === pactSubjectId);
    const pact = createStudyPact({
      partnerName,
      sharedObjective: pactObjective,
      subjectId: subject?.id,
      subjectName: subject?.name,
      myWeeklyTargetMinutes: parseInt(myPledgeMinutes, 10) || 0,
      partnerWeeklyTargetMinutes: parseInt(partnerPledgeMinutes, 10) || 0
    });
    if (!pact) {
      addToast({
        title: 'Pact Incomplete',
        description: 'A partner name and weekly pledges of at least 15 minutes each are required.',
        type: 'warning'
      });
      return;
    }
    const next = [...pacts, pact];
    setPacts(next);
    writeStoredPacts(next);
    setPartnerName('');
    setPactObjective('');
    setPartnerCheckInMinutes('');
    addToast({
      title: 'Study Pact Formed',
      description: `Weekly mutual commitment with ${pact.partnerName} is live through ${pact.weekEndDate}.`,
      type: 'success'
    });
  };

  const handlePartnerCheckIn = () => {
    if (!activePact) return;
    const minutes = parseInt(partnerCheckInMinutes, 10);
    if (!Number.isFinite(minutes) || minutes < 0) {
      addToast({
        title: 'Check-in Invalid',
        description: 'Enter the total minutes your partner confirmed for this week.',
        type: 'warning'
      });
      return;
    }
    // Honest peer data: the partner's confirmed total is recorded verbatim,
    // never estimated or simulated.
    const updated: StudyPact = { ...activePact, partnerConfirmedMinutes: minutes };
    const next = pacts.map((p) => (p.id === updated.id ? updated : p));
    setPacts(next);
    writeStoredPacts(next);
    setPartnerCheckInMinutes('');
    addToast({
      title: 'Partner Check-in Recorded',
      description: `${updated.partnerName}: ${minutes} confirmed minutes this week.`,
      type: 'success'
    });
  };

  const closePactWeek = (pact: StudyPact) => {
    const minutes = computePactMinutesThisWeek(pact, sessions);
    const completed: StudyPact = {
      ...pact,
      status: 'completed',
      completedAt: new Date().toISOString(),
      summary: buildPactWeekSummary(pact, minutes)
    };
    const next = pacts.map((p) => (p.id === completed.id ? completed : p));
    setPacts(next);
    writeStoredPacts(next);
    addToast({
      title: 'Pact Week Closed',
      description: 'End-of-week progress summary saved below.',
      type: 'info'
    });
  };

  const renderPactProgressBar = (minutes: number, target: number, color: string) => {
    const percent = target > 0 ? Math.min(100, Math.round((minutes / target) * 100)) : 0;
    return (
      <div style={{ marginTop: '6px' }}>
        <div
          style={{
            height: '8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface-tertiary, rgba(0,0,0,0.06))',
            overflow: 'hidden'
          }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Weekly pact progress"
        >
          <div style={{ width: `${percent}%`, height: '100%', borderRadius: 'var(--radius-full)', background: color, transition: 'width 250ms cubic-bezier(0.22, 1, 0.36, 1)' }} />
        </div>
      </div>
    );
  };

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
            onChange={(val) => setActiveTab(val as 'sanctuaries' | 'pact' | 'history')}
            options={[
              { value: 'sanctuaries', label: `Active Pods (${rooms.length})` },
              { value: 'pact', label: 'Study Pact' },
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
                const isHost = Boolean(
                  (typeof window !== 'undefined' && localStorage.getItem(`solis_created_room_${room.id}`) === 'true') ||
                  (user && (
                    user.id === room.hostId ||
                    (user.name && room.hostName && user.name.trim().toLowerCase() === room.hostName.trim().toLowerCase()) ||
                    (user.email && room.hostName && user.email.toLowerCase().startsWith(room.hostName.toLowerCase()))
                  ))
                );
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
                        <div className="solis-room-card__objective" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Target size={13} color="var(--accent-terracotta)" style={{ flexShrink: 0 }} aria-hidden="true" />
                          <span>"{room.sharedObjective}"</span>
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

                      <div className="solis-room-card__actions">
                        {isHost && (
                          <button
                            type="button"
                            className="solis-room-card__delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoomToDelete(room);
                            }}
                            title="Delete Sanctuary (Host)"
                            aria-label="Delete Sanctuary"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : activeTab === 'pact' ? (
        /* Study Pact Accountability (plan §8.3) */
        <div className="solis-rooms-pact-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!activePact ? (
            <div
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-surface-primary)',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <UserCheck size={18} color="var(--color-coral-500)" />
                <h3 style={{ margin: 0, fontSize: 'var(--text-body-lg, 16px)' }}>Form a Weekly Study Pact</h3>
              </div>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: '0 0 14px' }}>
                Pair with one partner on weekly mutual goal commitments. Your progress is computed from your
                real logged sessions; your partner confirms their own minutes at check-in. A calm summary is
                saved automatically when the week closes (this week: {getPactWeekWindow().startKey} → {getPactWeekWindow().endKey}).
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <Input
                    label="Partner Name"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="e.g. Alyssa Vance"
                  />
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <Input
                    label="My Weekly Pledge (min)"
                    type="number"
                    value={myPledgeMinutes}
                    onChange={(e) => setMyPledgeMinutes(e.target.value)}
                  />
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <Input
                    label="Partner's Weekly Pledge (min)"
                    type="number"
                    value={partnerPledgeMinutes}
                    onChange={(e) => setPartnerPledgeMinutes(e.target.value)}
                  />
                </div>
                <div style={{ flex: '1 1 180px' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                    Shared Subject (optional)
                  </label>
                  <CustomSelect
                    variant="surface"
                    value={pactSubjectId}
                    onChange={setPactSubjectId}
                    options={[
                      { value: 'all', label: 'All subjects' },
                      ...subjects.filter((s) => s.status !== 'archived').map((s) => ({ value: s.id, label: s.name }))
                    ]}
                  />
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <Input
                  label="Shared Objective (optional)"
                  value={pactObjective}
                  onChange={(e) => setPactObjective(e.target.value)}
                  placeholder="e.g. Finish Chapter 6 problem sets together"
                />
              </div>
              <div style={{ marginTop: '14px' }}>
                <Button variant="accent" leftIcon={<Target size={15} />} onClick={handleCreatePact}>
                  Form Study Pact
                </Button>
              </div>
            </div>
          ) : (
            <div
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-surface-primary)',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} color="var(--color-sage-500, #2E7D5B)" />
                  <h3 style={{ margin: 0, fontSize: 'var(--text-body-lg, 16px)' }}>
                    Study Pact with {activePact.partnerName}
                  </h3>
                  {activePact.subjectName && <Badge variant="coral">{activePact.subjectName}</Badge>}
                </div>
                <Badge variant="neutral">
                  {activePact.weekStartDate} → {activePact.weekEndDate}
                </Badge>
              </div>

              {activePact.sharedObjective && (
                <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={13} color="var(--accent-terracotta)" aria-hidden="true" />
                  "{activePact.sharedObjective}"
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '16px' }}>
                <div style={{ flex: '1 1 260px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-body-sm)' }}>
                    <span style={{ fontWeight: 600 }}>Your week</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                      {activePactMinutes} / {activePact.myWeeklyTargetMinutes} min
                    </span>
                  </div>
                  {renderPactProgressBar(activePactMinutes, activePact.myWeeklyTargetMinutes, 'var(--color-sage-500, #2E7D5B)')}
                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    Counted from your real logged study sessions.
                  </span>
                </div>
                <div style={{ flex: '1 1 260px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-body-sm)' }}>
                    <span style={{ fontWeight: 600 }}>{activePact.partnerName}'s week</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                      {typeof activePact.partnerConfirmedMinutes === 'number' ? `${activePact.partnerConfirmedMinutes} / ${activePact.partnerWeeklyTargetMinutes} min` : `pledge ${activePact.partnerWeeklyTargetMinutes} min`}
                    </span>
                  </div>
                  {renderPactProgressBar(
                    activePact.partnerConfirmedMinutes ?? 0,
                    activePact.partnerWeeklyTargetMinutes,
                    'var(--color-amber-500, #D97706)'
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      value={partnerCheckInMinutes}
                      onChange={(e) => setPartnerCheckInMinutes(e.target.value)}
                      placeholder="Confirmed minutes"
                      aria-label="Partner confirmed minutes this week"
                      style={{
                        width: '140px',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-caption)',
                        fontFamily: 'var(--font-interface)'
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={handlePartnerCheckIn}>
                      Record Check-in
                    </Button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button variant="subtle" size="sm" leftIcon={<TrendingUp size={14} />} onClick={() => closePactWeek(activePact)}>
                  Close Week &amp; Save Summary
                </Button>
              </div>
            </div>
          )}

          {/* Automatic end-of-week progress summaries */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Award size={16} color="var(--color-amber-500, #D97706)" />
              <h4 style={{ margin: 0, fontSize: 'var(--text-body-sm)' }}>End-of-Week Summaries</h4>
            </div>
            {completedPacts.length === 0 ? (
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-muted)', margin: 0 }}>
                When a pact week closes — automatically at week's end, or early via the button above — its
                progress summary is preserved here.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {completedPacts.map((pact) => {
                  const summary: StudyPactWeekSummary | undefined = pact.summary;
                  return (
                    <div
                      key={pact.id}
                      style={{
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-surface-primary)',
                        padding: '14px 16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
                          Pact with {pact.partnerName}
                        </span>
                        {summary?.mutualCommitmentMet && (
                          <Badge variant="sage" showDot>Mutual Commitment Met</Badge>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {summary?.narrative || `Week of ${pact.weekStartDate} → ${pact.weekEndDate}.`}
                      </p>
                      <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                        Closed {formatFriendlyDate(pact.completedAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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

      {/* Disband Room Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(roomToDelete)}
        title="Disband Study Sanctuary"
        description={`Are you sure you want to permanently delete "${roomToDelete?.title}"? All active scholars will be disconnected.`}
        confirmLabel="Delete Sanctuary"
        cancelLabel="Keep Sanctuary"
        variant="danger"
        onConfirm={handleDeleteRoom}
        onClose={() => setRoomToDelete(null)}
      />
    </div>
  );
};
