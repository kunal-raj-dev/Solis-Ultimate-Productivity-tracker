import { UserProfile } from '../../types/auth';
import { Task } from '../../types/task';
import { StudySubject, StudySession, StudyPlanItem, StudyTopic } from '../../types/study';
import { Note } from '../../types/note';
import { FocusSession } from '../../types/focus';
import { Habit } from '../../types/habit';
import { Goal } from '../../types/goal';
import { Flashcard, ReviewQueueItem } from '../../types/learning';
import { RecurringStudyRoutine } from '../../types/planning';
import { StudyResource } from '../../types/resource';
import { DailyReflection } from '../../types/reflection';
import { getISODateString } from '../../utils/date';

const todayStr = getISODateString(new Date());

const yesterdayDate = new Date();
yesterdayDate.setDate(yesterdayDate.getDate() - 1);
const yesterdayStr = getISODateString(yesterdayDate);

const twoDaysAgoDate = new Date();
twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
const twoDaysAgoStr = getISODateString(twoDaysAgoDate);

const threeDaysAgoDate = new Date();
threeDaysAgoDate.setDate(threeDaysAgoDate.getDate() - 3);
const threeDaysAgoStr = getISODateString(threeDaysAgoDate);

export const MOCK_USER: UserProfile = {
  id: 'usr_001',
  name: 'Kunal',
  email: 'kunal@solis.space',
  focusField: 'Systems Architecture & Computational Design',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-08-17T08:00:00.000Z',
  preferences: {
    theme: 'light',
    soundEnabled: true,
    defaultFocusDurationMinutes: 25,
    defaultBreakDurationMinutes: 5,
    dailyStudyGoalMinutes: 180,
    dailyTasksGoalCount: 5,
    focusGradientTheme: 'momentum'
  }
};

export const MOCK_SUBJECTS: StudySubject[] = [
  {
    id: 'sbj_1',
    name: 'Distributed Systems',
    code: 'CS 440',
    description: 'Consensus algorithms, replication invariants, and fault-tolerant state machines.',
    color: 'coral',
    targetHoursPerWeek: 12,
    completedHoursThisWeek: 8.5,
    status: 'active',
    notesCount: 14,
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  },
  {
    id: 'sbj_2',
    name: 'Advanced Algorithms',
    code: 'CS 480',
    description: 'Graph algorithms, dynamic programming, and complexity analysis.',
    color: 'amber',
    targetHoursPerWeek: 10,
    completedHoursThisWeek: 6.0,
    status: 'active',
    notesCount: 22,
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  },
  {
    id: 'sbj_3',
    name: 'Compiler Engineering',
    code: 'CS 510',
    description: 'Lexical analysis, AST generation, LLVM intermediate representations, and register allocation.',
    color: 'lavender',
    targetHoursPerWeek: 8,
    completedHoursThisWeek: 4.5,
    status: 'active',
    notesCount: 9,
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  }
];

