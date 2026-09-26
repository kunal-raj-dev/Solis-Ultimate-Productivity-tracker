import { describe, it, expect, beforeEach } from 'vitest';
import { DIAGRAM_PRESETS } from '../../../components/features/Flashcards/ImageOcclusionDrawer';
import { MockDataService } from '../../../services/mock/mockService';
import { ImageOcclusionZone } from '../../../types/learning';

describe('Feature 2.2: Image Occlusion & Visual Diagram Flashcard Suite', () => {
  describe('Built-in Diagram Presets Architecture', () => {
    it('provides valid visual diagram presets with normalized occlusion zones', () => {
      expect(DIAGRAM_PRESETS.length).toBeGreaterThan(0);

      DIAGRAM_PRESETS.forEach((preset) => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.url).toMatch(/^data:image\/svg\+xml/);
        expect(preset.defaultZones.length).toBeGreaterThan(0);

        preset.defaultZones.forEach((zone) => {
          expect(zone.id).toBeDefined();
          expect(zone.x).toBeGreaterThanOrEqual(0);
          expect(zone.x + zone.width).toBeLessThanOrEqual(100);
          expect(zone.y).toBeGreaterThanOrEqual(0);
          expect(zone.y + zone.height).toBeLessThanOrEqual(100);
          expect(zone.label).toBeDefined();
        });
      });
    });
  });

  describe('Image Occlusion Card Creation & FSRS Spacing', () => {
    let mockService: MockDataService;

    beforeEach(() => {
      mockService = new MockDataService();
    });

    it('creates and retrieves an image occlusion flashcard with full zone metadata', async () => {
      const zones: ImageOcclusionZone[] = [
        { id: 'zone_cortex', x: 25, y: 30, width: 20, height: 10, label: 'Prefrontal Cortex' },
        { id: 'zone_amygdala', x: 50, y: 60, width: 15, height: 12, label: 'Amygdala' }
      ];

      const created = await mockService.flashcards.createFlashcard({
        subjectId: 'sbj_1',
        frontPrompt: 'Identify the active cortical region [?]',
        backAnswer: 'Prefrontal Cortex',
        cardType: 'image_occlusion',
        imageUrl: DIAGRAM_PRESETS[0].url,
        occlusionZones: zones,
        activeOcclusionZoneId: 'zone_cortex'
      });

      expect(created.id).toBeDefined();
      expect(created.cardType).toBe('image_occlusion');
      expect(created.imageUrl).toBe(DIAGRAM_PRESETS[0].url);
      expect(created.occlusionZones).toHaveLength(2);
      expect(created.activeOcclusionZoneId).toBe('zone_cortex');

      const fetched = await mockService.flashcards.getFlashcardById(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.cardType).toBe('image_occlusion');
      expect(fetched?.occlusionZones?.[0].label).toBe('Prefrontal Cortex');
    });

    it('advances FSRS-5 memory state correctly when practicing image occlusion recall', async () => {
      const card = await mockService.flashcards.createFlashcard({
        subjectId: 'sbj_1',
        frontPrompt: 'Identify highlighted organelle',
        backAnswer: 'Mitochondrial Matrix',
        cardType: 'image_occlusion',
        imageUrl: DIAGRAM_PRESETS[1].url,
        occlusionZones: DIAGRAM_PRESETS[1].defaultZones,
        activeOcclusionZoneId: 'm3'
      });

      expect(card.repetitionCount).toBe(0);

      // Attempt successful recall with 'good' rating
      const reviewed = await mockService.flashcards.recordCardAttempt(card.id, 'good');
      expect(reviewed.repetitionCount).toBe(1);
      expect(reviewed.intervalDays).toBeGreaterThanOrEqual(1);
      expect(reviewed.difficultyRating).toBe('good');
      expect(reviewed.imageUrl).toBe(DIAGRAM_PRESETS[1].url);
      expect(reviewed.activeOcclusionZoneId).toBe('m3');
    });
  });
});
