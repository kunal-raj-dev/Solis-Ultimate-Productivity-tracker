import { PriorityLevel } from '../../types/common';
import { IDataService } from '../../services/api.interface';
import { dataService } from '../../services/dataService';

export interface ImportedLmsCourse {
  externalId: string;
  name: string;
  code: string;
  color: 'coral' | 'amber' | 'lavender' | 'sage';
  targetHoursPerWeek: number;
}

export interface ImportedLmsTopic {
  courseCode: string;
  title: string;
  description?: string;
  orderIndex: number;
}

export interface ImportedLmsAssignment {
  courseCode: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  pointsPossible?: number;
  estimatedMinutes: number;
  priority: PriorityLevel;
  assignmentType: 'assignment' | 'exam' | 'quiz' | 'reading' | 'project';
}

export interface LmsImportResult {
  sourceFormat: 'canvas_json' | 'lms_csv' | 'syllabus_text';
  courses: ImportedLmsCourse[];
  topics: ImportedLmsTopic[];
  assignments: ImportedLmsAssignment[];
  warnings: string[];
}

const SUBJECT_COLORS: Array<'coral' | 'amber' | 'lavender' | 'sage'> = [
  'coral',
  'sage',
  'lavender',
  'amber'
];

function normalizeDateString(raw?: string | null): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  const trimmed = raw.trim();
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function inferPriorityFromPoints(points?: number, title = ''): PriorityLevel {
  const lower = title.toLowerCase();
  if (/\b(final|midterm|exam|capstone|thesis)\b/.test(lower) || (points !== undefined && points >= 100)) {
    return 'urgent';
  }
  if (/\b(project|paper|lab|problem set|pset)\b/.test(lower) || (points !== undefined && points >= 50)) {
    return 'high';
  }
  if (points !== undefined && points < 15) {
    return 'low';
  }
  return 'medium';
}

function inferEstimatedMinutes(points?: number, title = ''): number {
  const lower = title.toLowerCase();
  if (/\b(final|midterm|exam|project|capstone)\b/.test(lower)) return 120;
  if (/\b(lab|problem set|pset|essay)\b/.test(lower)) return 90;
  if (/\b(quiz|reading|discussion)\b/.test(lower)) return 30;
  if (points !== undefined) {
    if (points >= 100) return 120;
    if (points >= 50) return 90;
    if (points >= 20) return 60;
    return 30;
  }
  return 60;
}

function inferAssignmentType(title: string, rawType = ''): ImportedLmsAssignment['assignmentType'] {
  const combined = `${title} ${rawType}`.toLowerCase();
  if (/\b(exam|midterm|final)\b/.test(combined)) return 'exam';
  if (/\b(quiz|test)\b/.test(combined)) return 'quiz';
  if (/\b(project|capstone|presentation)\b/.test(combined)) return 'project';
  if (/\b(reading|chapter|lecture)\b/.test(combined)) return 'reading';
  return 'assignment';
}

/**
 * Parses Canvas / Blackboard JSON exports.
 */