export const MOCK_TOPICS: StudyTopic[] = [
  {
    id: 'top_1',
    subjectId: 'sbj_1',
    title: 'Raft Consensus Protocol',
    description: 'Leader election, log matching, safety invariants, and joint consensus.',
    orderIndex: 1,
    masteryLevel: 'learning',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  },
  {
    id: 'top_2',
    subjectId: 'sbj_1',
    title: 'Byzantine Fault Tolerance',
    description: 'PBFT, quorum slices, and threshold cryptography in distributed networks.',
    orderIndex: 2,
    masteryLevel: 'unstudied',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  },
  {
    id: 'top_3',
    subjectId: 'sbj_2',
    title: 'Topological Sort & DAGs',
    description: 'Kahns algorithm, DFS cycle detection, and scheduling dependencies.',
    orderIndex: 1,
    masteryLevel: 'mastered',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'tsk_101',
    subjectId: 'sbj_1',
    title: 'Deep review: Distributed consensus algorithms (Raft vs Paxos)',
    description: 'Synthesize lecture notes, review state machine replication invariants, and write 2-page summary.',
    status: 'in_progress',
    priority: 'high',
    category: 'deep_work',
    dueDate: todayStr,
    dueTime: '18:00',
    estimatedMinutes: 60,
    completedMinutes: 30,
    subTasks: [
      { id: 'st_1', title: 'Review leader election proofs', completed: true, createdAt: '2026-08-17T07:30:00.000Z' },
      { id: 'st_2', title: 'Compare log compaction mechanisms', completed: false, createdAt: '2026-08-17T07:30:00.000Z' },
      { id: 'st_3', title: 'Write active recall flashcards', completed: false, createdAt: '2026-08-17T07:30:00.000Z' }
    ],
    tags: ['Architecture', 'Distributed Systems', 'Core'],
    createdAt: '2026-08-17T07:30:00.000Z',
    updatedAt: '2026-08-17T08:30:00.000Z'
  },
  {
    id: 'tsk_102',
    subjectId: 'sbj_2',
    title: 'Implement LeetCode graph problem set #4 (Topological sort)',
    description: 'Solve Course Schedule II and Alien Dictionary in TypeScript.',
    status: 'todo',
    priority: 'high',
    category: 'study',
    dueDate: todayStr,
    dueTime: '20:00',
    estimatedMinutes: 45,
    completedMinutes: 0,
    subTasks: [
      { id: 'st_4', title: 'Kahn algorithm implementation', completed: false, createdAt: '2026-08-17T08:00:00.000Z' },
      { id: 'st_5', title: 'DFS cycle detection comparison', completed: false, createdAt: '2026-08-17T08:00:00.000Z' }
    ],
    tags: ['Algorithms', 'Practice'],
    createdAt: '2026-08-17T08:00:00.000Z',
    updatedAt: '2026-08-17T08:00:00.000Z'
  },
  {
    id: 'tsk_103',
    title: 'Design token audit & accessibility contrast verification',
    description: 'Verify WCAG AA 4.5:1 ratio across all warm ivory and coral surface combinations.',
    status: 'completed',
    priority: 'medium',
    category: 'project',
    dueDate: todayStr,
    dueTime: '12:00',
    estimatedMinutes: 30,
    completedMinutes: 30,
    completedAt: '2026-08-17T07:15:00.000Z',
    subTasks: [],
    tags: ['Design System', 'Accessibility'],
    createdAt: '2026-08-17T06:00:00.000Z',
    updatedAt: '2026-08-17T07:15:00.000Z'
  }
];

