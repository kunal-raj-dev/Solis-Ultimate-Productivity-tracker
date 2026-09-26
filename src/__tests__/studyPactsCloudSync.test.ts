import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CloudStudyPact,
  generatePactInviteCode,
  normalizePactPerspective,
  buildCloudPactSummary
} from '../types/studyPact';
import { MockDataService } from '../services/mock/mockService';
import { ServiceContainer } from '../services/dataService';

describe('Phase 1 (F-103): Multi-User Cloud Study Pacts', () => {
  const MOCK_CREATOR_ID = 'usr_creator_123';
  const MOCK_PARTNER_ID = 'usr_partner_456';

  const basePact: CloudStudyPact = {
    id: 'pact_test_1',
    createdBy: MOCK_CREATOR_ID,
    creatorName: 'Kunal Raj',
    partnerId: MOCK_PARTNER_ID,
    partnerName: 'Alyssa Vance',
    partnerEmail: 'alyssa@solis.study',
    inviteCode: 'TEST99',
    sharedObjective: 'Master Raft Consensus & Distributed Systems',
    subjectId: 'subj_dist_sys',
    subjectName: 'Distributed Systems',
    weekStartDate: '2026-09-21',
    weekEndDate: '2026-09-27',
    creatorTargetMinutes: 300,
    partnerTargetMinutes: 240,
    creatorConfirmedMinutes: 300,
    partnerConfirmedMinutes: 240,
    status: 'active',
    createdAt: '2026-09-21T00:00:00.000Z',
    updatedAt: '2026-09-21T00:00:00.000Z'
  };

  describe('generatePactInviteCode', () => {
    it('produces a 6-character uppercase alphanumeric code without ambiguous characters', () => {
      const code = generatePactInviteCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
      // Confusing characters (0, O, 1, I) should not be present
      expect(code).not.toMatch(/[0O1I]/);
    });

    it('generates distinct codes on consecutive calls', () => {
      const set = new Set();
      for (let i = 0; i < 50; i++) {
        set.add(generatePactInviteCode());
      }
      expect(set.size).toBe(50);
    });
  });

  describe('normalizePactPerspective', () => {
    it('normalizes perspective correctly when viewer is the creator', () => {
      const norm = normalizePactPerspective(basePact, MOCK_CREATOR_ID);
      expect(norm.isCreator).toBe(true);
      expect(norm.isPartner).toBe(false);
      expect(norm.myName).toBe('Kunal Raj');
      expect(norm.partnerDisplayName).toBe('Alyssa Vance');
      expect(norm.myTargetMinutes).toBe(300);
      expect(norm.myConfirmedMinutes).toBe(300);
      expect(norm.myProgressPercent).toBe(100);
      expect(norm.partnerTargetMinutes).toBe(240);
      expect(norm.partnerConfirmedMinutes).toBe(240);
      expect(norm.partnerProgressPercent).toBe(100);
      expect(norm.mutualCommitmentMet).toBe(true);
    });

    it('normalizes perspective correctly when viewer is the partner', () => {
      const norm = normalizePactPerspective(basePact, MOCK_PARTNER_ID);
      expect(norm.isCreator).toBe(false);
      expect(norm.isPartner).toBe(true);
      expect(norm.myName).toBe('Alyssa Vance');
      expect(norm.partnerDisplayName).toBe('Kunal Raj');
      expect(norm.myTargetMinutes).toBe(240);
      expect(norm.myConfirmedMinutes).toBe(240);
      expect(norm.myProgressPercent).toBe(100);
      expect(norm.partnerTargetMinutes).toBe(300);
      expect(norm.partnerConfirmedMinutes).toBe(300);
      expect(norm.partnerProgressPercent).toBe(100);
      expect(norm.mutualCommitmentMet).toBe(true);
    });

    it('handles pending pacts with unassigned partner gracefully', () => {
      const pendingPact: CloudStudyPact = {
        ...basePact,
        partnerId: null,
        partnerName: 'Pending Peer',
        creatorConfirmedMinutes: 60,
        partnerConfirmedMinutes: 0,
        status: 'pending'
      };

      const norm = normalizePactPerspective(pendingPact, MOCK_CREATOR_ID);
      expect(norm.status).toBe('pending');
      expect(norm.partnerDisplayName).toBe('Awaiting Partner...');
      expect(norm.myConfirmedMinutes).toBe(60);
      expect(norm.myProgressPercent).toBe(20);
      expect(norm.partnerConfirmedMinutes).toBe(0);
      expect(norm.partnerProgressPercent).toBe(0);
      expect(norm.mutualCommitmentMet).toBe(false);
    });
  });

  describe('buildCloudPactSummary', () => {
    it('creates an encouraging anti-shame summary when mutual commitments are met', () => {
      const summary = buildCloudPactSummary(basePact, MOCK_CREATOR_ID);
      expect(summary.mutualCommitmentMet).toBe(true);
      expect(summary.myMinutes).toBe(300);
      expect(summary.partnerMinutes).toBe(240);
      expect(summary.narrative).toContain('commitment met');
      expect(summary.narrative).not.toContain('failed');
    });

    it('creates an encouraging summary when target is partially reached', () => {
      const partialPact: CloudStudyPact = {
        ...basePact,
        creatorConfirmedMinutes: 150,
        partnerConfirmedMinutes: 120
      };

      const summary = buildCloudPactSummary(partialPact, MOCK_CREATOR_ID);
      expect(summary.mutualCommitmentMet).toBe(false);
      expect(summary.narrative).toContain('every minute dedicated to learning counts');
      expect(summary.narrative).not.toContain('failed');
      expect(summary.narrative).not.toContain('missed');
    });
  });

  describe('MockDataService Study Pact Repository Integration', () => {
    let mockService: MockDataService;

    beforeEach(() => {
      // Mock window and localStorage
      const storage = new Map<string, string>();
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => storage.set(k, v),
        removeItem: (k: string) => storage.delete(k),
        clear: () => storage.clear()
      });

      mockService = new MockDataService();
      ServiceContainer.setService(mockService, 'mock');
    });

    it('retrieves default active pacts from repository', async () => {
      const pacts = await mockService.pacts.getPacts();
      expect(pacts.length).toBeGreaterThan(0);
      const active = await mockService.pacts.getActivePact();
      expect(active).not.toBeNull();
      expect(active?.status).toBe('active');
    });

    it('creates a new study pact with unique invite code and pending status', async () => {
      const newPact = await mockService.pacts.createPact({
        partnerName: 'Grace Hopper',
        sharedObjective: 'Compilers & AST transformations',
        myWeeklyTargetMinutes: 360,
        partnerWeeklyTargetMinutes: 300
      });

      expect(newPact).toBeDefined();
      expect(newPact.status).toBe('pending');
      expect(newPact.inviteCode).toHaveLength(6);
      expect(newPact.creatorTargetMinutes).toBe(360);
      expect(newPact.partnerTargetMinutes).toBe(300);

      const retrieved = await mockService.pacts.getPactByInviteCode(newPact.inviteCode);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(newPact.id);
    });

    it('allows a partner to join a pending pact via invite code', async () => {
      const newPact = await mockService.pacts.createPact({
        sharedObjective: 'Distributed Consensus',
        myWeeklyTargetMinutes: 200,
        partnerWeeklyTargetMinutes: 200
      });

      const joined = await mockService.pacts.joinPactByInviteCode(newPact.inviteCode, 'Claude Shannon');
      expect(joined.status).toBe('active');
      expect(joined.partnerName).toBe('Claude Shannon');
      expect(joined.partnerId).toBeDefined();
    });

    it('rejects joining an already active pact', async () => {
      const pacts = await mockService.pacts.getPacts();
      const activePact = pacts.find((p) => p.status === 'active')!;

      await expect(
        mockService.pacts.joinPactByInviteCode(activePact.inviteCode, 'Late Joiner')
      ).rejects.toThrow(/already been joined/);
    });

    it('synchronizes study minutes and updates confirmed tally', async () => {
      const pacts = await mockService.pacts.getPacts();
      const pact = pacts[0];

      const updated = await mockService.pacts.syncPactMinutes(pact.id, 250);
      expect(updated.creatorConfirmedMinutes).toBe(250);

      const refetched = await mockService.pacts.getPactById(pact.id);
      expect(refetched?.creatorConfirmedMinutes).toBe(250);
    });

    it('concludes a pact week and preserves the summary', async () => {
      const pacts = await mockService.pacts.getPacts();
      const pact = pacts[0];

      const completed = await mockService.pacts.completePact(pact.id, {
        myMinutes: 300,
        myTargetMinutes: 300,
        partnerMinutes: 240,
        partnerTargetMinutes: 240,
        mutualCommitmentMet: true,
        narrative: 'Week completed successfully.'
      });

      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();
      expect(completed.summary?.mutualCommitmentMet).toBe(true);
    });

    it('disbands and deletes a study pact', async () => {
      const newPact = await mockService.pacts.createPact({
        myWeeklyTargetMinutes: 120,
        partnerWeeklyTargetMinutes: 120
      });

      const deleted = await mockService.pacts.deletePact(newPact.id);
      expect(deleted).toBe(true);

      const check = await mockService.pacts.getPactById(newPact.id);
      expect(check).toBeNull();
    });
  });
});