function parseCanvasJson(rawJson: string): LmsImportResult {
  const parsed = JSON.parse(rawJson);
  const courses: ImportedLmsCourse[] = [];
  const topics: ImportedLmsTopic[] = [];
  const assignments: ImportedLmsAssignment[] = [];
  const warnings: string[] = [];

  const courseMap = new Map<string, ImportedLmsCourse>();

  const ensureCourse = (idOrCode: string, name?: string, code?: string): ImportedLmsCourse => {
    const key = (code || idOrCode || 'COURSE-101').trim().toUpperCase();
    const existing = courseMap.get(key);
    if (existing) return existing;

    const created: ImportedLmsCourse = {
      externalId: String(idOrCode || key),
      name: (name || code || idOrCode || 'Imported LMS Course').trim(),
      code: key.slice(0, 12),
      color: SUBJECT_COLORS[courseMap.size % SUBJECT_COLORS.length],
      targetHoursPerWeek: 6
    };
    courseMap.set(key, created);
    courses.push(created);
    return created;
  };

  const rawCourses = Array.isArray(parsed.courses)
    ? parsed.courses
    : parsed.course
    ? [parsed.course]
    : [];

  for (const c of rawCourses) {
    const code = String(c.course_code || c.code || c.id || 'LMS-101').trim().toUpperCase();
    const name = String(c.name || c.title || code).trim();
    ensureCourse(String(c.id || code), name, code);

    // Nested modules inside course
    if (Array.isArray(c.modules)) {
      c.modules.forEach((mod: Record<string, unknown>, idx: number) => {
        const modTitle = String(mod.name || mod.title || '').trim();
        if (modTitle) {
          topics.push({
            courseCode: code,
            title: modTitle,
            description: typeof mod.description === 'string' ? mod.description : undefined,
            orderIndex: topics.length + idx
          });
        }
      });
    }

    // Nested assignments inside course
    if (Array.isArray(c.assignments)) {
      c.assignments.forEach((asgn: Record<string, unknown>) => {
        const title = String(asgn.name || asgn.title || '').trim();
        if (!title) return;
        const pts = typeof asgn.points_possible === 'number'
          ? asgn.points_possible
          : typeof asgn.points === 'number'
          ? asgn.points
          : undefined;
        assignments.push({
          courseCode: code,
          title,
          description: typeof asgn.description === 'string' ? asgn.description.replace(/<[^>]+>/g, '').trim() : undefined,
          dueDate: normalizeDateString(String(asgn.due_at || asgn.dueDate || '')),
          pointsPossible: pts,
          estimatedMinutes: inferEstimatedMinutes(pts, title),
          priority: inferPriorityFromPoints(pts, title),
          assignmentType: inferAssignmentType(title, String(asgn.submission_types || asgn.type || ''))
        });
      });
    }
  }

  // Top-level modules array
  if (Array.isArray(parsed.modules)) {
    parsed.modules.forEach((mod: Record<string, unknown>, idx: number) => {
      const modTitle = String(mod.name || mod.title || '').trim();
      if (!modTitle) return;
      const course = ensureCourse(
        String(mod.course_code || mod.course_id || courses[0]?.code || 'LMS-101'),
        typeof mod.course_name === 'string' ? mod.course_name : undefined,
        typeof mod.course_code === 'string' ? mod.course_code : courses[0]?.code
      );
      topics.push({
        courseCode: course.code,
        title: modTitle,
        description: typeof mod.description === 'string' ? mod.description : undefined,
        orderIndex: topics.length + idx
      });
    });
  }

  // Top-level assignments array (or root array of assignments)
  const rawAssignments = Array.isArray(parsed.assignments)
    ? parsed.assignments
    : Array.isArray(parsed)
    ? parsed
    : [];

  for (const asgn of rawAssignments) {
    if (!asgn || typeof asgn !== 'object') continue;
    const title = String(asgn.name || asgn.title || '').trim();
    if (!title) continue;
    const course = ensureCourse(
      String(asgn.course_code || asgn.course_id || courses[0]?.code || 'LMS-101'),
      typeof asgn.course_name === 'string' ? asgn.course_name : undefined,
      typeof asgn.course_code === 'string' ? asgn.course_code : courses[0]?.code
    );
    const pts = typeof asgn.points_possible === 'number'
      ? asgn.points_possible
      : typeof asgn.points === 'number'
      ? asgn.points
      : undefined;
    assignments.push({
      courseCode: course.code,
      title,
      description: typeof asgn.description === 'string' ? asgn.description.replace(/<[^>]+>/g, '').trim() : undefined,
      dueDate: normalizeDateString(String(asgn.due_at || asgn.dueDate || '')),
      pointsPossible: pts,
      estimatedMinutes: inferEstimatedMinutes(pts, title),
      priority: inferPriorityFromPoints(pts, title),
      assignmentType: inferAssignmentType(title, String(asgn.submission_types || asgn.type || ''))
    });
  }

  if (courses.length === 0 && topics.length === 0 && assignments.length === 0) {
    warnings.push('No courses, syllabus modules, or assignments were found in the JSON payload.');
  }

  return {
    sourceFormat: 'canvas_json',
    courses,
    topics,
    assignments,
    warnings
  };
}

/**
 * Splits a single CSV row honoring quoted fields.
 */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Parses LMS CSV assignment / syllabus exports.
 */