export const MOCK_STUDY_SESSIONS: StudySession[] = [
  {
    id: 'ses_01',
    subjectId: 'sbj_1',
    subjectName: 'Distributed Systems',
    planItemId: 'spl_1',
    type: 'deep_study',
    durationMinutes: 50,
    topicsCovered: ['Raft leader election', 'Heartbeat timers', 'Term numbers'],
    notes: 'Key realization: split votes are mitigated through randomized election timeouts.',
    retentionRating: 5,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ses_02',
    subjectId: 'sbj_2',
    subjectName: 'Advanced Algorithms',
    type: 'active_recall',
    durationMinutes: 45,
    topicsCovered: ['Dijkstra with Indexed Min-Heap', 'Bellman-Ford negative cycle proof'],
    retentionRating: 4,
    completedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

export const MOCK_STUDY_PLAN: StudyPlanItem[] = [
  {
    id: 'spl_1',
    subjectId: 'sbj_1',
    subjectName: 'Distributed Systems',
    topicId: 'top_1',
    title: 'Raft Consensus Protocol & Safety Proofs',
    targetMinutes: 50,
    scheduledDate: todayStr,
    scheduledTime: '10:00 AM',
    priority: 'high',
    completed: true,
    actualMinutesLogged: 50
  },
  {
    id: 'spl_2',
    subjectId: 'sbj_2',
    subjectName: 'Advanced Algorithms',
    topicId: 'top_3',
    title: 'Topological Sort & DAG Properties',
    targetMinutes: 45,
    scheduledDate: todayStr,
    scheduledTime: '02:00 PM',
    priority: 'high',
    completed: false,
    actualMinutesLogged: 0
  },
  {
    id: 'spl_3',
    subjectId: 'sbj_3',
    subjectName: 'Compiler Engineering',
    title: 'LLVM IR Generation Pass',
    targetMinutes: 40,
    scheduledDate: todayStr,
    scheduledTime: '05:00 PM',
    priority: 'medium',
    completed: false,
    actualMinutesLogged: 0
  }
];

export const MOCK_NOTES: Note[] = [
  {
    id: 'not_1',
    subjectId: 'sbj_1',
    subjectName: 'Distributed Systems',
    planItemId: 'spl_1',
    title: 'Raft Leader Election & Term Monotonicity',
    content: `# Raft Leader Election & Term Monotonicity

Terms act as a logical clock in Raft. They allow servers to detect obsolete information such as stale leaders.

## Core Invariants
1. **Election Safety**: At most one leader can be elected in a given term.
2. **Leader Append-Only**: A leader never overwrites or truncates its log; it only appends new entries.
3. **Log Matching Property**: If two logs contain an entry with the same index and term, they are identical up to that point.

## Randomized Timeouts
To prevent split votes in election phases, Raft chooses election timeouts randomly from a fixed interval (e.g. 150–300ms).`,
    category: 'concept',
    tags: ['raft', 'consensus', 'distributed-systems', 'invariants'],
    createdAt: '2026-08-17T07:00:00.000Z',
    updatedAt: '2026-08-17T08:30:00.000Z'
  },
  {
    id: 'not_2',
    subjectId: 'sbj_2',
    subjectName: 'Advanced Algorithms',
    planItemId: 'spl_2',
    title: 'Topological Sort DAG Invariants',
    content: `# Topological Sort DAG Invariants

Every directed acyclic graph (DAG) has at least one topological ordering.

## Kahn's Algorithm (BFS)
- Compute in-degree of all vertices in $O(V + E)$.
- Push all vertices with in-degree 0 onto a work queue.
- Pop vertex, append to topological sequence, decrement in-degree of all neighbors.
- If final sequence length $< |V|$, the graph contains a cycle.`,
    category: 'revision',
    tags: ['graphs', 'dag', 'algorithms', 'kahns-algorithm'],
    createdAt: '2026-08-16T14:00:00.000Z',
    updatedAt: '2026-08-17T06:00:00.000Z'
  }
];

export const MOCK_FOCUS_SESSIONS: FocusSession[] = [
  {
    id: 'fcs_01',
    mode: 'pomodoro',
    durationMinutes: 25,
    breakDurationMinutes: 5,
    subjectId: 'sbj_1',
    subjectName: 'Distributed Systems',
    planItemId: 'spl_1',
    title: 'Raft consensus invariants proof',
    completed: true,
    interruptionsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const MOCK_HABITS: Habit[] = [
  {
    id: 'hab_1',
    title: 'Morning Deep Study Block (90 min)',
    description: 'Zero notifications, high cognition material before noon.',
    category: 'study',
    frequency: 'daily',
    color: 'coral',
    currentStreak: 12,
    longestStreak: 28,
    completedToday: true,
    goalId: 'gol_1',
    goalTitle: 'CS 440 Distributed Systems Final Exam',
    history: {
      [todayStr]: true,
      [yesterdayStr]: true,
      [twoDaysAgoStr]: true,
      [threeDaysAgoStr]: true
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-17T08:00:00.000Z'
  },
  {
    id: 'hab_2',
    title: 'Active Recall & Spaced Review',
    description: 'Flashcard deck retention review and concept synthesis.',
    category: 'study',
    frequency: 'daily',
    color: 'amber',
    currentStreak: 8,
    longestStreak: 14,
    completedToday: false,
    history: {
      [todayStr]: false,
      [yesterdayStr]: true,
      [twoDaysAgoStr]: true,
      [threeDaysAgoStr]: true
    },
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-08-17T08:00:00.000Z'
  }
];

export const MOCK_GOALS: Goal[] = [
  {
    id: 'gol_1',
    subjectId: 'sbj_1',
    subjectName: 'Distributed Systems',
    title: 'CS 440 Distributed Systems Final Exam',
    description: 'Master consensus invariants, Raft leader election, Byzantine fault tolerance, and vector clocks for final exam.',
    horizon: 'short_term',
    status: 'active',
    category: 'academic',
    experienceType: 'exam',
    targetDate: '2026-09-15',
    progressPercentage: 65,
    priority: 'urgent',
    color: 'coral',
    targetScore: '95% (Distinction)',
    examWeight: 40,
    milestones: [
      { id: 'm1', title: 'Complete Syllabus Topics & Invariants Review', targetDate: '2026-08-25', completed: true },
      { id: 'm2', title: 'Full-Deck Active Recall Flashcard Drills', targetDate: '2026-09-05', completed: false },
      { id: 'm3', title: 'Timed Practice Exam Mock Test #1', targetDate: '2026-09-10', completed: false }
    ],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  },
  {
    id: 'gol_2',
    subjectId: 'sbj_1',
    subjectName: 'Distributed Systems',
    title: 'Distributed Storage Engine V2',
    description: 'Build a production-grade fault-tolerant KV database with Raft consensus, LSM tree storage, and linearizable reads.',
    horizon: 'medium_term',
    status: 'active',
    category: 'career',
    experienceType: 'project',
    targetDate: '2026-11-30',
    progressPercentage: 40,
    priority: 'high',
    color: 'amber',
    projectRepositoryUrl: 'https://github.com/scholar/storage-engine',
    deliverables: [
      '3-node Raft consensus cluster with heartbeat recovery',
      'LSM-Tree memtable and SSTable disk persistence',
      'gRPC client protocol and benchmarking suite'
    ],
    milestones: [
      { id: 'm4', title: 'Raft State Machine Implementation in Go', targetDate: '2026-08-30', completed: true },
      { id: 'm5', title: 'SSTable compaction & bloom filters', targetDate: '2026-09-30', completed: false },
      { id: 'm6', title: 'Chaos testing with network partition simulation', targetDate: '2026-10-31', completed: false }
    ],
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  },
  {
    id: 'gol_3',
    subjectId: 'sbj_2',
    subjectName: 'Advanced Algorithms',
    title: 'Algorithmic Mastery & Problem Solving Routine',
    description: 'Solve 150 graph, dynamic programming, and data structure problems with strict time complexity analysis.',
    horizon: 'medium_term',
    status: 'active',
    category: 'skill',
    experienceType: 'standard',
    targetDate: '2026-12-31',
    progressPercentage: 55,
    priority: 'medium',
    color: 'sage',
    milestones: [
      { id: 'm7', title: '50 Graph & Tree Problems Completed', targetDate: '2026-08-30', completed: true },
      { id: 'm8', title: '50 Dynamic Programming Patterns', targetDate: '2026-10-15', completed: false }
    ],
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  }
];

export const MOCK_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc_1',
    subjectId: 'sbj_1',
    subjectName: 'Distributed Systems',
    topicId: 'top_1',
    topicTitle: 'Raft Consensus Protocol',
    frontPrompt: 'What invariant guarantees that a committed entry in Raft will never be overwritten or lost in future terms?',
    backAnswer: 'The Leader Completeness Property: if a log entry is committed in a given term, that entry will be present in the logs of the leaders for all higher-numbered terms.',
    cardType: 'concept',
    difficultyRating: 'good',
    repetitionCount: 2,
    intervalDays: 3,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    createdAt: '2026-08-10T00:00:00.000Z',
    updatedAt: '2026-08-14T00:00:00.000Z'
  },
  {
    id: 'fc_2',
    subjectId: 'sbj_1',
    subjectName: 'Distributed Systems',
    topicId: 'top_1',
    topicTitle: 'Raft Consensus Protocol',
    frontPrompt: 'In Raft, a candidate wins an election if it receives votes from a {{majority}} of the servers in the full cluster.',
    backAnswer: 'majority',
    cardType: 'cloze',
    difficultyRating: 'easy',
    repetitionCount: 3,
    intervalDays: 6,
    easeFactor: 2.65,
    nextReviewDate: todayStr,
    createdAt: '2026-08-10T00:00:00.000Z',
    updatedAt: '2026-08-14T00:00:00.000Z'
  },
  {
    id: 'fc_3',
    subjectId: 'sbj_2',
    subjectName: 'Advanced Algorithms',
    topicId: 'top_3',
    topicTitle: 'Topological Sort & DAGs',
    frontPrompt: 'What is the runtime complexity of Kahns Algorithm for Topological Sorting on a DAG with V vertices and E edges?',
    backAnswer: 'O(V + E) time complexity using in-degree array and queue.',
    cardType: 'standard',
    difficultyRating: 'good',
    repetitionCount: 1,
    intervalDays: 1,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-16T00:00:00.000Z'
  }
];

export const MOCK_REVIEWS: ReviewQueueItem[] = [
  {
    id: 'rev_1',
    subjectId: 'sbj_1',
    subjectName: 'Distributed Systems',
    subjectColor: 'coral',
    topicId: 'top_1',
    topicTitle: 'Raft Consensus Protocol',
    dueDate: todayStr,
    priority: 'high',
    reason: '3 days elapsed since deep study session (Retention 4/5)',
    completed: false,
    createdAt: '2026-08-14T00:00:00.000Z'
  },
  {
    id: 'rev_2',
    subjectId: 'sbj_2',
    subjectName: 'Advanced Algorithms',
    subjectColor: 'sage',
    topicId: 'top_3',
    topicTitle: 'Topological Sort & DAGs',
    dueDate: todayStr,
    priority: 'medium',
    reason: 'Active recall due for 1 flashcard in deck',
    completed: false,
    createdAt: '2026-08-16T00:00:00.000Z'
  }
];

export const MOCK_ROUTINES: RecurringStudyRoutine[] = [
  {
    id: 'rtn_1',
    subjectId: 'sbj_1',
    subjectName: 'Distributed Systems',
    topicId: 'top_1',
    topicTitle: 'Raft Consensus Protocol',
    title: 'Distributed Consensus & Raft Deep Session',
    targetMinutes: 60,
    daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
    scheduledTime: '14:00',
    priority: 'urgent',
    isActive: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  },
  {
    id: 'rtn_2',
    subjectId: 'sbj_2',
    subjectName: 'Advanced Algorithms',
    topicId: 'top_3',
    topicTitle: 'Topological Sort & DAGs',
    title: 'Graph & Tree Algorithms Problem Solving',
    targetMinutes: 45,
    daysOfWeek: [1, 2, 3, 4, 5], // Weekdays
    scheduledTime: '16:30',
    priority: 'high',
    isActive: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  },
  {
    id: 'rtn_3',
    subjectId: 'sbj_1',
    subjectName: 'Distributed Systems',
    title: 'Daily Active Recall & Flashcard Drill',
    targetMinutes: 20,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Daily
    scheduledTime: '21:00',
    priority: 'medium',
    isActive: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  }
];

export const MOCK_RESOURCES: StudyResource[] = [
  {
    id: 'res_1',
    subjectId: 'sbj_1',
    subjectName: 'Distributed Systems',
    topicId: 'top_1',
    topicTitle: 'Raft Consensus Algorithm',
    title: 'In Search of an Understandable Consensus Algorithm (Raft Paper)',
    author: 'Diego Ongaro and John Ousterhout (Stanford University)',
    url: 'https://raft.github.io/raft.pdf',
    type: 'paper',
    status: 'in_progress',
    rating: 5,
    notes: 'Essential reading on leader election, log replication, and safety guarantees.',
    tags: ['consensus', 'raft', 'systems', 'stanford'],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  },
  {
    id: 'res_2',
    subjectId: 'sbj_1',
    subjectName: 'Distributed Systems',
    topicId: 'top_2',
    topicTitle: 'Vector Clocks & Causality',
    title: 'Designing Data-Intensive Applications (Chapter 5: Replication)',
    author: 'Martin Kleppmann',
    url: 'https://dataintensive.net',
    type: 'book',
    status: 'completed',
    rating: 5,
    notes: 'Foundational chapter explaining multi-leader replication, conflict resolution, and version vectors.',
    tags: ['book', 'storage', 'replication', 'causality'],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  },
  {
    id: 'res_3',
    subjectId: 'sbj_2',
    subjectName: 'Advanced Algorithms',
    topicId: 'top_3',
    topicTitle: 'Topological Sort & DAGs',
    title: 'Introduction to Algorithms (CLRS) — Chapter 22: Elementary Graph Algorithms',
    author: 'Cormen, Leiserson, Rivest, Stein',
    type: 'book',
    status: 'completed',
    rating: 5,
    notes: 'Rigorous proofs for DFS discovery/finish times and cycle detection.',
    tags: ['algorithms', 'clrs', 'graphs', 'theory'],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  },
  {
    id: 'res_4',
    subjectId: 'sbj_3',
    subjectName: 'Compiler Construction',
    topicId: 'top_5',
    topicTitle: 'LLVM IR Generation & Register Allocation',
    title: 'The Architecture of Open Source Applications: LLVM',
    author: 'Chris Lattner',
    url: 'https://aosabook.org/en/llvm.html',
    type: 'documentation',
    status: 'unread',
    rating: 4,
    notes: 'Overview of the LLVM three-phase design and SSA representation.',
    tags: ['llvm', 'compiler', 'architecture', 'ir'],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  }
];

export const MOCK_REFLECTIONS: DailyReflection[] = [
  {
    id: 'ref_1',
    date: yesterdayStr,
    energyScore: 4,
    focusScore: 5,
    wins: [
      'Completed 90m deep study block on Raft leader election proof',
      'Reviewed 14 active recall flashcards with zero errors',
      'Maintained 12-day morning study streak'
    ],
    frictionPoints: [
      'Context switching between problem set and compiler IR docs in late afternoon'
    ],
    tomorrowIntentions: [
      'Implement topological sort DAG Kahn cycle detection',
      'Read Chapter 5 of Designing Data-Intensive Applications'
    ],
    synthesisNotes: 'High clarity day. Early morning 90m block yielded the highest comprehension of consensus invariants.',
    completedHabitsCount: 3,
    completedTasksCount: 4,
    studyMinutesLogged: 135,
    reviewCardsCompleted: 14,
    createdAt: `${yesterdayStr}T21:30:00.000Z`,
    updatedAt: `${yesterdayStr}T21:30:00.000Z`
  },
  {
    id: 'ref_2',
    date: twoDaysAgoStr,
    energyScore: 3,
    focusScore: 4,
    wins: [
      'Resolved compiler lexer edge-case parser bug',
      'Cataloged 3 new research papers into Knowledge Library'
    ],
    frictionPoints: [
      'Started study block 30 minutes late due to meeting overflow'
    ],
    tomorrowIntentions: [
      'Raft consensus invariants proof study session'
    ],
    synthesisNotes: 'Solid recovery in the evening with 45m focused session.',
    completedHabitsCount: 2,
    completedTasksCount: 3,
    studyMinutesLogged: 90,
    reviewCardsCompleted: 10,
    createdAt: `${twoDaysAgoStr}T21:45:00.000Z`,
    updatedAt: `${twoDaysAgoStr}T21:45:00.000Z`
  }
];
