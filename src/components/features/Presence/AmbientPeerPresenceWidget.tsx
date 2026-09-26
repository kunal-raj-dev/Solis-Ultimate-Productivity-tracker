import React, { useEffect, useState } from 'react';
import { PeerPresence, PeerCheerEmoji, CHEER_LABELS } from '../../../types/presence';
import { dataService } from '../../../services/dataService';
import { useToast } from '../../../context/ToastContext';
import { Modal } from '../../feedback/Modal/Modal';
import { Avatar } from '../../ui/Avatar/Avatar';
import { Badge } from '../../ui/Badge/Badge';
import { Users, EyeOff, Eye, Sparkles } from 'lucide-react';
import './AmbientPeerPresenceWidget.css';

export interface AmbientPeerPresenceWidgetProps {
  className?: string;
  onOpenRooms?: () => void;
}

export const AmbientPeerPresenceWidget: React.FC<AmbientPeerPresenceWidgetProps> = ({
  className = ''
}) => {
  const { addToast } = useToast();
  const [peers, setPeers] = useState<PeerPresence[]>([]);
  const [isGhostMode, setIsGhostMode] = useState<boolean>(false);
  const [selectedPeer, setSelectedPeer] = useState<PeerPresence | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Load initial ghost mode preference
    dataService.presence.getGhostMode().then((ghost) => {
      if (isMounted) setIsGhostMode(ghost);
    }).catch(() => {});

    // Subscribe to live peer presence
    const unsub = dataService.presence.subscribeToPresence((livePeers) => {
      if (isMounted) {
        setPeers(livePeers.filter((p) => !p.isGhostMode));
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const handleToggleGhostMode = async () => {
    const nextMode = !isGhostMode;
    setIsGhostMode(nextMode);
    await dataService.presence.setGhostMode(nextMode);

    addToast({
      title: nextMode ? 'Ghost Mode Active' : 'Public Study Presence Active',
      description: nextMode
        ? 'Your study sessions are now hidden from peers. Complete focus privacy.'
        : 'Your peer presence is visible to study partners.',
      type: 'info'
    });
  };

  const handleSendCheer = async (emoji: PeerCheerEmoji) => {
    if (!selectedPeer) return;
    try {
      await dataService.presence.sendCheer(selectedPeer.userId, emoji);
      addToast({
        title: `Sent ${emoji} to ${selectedPeer.displayName}`,
        description: `Quiet encouragement delivered: "${CHEER_LABELS[emoji]}".`,
        type: 'success'
      });
      setSelectedPeer(null);
    } catch {
      addToast({
        title: 'Could not send cheer',
        type: 'error'
      });
    }
  };

  if (peers.length === 0 && !isGhostMode) {
    return null;
  }

  return (
    <div
      className={`solis-peer-presence ${className}`}
      data-testid="ambient-peer-presence-widget"
    >
      <div className="solis-peer-presence__header">
        <div className="solis-peer-presence__title">
          <span className="solis-peer-presence__live-dot" />
          <Users size={14} color="var(--color-coral-500)" />
          <span>Friends Studying Now ({peers.length})</span>
          {isGhostMode && (
            <Badge variant="neutral">
              <EyeOff size={11} style={{ marginRight: '4px' }} />
              Ghost Mode
            </Badge>
          )}
        </div>

        <button
          type="button"
          className={`solis-peer-presence__ghost-btn ${isGhostMode ? 'solis-peer-presence__ghost-btn--active' : ''}`}
          onClick={handleToggleGhostMode}
          title={isGhostMode ? 'Disable Ghost Mode (become visible)' : 'Enable Ghost Mode (study invisibly)'}
          aria-label={isGhostMode ? 'Disable Ghost Mode' : 'Enable Ghost Mode'}
        >
          {isGhostMode ? <Eye size={12} /> : <EyeOff size={12} />}
          <span>{isGhostMode ? 'Go Visible' : 'Ghost Mode'}</span>
        </button>
      </div>

      <div className="solis-peer-presence__list">
        {peers.map((peer) => (
          <div
            key={peer.userId}
            className="solis-peer-presence__card"
            onClick={() => setSelectedPeer(peer)}
            title={`Click to send quiet encouragement to ${peer.displayName}`}
          >
            <Avatar name={peer.displayName} size="sm" />
            <div className="solis-peer-presence__card-info">
              <span className="solis-peer-presence__card-name">{peer.displayName}</span>
              <span className="solis-peer-presence__card-subject">
                {peer.currentSubject || 'General Study'} • {peer.elapsedMinutes}m
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 1-Click Emoji Cheer Popover/Modal */}
      {selectedPeer && (
        <Modal
          isOpen={selectedPeer !== null}
          onClose={() => setSelectedPeer(null)}
          title={`Quiet Cheer for ${selectedPeer.displayName}`}
        >
          <div className="solis-peer-presence__cheer-modal">
            <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>
              Currently focusing on <strong>{selectedPeer.currentSubject || 'their study goal'}</strong> ({selectedPeer.elapsedMinutes} mins elapsed). Send a non-disruptive cheer:
            </p>

            <div className="solis-peer-presence__cheer-grid">
              {(['🔥', '☕', '👏', '🧠', '🌟'] as PeerCheerEmoji[]).map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="solis-peer-presence__cheer-btn"
                  onClick={() => handleSendCheer(emoji)}
                >
                  <span className="solis-peer-presence__cheer-emoji">{emoji}</span>
                  <span className="solis-peer-presence__cheer-title">{CHEER_LABELS[emoji]}</span>
                </button>
              ))}
            </div>

            {selectedPeer.cheersReceived && selectedPeer.cheersReceived.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <Sparkles size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                {selectedPeer.cheersReceived.length} peer cheer(s) received this session
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