function parseLmsCsv(rawCsv: string): LmsImportResult {
  const lines = rawCsv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      sourceFormat: 'lms_csv',
      courses: [],
      topics: [],
      assignments: [],
      warnings: ['CSV file must include a header row and at least one data row.']
    };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const titleIdx = headers.findIndex((h) => /title|assignment|name|item/.test(h));
  const courseIdx = headers.findIndex((h) => /course|subject|class|code/.test(h));
  const dueIdx = headers.findIndex((h) => /due|date|deadline/.test(h));
  const pointsIdx = headers.findIndex((h) => /point|score|weight/.test(h));
  const typeIdx = headers.findIndex((h) => /type|category|module|kind/.test(h));

  const courses: ImportedLmsCourse[] = [];
  const topics: ImportedLmsTopic[] = [];
  const assignments: ImportedLmsAssignment[] = [];
  const warnings: string[] = [];
  const courseMap = new Map<string, ImportedLmsCourse>();

  const ensureCourse = (rawCourse: string): ImportedLmsCourse => {
    const cleaned = (rawCourse || 'LMS-101').trim();
    const codeMatch = cleaned.match(/^([A-Z]{2,5}[-\s]?\d{2,4}[A-Z]?)/i);
    const code = (codeMatch ? codeMatch[1].replace(/\s+/g, '-') : cleaned.slice(0, 10)).toUpperCase();
    const existing = courseMap.get(code);
    if (existing) return existing;

    const created: ImportedLmsCourse = {
      externalId: code,
      name: cleaned,
      code,
      color: SUBJECT_COLORS[courseMap.size % SUBJECT_COLORS.length],
      targetHoursPerWeek: 6
    };
    courseMap.set(code, created);
    courses.push(created);
    return created;
  };

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const title = (titleIdx >= 0 ? cells[titleIdx] : cells[0])?.trim();
    if (!title) continue;

    const rawCourse = (courseIdx >= 0 ? cells[courseIdx] : 'LMS-101') || 'LMS-101';
    const course = ensureCourse(rawCourse);
    const dueRaw = dueIdx >= 0 ? cells[dueIdx] : undefined;
    const ptsRaw = pointsIdx >= 0 ? Number(cells[pointsIdx]) : undefined;
    const points = ptsRaw !== undefined && !Number.isNaN(ptsRaw) ? ptsRaw : undefined;
    const rawType = (typeIdx >= 0 ? cells[typeIdx] : '') || '';

    if (/\b(module|unit|week|topic|syllabus)\b/i.test(rawType) && !dueRaw) {
      topics.push({
        courseCode: course.code,
        title,
        orderIndex: topics.length
      });
    } else {
      assignments.push({
        courseCode: course.code,
        title,
        dueDate: normalizeDateString(dueRaw),
        pointsPossible: points,
        estimatedMinutes: inferEstimatedMinutes(points, title),
        priority: inferPriorityFromPoints(points, title),
        assignmentType: inferAssignmentType(title, rawType)
      });
    }
  }

  return {
    sourceFormat: 'lms_csv',
    courses,
    topics,
    assignments,
    warnings
  };
}

/**
 * Parses structured or pasted syllabus / assignment text.
 */
