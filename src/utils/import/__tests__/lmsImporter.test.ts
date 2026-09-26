import { describe, it, expect } from 'vitest';
import {
  parseLmsImportPayload,
  getSampleCanvasExportJson,
  executeLmsImport
} from '../lmsImporter';
import { MockDataService } from '../../../services/mock/mockService';

describe('Feature 4.1: Canvas / Blackboard LMS Assignment & Syllabus Importer', () => {
  it('parses Canvas JSON exports into courses, syllabus topics, and prioritized assignments', () => {
    const sampleJson = getSampleCanvasExportJson();
    const result = parseLmsImportPayload(sampleJson, 'canvas-export.json');

    expect(result.sourceFormat).toBe('canvas_json');
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].code).toBe('CS-301');
    expect(result.topics).toHaveLength(4);
    expect(result.assignments).toHaveLength(3);

    const midterm = result.assignments.find((a) => a.title.includes('Midterm'));
    expect(midterm?.priority).toBe('urgent');
    expect(midterm?.dueDate).toBe('2026-11-05');
  });

  it('parses LMS CSV gradebook/assignment exports accurately', () => {
    const csv = [
      'Title,Course,Due Date,Points,Type',
      '"Problem Set 1: Stoichiometry","CHEM-102 General Chemistry",2026-10-12,50,Assignment',
      '"Unit 1: Atomic Orbitals & Bonding","CHEM-102 General Chemistry",,0,Module',
      '"Final Exam: Thermodynamics","CHEM-102 General Chemistry",2026-12-10,200,Exam'
    ].join('\n');

    const result = parseLmsImportPayload(csv, 'gradebook.csv');

    expect(result.sourceFormat).toBe('lms_csv');
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].code).toBe('CHEM-102');
    expect(result.topics).toHaveLength(1);
    expect(result.assignments).toHaveLength(2);
    expect(result.assignments[1].priority).toBe('urgent');
  });

  it('parses structured syllabus plain text into courses, weekly modules, and assignments', () => {
    const syllabusText = `
      Course: BIO-204 Cellular & Molecular Biology
      Week 1: Plasma Membrane & Signal Transduction
      Week 2: Glycolysis & Citric Acid Cycle
      Assignment: Lab Report 1 - Due 2026-10-18 (60 pts)
      Exam: Midterm Assessment - Due 2026-11-09 (120 pts)
    `;

    const result = parseLmsImportPayload(syllabusText, 'syllabus.txt');

    expect(result.sourceFormat).toBe('syllabus_text');
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].code).toBe('BIO-204');
    expect(result.topics).toHaveLength(2);
    expect(result.assignments).toHaveLength(2);
    expect(result.assignments[0].dueDate).toBe('2026-10-18');
  });

  it('executes LMS import idempotently into MockDataService without duplicating records', async () => {
    const service = new MockDataService();
    const parsed = parseLmsImportPayload(getSampleCanvasExportJson(), 'canvas.json');

    const firstRun = await executeLmsImport(parsed, service);
    expect(firstRun.subjectsCreated).toBe(1);
    expect(firstRun.topicsCreated).toBe(4);
    expect(firstRun.assignmentsCreated).toBe(3);

    // Running again should skip already-imported subjects, topics, and tasks
    const secondRun = await executeLmsImport(parsed, service);
    expect(secondRun.subjectsCreated).toBe(0);
    expect(secondRun.topicsCreated).toBe(0);
    expect(secondRun.assignmentsCreated).toBe(0);
  });
});
