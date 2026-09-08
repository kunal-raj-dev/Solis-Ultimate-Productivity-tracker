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
  Loader2
} from 'lucide-react';
import dataService from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { EmptyState } from '../../components/feedback/EmptyState/EmptyState';
import { CreateRoomModal } from './CreateRoomModal';
import { StudyRoom, CreateRoomPayload } from '../../types/room';
import { formatDurationMinutes } from '../../utils/formatters';
import './RoomsPage.css';

export const RoomsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterState, setFilterState] = useState<'all' | 'running' | 'idle'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const loadRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await dataService.rooms.getRooms();
      setRooms(data);
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
    loadRooms();
    const unsubscribe = dataService.subscribe(() => {
      loadRooms();
    });
    return () => {
      unsubscribe();
    };
  }, [loadRooms]);

  const handleCreateRoom = async (payload: CreateRoomPayload) => {
    const newRoom = await dataService.rooms.createRoom(payload);
    addToast({
      title: 'Study Sanctuary Created',
      description: `"${newRoom.title}" is ready. You are the session host.`,
      type: 'success'
    });
    navigate(`/app/rooms/${newRoom.id}`);
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.hostName && room.hostName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (filterState === 'running') return room.timerState === 'running';
      if (filterState === 'idle') return room.timerState === 'idle' || room.timerState === 'paused';
      return true;
    });
  }, [rooms, searchQuery, filterState]);

  const liveActiveCount = rooms.filter((r) => r.timerState === 'running').length;

  return (
    <div className="solis-rooms-page">
      {/* Header */}
      <div className="solis-rooms-header">
        <div>
          <h1 className="solis-rooms-header__title">
            <Radio size={24} color="var(--color-coral-500, #ff6b4a)" />
            Study Rooms
            {liveActiveCount > 0 && (
              <span className="solis-rooms-header__badge">
                <span className="solis-rooms-header__badge-dot" />
                {liveActiveCount} Live Flow
              </span>
            )}
          </h1>
          <p className="solis-rooms-header__subtitle">
            Synchronized collaborative sanctuaries. Study alongside peers against an authoritative, host-governed epoch timer.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus size={16} />}
        >
          Create Room
        </Button>
      </div>

      {/* Controls & Search */}
      <div className="solis-rooms-controls">
        <div className="solis-rooms-search">
          <Input
            placeholder="Search sanctuaries by topic or host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>

        <div className="solis-rooms-filters">
          <button
            type="button"
            className={`solis-rooms-filter-btn ${filterState === 'all' ? 'solis-rooms-filter-btn--active' : ''}`}
            onClick={() => setFilterState('all')}
          >
            All Sanctuaries ({rooms.length})
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
            Open / Idle ({rooms.filter((r) => r.timerState !== 'running').length})
          </button>
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
          title={searchQuery ? 'No matching Study Sanctuaries' : 'No Study Rooms Active'}
          description={
            searchQuery
              ? 'Try modifying your search terms or view all open sanctuaries.'
              : 'Create the first collaborative study room to begin a synchronized focus session with peers.'
          }
          actionLabel="Create First Sanctuary"
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
                      {room.timerState === 'running' && <Play size={10} fill="currentColor" />}
                      {room.timerState === 'paused' && <Pause size={10} />}
                      {room.timerState === 'idle' && <Clock size={10} />}
                      {room.timerState === 'running'
                        ? 'Session Active'
                        : room.timerState === 'paused'
                        ? 'Paused'
                        : 'Waiting to Start'}
                    </span>

                    <span className="solis-room-card__duration-badge">
                      <Clock size={12} />
                      {formatDurationMinutes(targetMins)}
                    </span>
                  </div>

                  <h3 className="solis-room-card__title">{room.title}</h3>

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

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRoom}
      />
    </div>
  );
};