function parseSyllabusText(rawText: string): LmsImportResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const courses: ImportedLmsCourse[] = [];
  const topics: ImportedLmsTopic[] = [];
  const assignments: ImportedLmsAssignment[] = [];
  const warnings: string[] = [];

  let activeCourse: ImportedLmsCourse = {
    externalId: 'SYL-101',
    name: 'Imported Course Syllabus',
    code: 'SYL-101',
    color: 'coral',
    targetHoursPerWeek: 6
  };

  const ensureActiveCoursePushed = () => {
    if (!courses.some((c) => c.code === activeCourse.code)) {
      courses.push(activeCourse);
    }
  };

  for (const line of lines) {
    // 1. Course header detection: e.g. "Course: CS-301 Operating Systems" or "# BIO-204 Cell Biology"
    const courseMatch =
      line.match(/^(?:Course|Subject|Class)\s*:\s*(.+)$/i) ||
      line.match(/^#+\s*([A-Z]{2,5}[-\s]\d{2,4}\s+.+)$/i);
    if (courseMatch) {
      const fullTitle = courseMatch[1].trim();
      const codeToken = fullTitle.match(/^([A-Z]{2,5}[-\s]?\d{2,4}[A-Z]?)\b/i);
      const code = codeToken ? codeToken[1].toUpperCase().replace(/\s+/g, '-') : `CRS-${courses.length + 1}`;
      const name = codeToken ? fullTitle.slice(codeToken[0].length).replace(/^[:\-\s]+/, '').trim() || fullTitle : fullTitle;
      activeCourse = {
        externalId: code,
        name,
        code,
        color: SUBJECT_COLORS[courses.length % SUBJECT_COLORS.length],
        targetHoursPerWeek: 6
      };
      courses.push(activeCourse);
      continue;
    }

    // 2. Assignment / Exam / Problem Set detection
    const assignmentMatch = line.match(
      /^(?:[-*•]\s*)?(?:(Assignment|Homework|HW|Lab|Project|Quiz|Midterm|Final|Exam|Problem Set|PSet)\s*[:\-]?\s*)(.+)$/i
    );
    if (assignmentMatch) {
      ensureActiveCoursePushed();
      const prefix = assignmentMatch[1];
      let body = assignmentMatch[2].trim();

      // Extract optional due date (e.g., "Due: 2026-10-15" or "Due 2026-10-15" or "(2026-10-15)")
      let dueDate: string | undefined;
      const dueMatch = body.match(/(?:\bDue(?:\s+Date)?\s*[:\-]?\s*|\()(\d{4}-\d{2}-\d{2}|\w+\s+\d{1,2},?\s+\d{4})\)?/i);
      if (dueMatch) {
        dueDate = normalizeDateString(dueMatch[1]);
        body = body.replace(dueMatch[0], '').trim();
      }

      // Extract optional points (e.g., "(100 pts)" or "- 50 points")
      let points: number | undefined;
      const ptsMatch = body.match(/\(?(\d+)\s*(?:pts|points)\)?/i);
      if (ptsMatch) {
        points = Number(ptsMatch[1]);
        body = body.replace(ptsMatch[0], '').trim();
      }

      const cleanTitle = body.replace(/[-–—:,\s]+$/, '').trim() || `${prefix} Item`;
      const fullTitle = cleanTitle.toLowerCase().startsWith(prefix.toLowerCase())
        ? cleanTitle
        : `${prefix}: ${cleanTitle}`;

      assignments.push({
        courseCode: activeCourse.code,
        title: fullTitle,
        dueDate,
        pointsPossible: points,
        estimatedMinutes: inferEstimatedMinutes(points, fullTitle),
        priority: inferPriorityFromPoints(points, fullTitle),
        assignmentType: inferAssignmentType(fullTitle, prefix)
      });
      continue;
    }

    // 3. Week / Module / Unit / Lecture topic detection
    const moduleMatch = line.match(
      /^(?:[-*•]\s*)?(?:(Week|Module|Unit|Lecture|Chapter|Topic)\s*\d*\s*[:\-]\s*)(.+)$/i
    );
    if (moduleMatch) {
      ensureActiveCoursePushed();
      const topicTitle = `${moduleMatch[1].trim()}: ${moduleMatch[2].trim()}`.replace(/\s+/g, ' ');
      topics.push({
        courseCode: activeCourse.code,
        title: topicTitle,
        orderIndex: topics.length
      });
      continue;
    }
  }

  if (courses.length === 0 && topics.length === 0 && assignments.length === 0) {
    warnings.push(
      'Could not detect structured courses, modules (e.g. "Week 1: ..."), or assignments (e.g. "Assignment: ... - Due 2026-10-15").'
    );
  }

  return {
    sourceFormat: 'syllabus_text',
    courses,
    topics,
    assignments,
    warnings
  };
}

/**
 * Universal LMS & Syllabus parser entry point. Auto-detects Canvas JSON, LMS CSV, or Syllabus Text.
 */
export function parseLmsImportPayload(content: string, fileName = ''): LmsImportResult {
  const trimmed = content.trim();
  const lowerName = fileName.toLowerCase();

  if (!trimmed) {
    return {
      sourceFormat: 'syllabus_text',
      courses: [],
      topics: [],
      assignments: [],
      warnings: ['Input payload is empty.']
    };
  }

  // 1. JSON payload
  if (lowerName.endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return parseCanvasJson(trimmed);
    } catch (err) {
      return {
        sourceFormat: 'canvas_json',
        courses: [],
        topics: [],
        assignments: [],
        warnings: [`Invalid JSON format: ${err instanceof Error ? err.message : 'Parse error'}`]
      };
    }
  }

  // 2. CSV payload
  const firstLine = trimmed.split(/\r?\n/)[0] || '';
  if (
    lowerName.endsWith('.csv') ||
    (firstLine.includes(',') && /\b(title|assignment|course|due|points)\b/i.test(firstLine))
  ) {
    return parseLmsCsv(trimmed);
  }

  // 3. Structured Syllabus / Assignment Text
  return parseSyllabusText(trimmed);
}

/**
 * Sample Canvas LMS export JSON for 1-click testing and preview in ImportModal.
 */
export function getSampleCanvasExportJson(): string {
  return JSON.stringify(
    {
      courses: [
        {
          id: 'cs-301',
          course_code: 'CS-301',
          name: 'Operating Systems & Kernel Design',
          modules: [
            { name: 'Module 1: Processes, Threads & Context Switching' },
            { name: 'Module 2: Concurrency, Mutexes & Deadlock Prevention' },
            { name: 'Module 3: Virtual Memory, Page Tables & TLB Caching' },
            { name: 'Module 4: File Systems, Journaling & Crash Recovery' }
          ],
          assignments: [
            {
              name: 'Kernel Lab 1: Thread Scheduler Implementation',
              due_at: '2026-10-14T23:59:00Z',
              points_possible: 100,
              submission_types: 'online_upload'
            },
            {
              name: 'Problem Set 2: Deadlock & Dining Philosophers Proof',
              due_at: '2026-10-22T23:59:00Z',
              points_possible: 50,
              submission_types: 'online_upload'
            },
            {
              name: 'Midterm Exam: Concurrency & Virtual Memory',
              due_at: '2026-11-05T18:00:00Z',
              points_possible: 150,
              submission_types: 'exam'
            }
          ]
        }
      ]
    },
    null,
    2
  );
}

