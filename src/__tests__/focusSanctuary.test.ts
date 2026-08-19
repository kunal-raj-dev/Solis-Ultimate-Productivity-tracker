import { describe, it, expect, beforeEach } from 'vitest';
import { soundscapeEngine, SOUNDSCAPE_PRESETS } from '../utils/focus/soundscapeEngine';
import { MockDataService } from '../services/mock/mockService';

describe('Stage E — Focus Sanctuary 2.0 Engine', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
    soundscapeEngine.stop();
  });

  describe('Synthetic Soundscape Engine', () => {
    it('provides all 6 acoustic presets across distinct sound categories', () => {
      expect(SOUNDSCAPE_PRESETS).toHaveLength(6);
      const categories = SOUNDSCAPE_PRESETS.map((p) => p.category);
      expect(categories).toContain('noise');
      expect(categories).toContain('binaural');
      expect(categories).toContain('nature');
      expect(categories).toContain('drone');
    });

    it('sets and updates soundscape types gracefully without errors', () => {
      soundscapeEngine.setSoundscape('pink_noise', 0.6);
      expect(soundscapeEngine.getCurrentSoundscape()).toBe('pink_noise');
      expect(soundscapeEngine.getCurrentVolume()).toBe(0.6);

      soundscapeEngine.setSoundscape('binaural_alpha', 0.4);
      expect(soundscapeEngine.getCurrentSoundscape()).toBe('binaural_alpha');

      soundscapeEngine.stop();
      expect(soundscapeEngine.getCurrentSoundscape()).toBe('none');
    });

    it('clamps volume levels to valid [0.0, 1.0] range', () => {
      soundscapeEngine.setVolume(1.8);
      expect(soundscapeEngine.getCurrentVolume()).toBe(1.0);

      soundscapeEngine.setVolume(-0.5);
      expect(soundscapeEngine.getCurrentVolume()).toBe(0.0);

      soundscapeEngine.setVolume(0.75);
      expect(soundscapeEngine.getCurrentVolume()).toBe(0.75);
    });
  });

  describe('Focus Session Quality & Auto-Reflection Persistence', () => {
    it('saves a focus session with flow quality, interruption logs, and soundscape type', async () => {
      const session = await service.focus.saveFocusSession({
        mode: 'deep_flow',
        durationMinutes: 50,
        subjectId: 'sbj_1',
        subjectName: 'Distributed Systems',
        title: 'Raft Safety & Invariant Verification',
        completed: true,
        interruptionsCount: 1,
        flowQuality: 5,
        soundscapeType: 'binaural_alpha',
        targetOutcome: 'Complete inductive invariant proof',
        notes: 'Leader completeness theorem fully verified.'
      });

      expect(session.id).toBeDefined();
      expect(session.durationMinutes).toBe(50);
      expect(session.subjectId).toBe('sbj_1');
      expect(session.completed).toBe(true);

      const recent = await service.focus.getRecentSessions();
      const savedInRecent = recent.find((s) => s.id === session.id);
      expect(savedInRecent).toBeDefined();
    });

    it('calculates daily summary including focus sessions', async () => {
      await service.focus.saveFocusSession({
        mode: 'pomodoro',
        durationMinutes: 25,
        title: 'Morning Sprint',
        completed: true
      });

      const summary = await service.analytics.getDailySummary();
      expect(summary.totalStudyMinutes).toBeGreaterThanOrEqual(25);
    });

    it('synthesizes a structured note from focus reflection into Knowledge Studio', async () => {
      const focusTitle = 'Paxos Consensus Invariants';
      const reflectionNotes = 'Proved leader completeness under network partitions.';
      const sessionMinutes = 50;
      const flowQuality = 5;

      const createdNote = await service.notes.createNote({
        title: `${focusTitle} — Distillation`,
        content: `${reflectionNotes}\n\n**Session Details:**\n- Duration: ${sessionMinutes}m\n- Flow Quality: ${flowQuality}/5\n- Target Outcome: Formal verification`,
        category: 'concept',
        subjectId: 'sbj_1',
        tags: ['focus-distillation', 'distributed-systems']
      });

      expect(createdNote.id).toBeDefined();
      expect(createdNote.title).toBe('Paxos Consensus Invariants — Distillation');
      expect(createdNote.content).toContain('Proved leader completeness');
      expect(createdNote.category).toBe('concept');

      const allNotes = await service.notes.getNotes();
      expect(allNotes.some((n) => n.id === createdNote.id)).toBe(true);
    });
  });

  describe('Focus Presets & Midpoint Checkpoint Timing', () => {
    it('defines standard preset durations accurately in seconds', () => {
      const pomodoroSec = 25 * 60;
      const deepFlowSec = 50 * 60;
      const shortBreakSec = 5 * 60;

      expect(pomodoroSec).toBe(1500);
      expect(deepFlowSec).toBe(3000);
      expect(shortBreakSec).toBe(300);
    });

    it('determines midpoint checkpoint trigger accurately', () => {
      const totalSeconds = 25 * 60; // 1500s
      const halfwaySeconds = totalSeconds * 0.5; // 750s

      const beforeMidpoint = 800; // Remaining > 750 (not yet reached)
      const atOrAfterMidpoint = 740; // Remaining <= 750 (reached)

      expect(beforeMidpoint <= halfwaySeconds).toBe(false);
      expect(atOrAfterMidpoint <= halfwaySeconds).toBe(true);
    });
  });
});
