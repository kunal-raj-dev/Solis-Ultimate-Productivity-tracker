/**
 * Solis Ambient Peer Presence System — Type Definitions
 *
 * Feature 3.3 (Weeks 9–12):
 * Displays non-intrusive, calming co-presence of friends and study partners.
 * Unlike gamified apps with stressful live video or cutthroat leaderboards,
 * Solis provides the quiet, grounding atmosphere of a library reading room.
 */

export type PeerActivityType = 'deep_work' | 'spaced_recall' | 'reading' | 'resting';

export type PeerCheerEmoji = '🔥' | '☕' | '👏' | '🧠' | '🌟';

export interface PeerCheer {
  id: string;
  fromUserId: string;
  fromDisplayName: string;
  emoji: PeerCheerEmoji;
  sentAt: string;
}

export interface PeerPresence {
  userId: string;
  displayName: string;
  avatarSeed?: string;
  currentSubject?: string;
  activity: PeerActivityType;
  elapsedMinutes: number;
  isGhostMode?: boolean;
  lastHeartbeat: string;
  cheersReceived?: PeerCheer[];
}

export const CHEER_LABELS: Record<PeerCheerEmoji, string> = {
  '🔥': 'Focus Momentum',
  '☕': 'Coffee Breather',
  '👏': 'Kudos & Respect',
  '🧠': 'Deep Synthesis',
  '🌟': 'Quiet Inspiration'
};