/**
 * Commits a parsed `LmsImportResult` into Solis subjects, syllabus topics, and tasks.
 */
export async function executeLmsImport(
  result: LmsImportResult,
  service: IDataService = dataService
): Promise<{
  subjectsCreated: number;
  topicsCreated: number;
  assignmentsCreated: number;
}> {
  let subjectsCreated = 0;
  let topicsCreated = 0;
  let assignmentsCreated = 0;

  const existingSubjects = await service.study.getSubjects(true);
  const codeToSubjectId = new Map<string, string>();
  for (const sub of existingSubjects) {
    if (sub.code) {
      codeToSubjectId.set(sub.code.trim().toUpperCase(), sub.id);
    }
    codeToSubjectId.set(sub.name.trim().toUpperCase(), sub.id);
  }

  for (const course of result.courses) {
    const codeKey = course.code.trim().toUpperCase();
    const nameKey = course.name.trim().toUpperCase();
    const existingId = codeToSubjectId.get(codeKey) || codeToSubjectId.get(nameKey);
    if (existingId) {
      codeToSubjectId.set(codeKey, existingId);
      continue;
    }

    const created = await service.study.createSubject({
      name: course.name,
      code: course.code,
      color: course.color,
      targetHoursPerWeek: course.targetHoursPerWeek
    });
    codeToSubjectId.set(codeKey, created.id);
    subjectsCreated += 1;
  }

  // Fallback subject if topics/assignments reference an unknown code
  const resolveSubjectId = async (courseCode: string): Promise<string> => {
    const key = courseCode.trim().toUpperCase();
    const found = codeToSubjectId.get(key);
    if (found) return found;

    const created = await service.study.createSubject({
      name: courseCode || 'LMS Imported Course',
      code: key.slice(0, 10) || 'LMS-101',
      color: 'coral',
      targetHoursPerWeek: 6
    });
    codeToSubjectId.set(key, created.id);
    subjectsCreated += 1;
    return created.id;
  };

  // Create syllabus topics (deduping by lowercase title per subject)
  const existingTopicsBySubject = new Map<string, Set<string>>();
  for (const topic of result.topics) {
    const subjectId = await resolveSubjectId(topic.courseCode);
    let subjectTopicSet = existingTopicsBySubject.get(subjectId);
    if (!subjectTopicSet) {
      const currentTopics = await service.study.getTopics(subjectId);
      subjectTopicSet = new Set(currentTopics.map((t) => t.title.trim().toLowerCase()));
      existingTopicsBySubject.set(subjectId, subjectTopicSet);
    }

    const titleKey = topic.title.trim().toLowerCase();
    if (subjectTopicSet.has(titleKey)) continue;

    await service.study.createTopic({
      subjectId,
      title: topic.title,
      description: topic.description,
      orderIndex: topic.orderIndex,
      masteryLevel: 'unstudied'
    });
    subjectTopicSet.add(titleKey);
    topicsCreated += 1;
  }

  // Create tasks for assignments (deduping by lowercase title)
  const existingTasks = await service.tasks.getTasks();
  const existingTaskTitles = new Set(existingTasks.map((t) => t.title.trim().toLowerCase()));

  for (const asgn of result.assignments) {
    const titleKey = asgn.title.trim().toLowerCase();
    if (existingTaskTitles.has(titleKey)) continue;

    const subjectId = await resolveSubjectId(asgn.courseCode);
    await service.tasks.createTask({
      title: asgn.title,
      description: asgn.description,
      status: 'todo',
      priority: asgn.priority,
      category: asgn.assignmentType === 'project' ? 'project' : asgn.assignmentType === 'reading' ? 'review' : 'study',
      dueDate: asgn.dueDate,
      estimatedMinutes: asgn.estimatedMinutes,
      subjectId,
      subTasks: [],
      tags: ['lms-import', asgn.courseCode.toLowerCase(), asgn.assignmentType]
    });
    existingTaskTitles.add(titleKey);
    assignmentsCreated += 1;
  }

  return {
    subjectsCreated,
    topicsCreated,
    assignmentsCreated
  };
}
