import { Guide, GuideCategory } from '../types/guide';

export const GUIDE_CATEGORIES: { id: GuideCategory; label: string; description: string }[] = [
  { id: 'start', label: 'Start', description: 'Core mental models & first steps' },
  { id: 'plan', label: 'Plan', description: 'Daily arrival, tasks & study architecture' },
  { id: 'focus', label: 'Focus', description: 'Deep flow, session timers & execution' },
  { id: 'learn', label: 'Learn', description: 'Knowledge synthesis, active recall & resources' },
  { id: 'grow', label: 'Consistency', description: 'Habits, Goals, Weekly Review, Cognitive Rhythm' },
  { id: 'customize', label: 'Customize', description: 'Atmospheres, themes & study parameters' }
];

export const SOLIS_GUIDES: Guide[] = [
  /* ==========================================================================
     CATEGORY: START (Core Mental Models & First Steps)
     ========================================================================== */
  {
    id: 'what-is-solis',
    title: 'What is Solis & The Solis Loop',
    category: 'start',
    summary: 'A quiet personal operating system designed for deep study, sustained focus, and continuous momentum.',
    estimatedMinutes: 10,
    relatedGuides: ['first-10-minutes', 'your-first-study-day'],
    whenToUse: 'When you are new to Solis or want to understand how all the environments connect into a coherent daily rhythm.',
    steps: [
      {
        stepNumber: 1,
        title: 'Decide what deserves attention',
        description: 'Use Task Sanctuary and Study Studio to define what you intend to do and what you are learning today.'
      },
      {
        stepNumber: 2,
        title: 'Enter Focus Sanctuary',
        description: 'Execute your work in a distraction-free, soundscape-enabled environment dedicated solely to deep flow.'
      },
      {
        stepNumber: 3,
        title: 'Capture key intellectual synthesis',
        description: 'Record lasting insights and ideas in Knowledge Studio directly following your focus blocks.'
      },
      {
        stepNumber: 4,
        title: 'Recall through spaced repetition',
        description: 'Drill active recall flashcards to guarantee retention and prevent the decay of difficult concepts.'
      },
      {
        stepNumber: 5,
        title: 'Reflect and calibrate your rhythm',
        description: 'Close your day with Evening Closure and run the 5-pillar Weekly Review to notice patterns and adjust.'
      }
    ],
    connection: {
      current: 'The Solis System Architecture',
      explanation: 'Solis is not a disconnected set of tools; every environment feeds into the continuous feedback loop of intentional work.'
    },
    commonMistakes: [
      'Trying to configure every advanced setting before completing a single study session.',
      'Treating Solis like a chaotic to-do list rather than a calm, structured study studio.'
    ],
    tips: [
      'Start with a single subject and a single 25-minute focus session today.'
    ],
    action: {
      label: 'Explore Daily Flow',
      targetPath: '/app/dashboard',
      iconName: 'Compass'
    },
    keywords: ['what is solis', 'overview', 'mental model', 'philosophy', 'loop', 'how does solis work', 'getting started', 'what is the solis loop', 'how do i use solis', 'why use solis'],
    deepContent: {
      relatedConcepts: ['The Solis Loop', 'Cognitive Velocity', 'Spaced Repetition (SM-2)', 'Deep Work']
    }
  },
  {
    id: 'first-10-minutes',
    title: 'Your First 10 Minutes in Solis',
    category: 'start',
    summary: 'A guided walk through the exact three steps required to experience the power of Solis immediately.',
    estimatedMinutes: 5,
    relatedGuides: ['what-is-solis', 'your-first-study-day', 'task-sanctuary'],
    whenToUse: 'Right after creating your account to achieve your first real study win.',
    steps: [
      {
        stepNumber: 1,
        title: 'Add your primary subject',
        description: 'Head to Study Studio and create the topic, course, or field you are currently mastering.',
        why: 'A subject serves as the core container for all your study sessions and tasks. It helps organize your progress over time.',
        action: { label: 'Create Subject', type: 'open-study', targetPath: '/app/study?action=new', iconName: 'BookOpen' },
        completionCheck: 'has-subject'
      },
      {
        stepNumber: 2,
        title: 'Create one focused task',
        description: 'In Task Sanctuary, create the single most important action you need to complete today and link it to your subject.',
        why: 'Explicit tasks give your study sessions a clear outcome. This breaks ambiguity and prevents procrastination.',
        action: { label: 'Create Task', type: 'open-task-creator', targetPath: '/app/tasks?action=new', iconName: 'CheckCircle2' },
        completionCheck: 'has-task'
      },
      {
        stepNumber: 3,
        title: 'Launch a 25-minute Focus session',
        description: 'Select your task in Focus Sanctuary, choose an ambient soundscape, and work uninterrupted until the bell rings.',
        why: 'Focus Sanctuary creates the deep flow state needed to actually complete your work without distraction.',
        action: { label: 'Start Focus', type: 'open-focus', targetPath: '/app/focus', iconName: 'Flame' },
        completionCheck: 'has-focus-session'
      }
    ],
    connection: {
      upstream: 'Account Creation',
      current: 'Initial Activation',
      downstream: 'Daily Flow & Momentum',
      explanation: 'Completing these three steps gives Solis the real foundation needed to begin calculating your cognitive velocity.'
    },
    commonMistakes: [
      'Importing dozens of tasks before establishing a single working subject.'
    ],
    action: {
      label: 'Create Your First Subject',
      targetPath: '/app/study?action=new',
      iconName: 'BookOpen'
    },
    keywords: ['first 10 minutes', 'start', 'quickstart', 'setup', 'new user', 'how to start', 'what do i do first', 'how do i set up my account']
  },
  {
    id: 'your-first-study-day',
    title: 'How to Run an Intentional Study Day',
    category: 'start',
    summary: 'A morning-to-evening protocol for using Solis to eliminate procrastination and study fatigue.',
    estimatedMinutes: 10,
    relatedGuides: ['first-10-minutes', 'daily-flow', 'post-focus-reflection'],
    whenToUse: 'At the start of your workday or study session to establish clarity and structure.',
    steps: [
      {
        stepNumber: 1,
        title: 'Morning Arrival & Daily Intention',
        description: 'Open Daily Flow. Write a single sentence declaring what success looks like today.'
      },
      {
        stepNumber: 2,
        title: 'Time-Block your morning deep work',
        description: 'Schedule two to three 45-minute study blocks before noon.'
      },
      {
        stepNumber: 3,
        title: 'Midday Active Recall Drill',
        description: 'Review pending flashcard items during a low-energy afternoon dip.'
      },
      {
        stepNumber: 4,
        title: 'Evening Closure & Reflection',
        description: 'Open Evening Closure to score your focus, log friction points, and clear your mind before tomorrow.'
      }
    ],
    connection: {
      upstream: 'Task & Study Planning',
      current: 'Daily Execution',
      downstream: 'Cognitive Rhythm Analytics',
      explanation: 'Consistent daily routines generate clean data that powers your weekly review and mastery curves.'
    },
    action: {
      label: 'Set Today\'s Intention',
      targetPath: '/app/dashboard',
      iconName: 'Compass'
    },
    keywords: ['study day', 'routine', 'morning arrival', 'daily protocol', 'how to study', 'how do i plan my day', 'what is a good study routine']
  },

  /* ==========================================================================
     CATEGORY: PLAN (Daily Flow, Tasks & Study Architecture)
     ========================================================================== */
  {
    id: 'daily-flow',
    title: 'Mastering Daily Flow & Time Blocking',
    category: 'plan',
    summary: 'Your daily horizon for synthesizing today\'s study plan, active tasks, and upcoming commitments.',
    estimatedMinutes: 5,
    relatedGuides: ['task-sanctuary', 'focus-sanctuary'],
    whenToUse: 'Every morning and between deep work sessions to check progress and stay on track.',
    steps: [
      {
        stepNumber: 1,
        title: 'Review today\'s study plan',
        description: 'Check planned study blocks and recurring routines scheduled for today.'
      },
      {
        stepNumber: 2,
        title: 'Inspect the Time Block Grid',
        description: 'Switch to the Timeline view to detect scheduling conflicts and verify your daily workload allocation.'
      },
      {
        stepNumber: 3,
        title: 'Launch focus directly from the schedule',
        description: 'Click "Start Session" on any scheduled block to launch Focus Sanctuary pre-configured with that topic.'
      }
    ],
    connection: {
      upstream: 'Study Studio & Task Sanctuary',
      current: 'Daily Flow',
      downstream: 'Focus Sanctuary',
      explanation: 'Daily Flow aggregates commitments from your subjects and tasks into one unified timeline.'
    },
    action: {
      label: 'Open Daily Flow',
      targetPath: '/app/dashboard',
      iconName: 'Compass'
    },
    keywords: ['daily flow', 'dashboard', 'time blocking', 'schedule', 'timeline', 'today', 'momentum', 'how do i time block', 'where is my schedule']
  },
  {
    id: 'task-sanctuary',
    title: 'Task Sanctuary: Decide What Deserves Attention',
    category: 'plan',
    summary: 'An intentional decision surface for managing tasks, subtasks, priorities, and deadlines.',
    estimatedMinutes: 10,
    relatedGuides: ['daily-flow', 'study-studio'],
    whenToUse: 'When you need to organize tasks, break large projects into actionable subtasks, or plan upcoming deliverables.',
    steps: [
      {
        stepNumber: 1,
        title: 'Create tasks with explicit intent',
        description: 'Give tasks clear, outcome-oriented titles (e.g., "Implement Raft Consensus election proofs" instead of "Study").',
        why: 'Vague tasks cause resistance. Clear verbs ensure you know exactly what to do when you sit down.',
        action: { label: 'New Task', type: 'open-task-creator', targetPath: '/app/tasks?action=new', iconName: 'CheckCircle2' },
        completionCheck: 'has-task'
      },
      {
        stepNumber: 2,
        title: 'Link to a Subject',
        description: 'Attach the task to a Study Subject so time spent counts toward your weekly subject target.',
        why: 'Linking connects your daily effort to your long-term study analytics.',
        action: { label: 'View Tasks', type: 'navigate', targetPath: '/app/tasks', iconName: 'Link' }
      },
      {
        stepNumber: 3,
        title: 'Decompose with Subtasks',
        description: 'Break complex tasks into small checkpoints that can each be completed in 15–20 minutes.',
        why: 'Small checkpoints provide dopamine hits and make massive tasks feel achievable.',
        action: { label: 'Manage Tasks', type: 'navigate', targetPath: '/app/tasks', iconName: 'ListChecks' }
      },
      {
        stepNumber: 4,
        title: 'Archive upon completion',
        description: 'Completed tasks are preserved in your archive repository for historical review without cluttering your active view.',
        why: 'Archiving keeps your active workspace clean while retaining your history of achievements.'
      }
    ],
    connection: {
      upstream: 'Goal Horizons & Syllabi',
      current: 'Task Sanctuary',
      downstream: 'Focus Sanctuary & Daily Flow',
      explanation: 'Tasks answer "What do I need to do?", whereas Study Studio answers "What am I learning?".'
    },
    commonMistakes: [
      'Creating hundreds of vague tasks without deadlines or subject associations.',
      'Using tasks as notes or research bookmarks (use Knowledge Studio instead).'
    ],
    action: {
      label: 'Manage Tasks',
      targetPath: '/app/tasks',
      iconName: 'CheckCircle2'
    },
    keywords: ['tasks', 'task sanctuary', 'todo', 'subtasks', 'priority', 'due date', 'how to make a task', 'how do i manage tasks', 'how do i add subtasks']
  },
  {
    id: 'study-studio',
    title: 'Study Studio: Organizing What You Are Learning',
    category: 'plan',
    summary: 'The living syllabus and topic roadmap for your academic courses, certifications, and technical domains.',
    estimatedMinutes: 5,
    relatedGuides: ['task-sanctuary', 'active-recall-flashcards'],
    whenToUse: 'When defining a new subject, mapping syllabus topics, logging study time, or tracking weekly target hours.',
    steps: [
      {
        stepNumber: 1,
        title: 'Create your Subject container',
        description: 'Set a title, subject code, theme accent, and target study hours per week.',
        why: 'Subjects help you track your mastery and total hours dedicated to a specific domain or course.',
        action: { label: 'Create Subject', type: 'open-study', targetPath: '/app/study?action=new', iconName: 'BookOpen' },
        completionCheck: 'has-subject'
      },
      {
        stepNumber: 2,
        title: 'Break syllabus into Study Topics',
        description: 'List canonical topics in order and advance their mastery level from Unstudied → Learning → Mastered.',
        why: 'Mapping out a syllabus allows you to visualize exactly what remains to be learned.',
        action: { label: 'View Topics', type: 'navigate', targetPath: '/app/study', iconName: 'List' }
      },
      {
        stepNumber: 3,
        title: 'Log study sessions or launch Focus',
        description: 'Record time spent on specific topics, notes taken, and your retention score (1–5).',
        why: 'Logging time gives you accurate metrics on your cognitive velocity and retention.',
        action: { label: 'Log Study Time', type: 'open-focus', targetPath: '/app/focus', iconName: 'Clock' }
      }
    ],
    connection: {
      upstream: 'Academic Curricula & Goals',
      current: 'Study Studio',
      downstream: 'Active Recall, Notes & Analytics',
      explanation: 'Subjects provide the canonical structure that all tasks, notes, and focus sessions hook into.'
    },
    action: {
      label: 'Open Study Studio',
      targetPath: '/app/study',
      iconName: 'BookOpen'
    },
    keywords: ['study studio', 'subjects', 'syllabus', 'topics', 'mastery', 'target hours', 'how to make a subject', 'how do i study', 'what is a subject', 'how to add topics'],
    deepContent: {
      advancedTips: [
        'Use color-coded subjects to visually separate major life domains.',
        'Map your entire syllabus on day one to easily track percentage complete over the semester.'
      ]
    }
  },

  /* ==========================================================================
     CATEGORY: FOCUS (Deep Flow, Timers & Execution)
     ========================================================================== */
  {
    id: 'focus-sanctuary',
    title: 'Focus Sanctuary & Deep Flow Execution',
    category: 'focus',
    summary: 'An immersive, distraction-free environment with customizable intervals and procedural soundscapes.',
    estimatedMinutes: 10,
    relatedGuides: ['pomodoro-vs-deep-flow', 'post-focus-reflection'],
    whenToUse: 'Whenever you sit down to execute uninterrupted deep work or intensive study.',
    steps: [
      {
        stepNumber: 1,
        title: 'Select your task or subject',
        description: 'Anchor the session with a specific objective and target output.',
        why: 'Entering a session with a target prevents context switching.',
        action: { label: 'Open Focus', type: 'open-focus', targetPath: '/app/focus', iconName: 'Target' }
      },
      {
        stepNumber: 2,
        title: 'Choose your Mode and Duration',
        description: 'Select classic Pomodoro (25m), Deep Flow (50m–90m), Custom Timer, or Stopwatch.',
        why: 'Different tasks require different levels of endurance. Pomodoro for admin, Deep Flow for hard problems.',
        action: { label: 'Timer Settings', type: 'navigate', targetPath: '/app/settings', iconName: 'Clock' }
      },
      {
        stepNumber: 3,
        title: 'Turn on Ambient Soundscapes',
        description: 'Choose from Rain & Thunder, Deep Forest, White Noise, Ocean Waves, or Quiet Library.',
        why: 'Procedural audio masks background noise and creates a Pavlovian trigger for deep work.',
        action: { label: 'Play Soundscapes', type: 'navigate', targetPath: '/app/focus', iconName: 'Headphones' }
      },
      {
        stepNumber: 4,
        title: 'Complete and Synthesize',
        description: 'When the timer completes, fill out the quick Post-Focus Reflection to lock in what you accomplished.',
        why: 'Capturing insights immediately offloads working memory and solidifies learning.',
        completionCheck: 'has-focus-session'
      }
    ],
    connection: {
      upstream: 'Daily Flow & Task Sanctuary',
      current: 'Focus Sanctuary',
      downstream: 'Post-Focus Reflection & Knowledge Studio',
      explanation: 'Focus Sanctuary is the execution engine of Solis; all planned intentions turn into completed minutes here.'
    },
    tips: [
      'If you navigate away during an active session, the Mini Focus Player will automatically dock in the bottom right so your timer is never lost.'
    ],
    action: {
      label: 'Enter Focus Sanctuary',
      targetPath: '/app/focus',
      iconName: 'Flame'
    },
    keywords: ['focus sanctuary', 'timer', 'pomodoro', 'deep flow', 'soundscapes', 'audio', 'how to start a timer', 'stopwatch', 'how do i focus', 'where is the timer'],
    deepContent: {
      advancedTips: [
        'Experiment with 90-minute blocks for programming or writing, reserving 25-minute Pomodoros for email or rote memorization.',
        'Set your default soundscape to start automatically when the timer begins.'
      ]
    }
  },
  {
    id: 'pomodoro-vs-deep-flow',
    title: 'Pomodoro vs Deep Flow: Choosing Your Interval',
    category: 'focus',
    summary: 'A practical guide on when to use 25-minute Pomodoro bursts versus 90-minute Deep Flow immersion.',
    estimatedMinutes: 5,
    relatedGuides: ['focus-sanctuary', 'post-focus-reflection'],
    whenToUse: 'When deciding how to structure your work sessions based on cognitive load and task complexity.',
    steps: [
      {
        stepNumber: 1,
        title: 'Use Pomodoro (25/5) for high-friction tasks',
        description: 'Ideal for getting started on tedious tasks, problem sets, active recall flashcard drilling, and administrative work.'
      },
      {
        stepNumber: 2,
        title: 'Use Deep Flow (50–90m) for complex architecture',
        description: 'Ideal for software engineering, essay composition, mathematical proofs, and intensive reading.'
      },
      {
        stepNumber: 3,
        title: 'Always honor the recovery break',
        description: 'Step away from screens during the 5–15 minute break to restore cognitive bandwidth.'
      }
    ],
    connection: {
      current: 'Focus Technique Selection',
      explanation: 'Matching interval duration to task complexity prevents burnout and mental fatigue.'
    },
    action: {
      label: 'Start Focus Session',
      targetPath: '/app/focus',
      iconName: 'Flame'
    },
    keywords: ['pomodoro', 'deep flow', 'focus intervals', 'timer length', 'breaks', 'intervals', 'how long should i study', 'what is deep flow']
  },
  {
    id: 'post-focus-reflection',
    title: 'Post-Focus Synthesis & Energy Scoring',
    category: 'focus',
    summary: 'The 30-second ritual for capturing insights and rating mental clarity immediately after a focus block.',
    estimatedMinutes: 5,
    relatedGuides: ['focus-sanctuary', 'cognitive-rhythm'],
    whenToUse: 'Immediately following the completion of any Focus session.',
    steps: [
      {
        stepNumber: 1,
        title: 'Rate your focus and energy (1–5)',
        description: 'Calibrate how easily your mind remained in flow.'
      },
      {
        stepNumber: 2,
        title: 'Log any interruptions',
        description: 'Track internal or external distractions to pinpoint cognitive leakages.'
      },
      {
        stepNumber: 3,
        title: 'Save synthesis notes to Knowledge Studio',
        description: 'Optionally convert your session takeaways into a permanent note with one click.'
      }
    ],
    connection: {
      upstream: 'Focus Sanctuary',
      current: 'Post-Focus Reflection',
      downstream: 'Knowledge Studio & Cognitive Rhythm',
      explanation: 'Post-focus data feeds directly into your Cognitive Rhythm charts and weekly review reports.'
    },
    action: {
      label: 'Open Focus Sanctuary',
      targetPath: '/app/focus',
      iconName: 'Flame'
    },
    keywords: ['post focus', 'reflection', 'energy score', 'synthesis', 'session completion', 'what do i do after studying', 'how to rate energy']
  },

  /* ==========================================================================
     CATEGORY: LEARN (Knowledge Studio, Active Recall & Resources)
     ========================================================================== */
  {
    id: 'knowledge-studio',
    title: 'Knowledge Studio: External Memory & Synthesis',
    category: 'learn',
    summary: 'A distraction-free markdown knowledge base for organizing thoughts, research papers, and study notes.',
    estimatedMinutes: 5,
    relatedGuides: ['active-recall-flashcards', 'study-resources'],
    whenToUse: 'When taking lecture notes, summarizing literature, drafting study guides, or synthesizing complex models.',
    steps: [
      {
        stepNumber: 1,
        title: 'Create notes with clear categories',
        description: 'Organize notes by Concept, Summary, Literature, or Reflection.',
        completionCheck: 'has-note'
      },
      {
        stepNumber: 2,
        title: 'Attach to a Subject and add tags',
        description: 'Linking notes to subjects ensures they appear in that subject\'s study overview.'
      },
      {
        stepNumber: 3,
        title: 'Automatic background saving',
        description: 'Solis auto-saves your writing in real time with resilient client caching.'
      }
    ],
    connection: {
      upstream: 'Focus Sessions & Study Resources',
      current: 'Knowledge Studio',
      downstream: 'Active Recall Flashcards',
      explanation: 'Concepts captured in notes can be converted into active recall cards for long-term memory.'
    },
    action: {
      label: 'Draft a Note',
      targetPath: '/app/notes?action=new',
      iconName: 'FileText'
    },
    keywords: ['notes', 'knowledge studio', 'markdown', 'synthesis', 'how do i write notes', 'external memory', 'where to take notes', 'how to organize notes']
  },
  {
    id: 'active-recall-flashcards',
    title: 'Active Recall & Spaced Repetition',
    category: 'learn',
    summary: 'An intelligent flashcard engine utilizing the SM-2 spaced repetition algorithm for guaranteed long-term retention.',
    estimatedMinutes: 5,
    relatedGuides: ['study-studio', 'knowledge-studio'],
    whenToUse: 'When memorizing key formulas, definitions, anatomical terms, or theoretical proofs.',
    steps: [
      {
        stepNumber: 1,
        title: 'Create cards in Study Studio',
        description: 'Provide a front prompt and a concise back answer. Link the card to a specific topic.'
      },
      {
        stepNumber: 2,
        title: 'Launch the Review Queue',
        description: 'Cards due for review will appear in your daily drill deck.'
      },
      {
        stepNumber: 3,
        title: 'Rate your recall honestly (Again, Hard, Good, Easy)',
        description: 'The SM-2 algorithm calculates the optimal next review interval (e.g. 1 day, 3 days, 10 days, 30 days).'
      }
    ],
    connection: {
      upstream: 'Knowledge Studio & Subjects',
      current: 'Active Recall Engine',
      downstream: 'Retention Forecast & Exam Readiness',
      explanation: 'Review scores feed directly into the Retention Forecast Graph on your Analytics page.'
    },
    action: {
      label: 'Open Flashcard Drill',
      targetPath: '/app/study',
      iconName: 'BookOpen'
    },
    keywords: ['active recall', 'flashcards', 'spaced repetition', 'sm2', 'retention', 'memory', 'how to remember', 'how to make flashcards', 'how do i review']
  },
  {
    id: 'study-resources',
    title: 'Study Resources Library: Papers, Books & Docs',
    category: 'learn',
    summary: 'A curated bibliography for tracking academic papers, textbooks, video lectures, and technical documentation.',
    estimatedMinutes: 5,
    relatedGuides: ['study-studio', 'knowledge-studio'],
    whenToUse: 'When reading academic literature or compiling reading lists for specific subjects.',
    steps: [
      {
        stepNumber: 1,
        title: 'Add resource details and URLs',
        description: 'Catalog papers, PDFs, books, articles, or documentation with author attribution.'
      },
      {
        stepNumber: 2,
        title: 'Track reading state',
        description: 'Advance resources from Unread → In Progress → Completed.'
      },
      {
        stepNumber: 3,
        title: 'Rate quality and attach notes',
        description: 'Score resource value (1–5) and link your synthesis notes.'
      }
    ],
    connection: {
      upstream: 'Academic Literature',
      current: 'Resource Library',
      downstream: 'Study Sessions & Notes',
      explanation: 'Resources link to study topics so you always know what material to reference during focus blocks.'
    },
    action: {
      label: 'View Resources',
      targetPath: '/app/study',
      iconName: 'BookOpen'
    },
    keywords: ['resources', 'library', 'papers', 'books', 'pdf', 'documentation', 'reading list', 'how to add a book', 'where to keep links']
  },

  /* ==========================================================================
     CATEGORY: GROW (Rituals, Horizons & Weekly Calibration)
     ========================================================================== */
  {
    id: 'rituals-and-consistency',
    title: 'Rituals: Long-term Consistency over Streaks',
    category: 'grow',
    summary: 'A daily habit matrix designed for sustainable academic and personal routines without toxic streak anxiety.',
    estimatedMinutes: 5,
    relatedGuides: ['goal-horizons', 'weekly-review'],
    whenToUse: 'To build foundational daily habits like morning reviews, deep work blocks, and physical wellness.',
    steps: [
      {
        stepNumber: 1,
        title: 'Define atomic rituals',
        description: 'Set clear frequency rules: Daily, Weekdays, Weekends, or 3x/week.',
        completionCheck: 'has-habit'
      },
      {
        stepNumber: 2,
        title: 'Check off completions daily',
        description: 'Click any habit on your dashboard or Rituals page to log completion for today.'
      },
      {
        stepNumber: 3,
        title: 'Focus on long-term consistency percentage',
        description: 'If you miss a day, Solis highlights your 30-day consistency rate rather than penalizing you with guilt.'
      }
    ],
    connection: {
      upstream: 'Goal Horizons',
      current: 'Rituals & Consistency',
      downstream: 'Weekly Review',
      explanation: 'Habits bridge long-term goals into daily non-negotiable actions.'
    },
    action: {
      label: 'View Rituals',
      targetPath: '/app/habits',
      iconName: 'Repeat'
    },
    keywords: ['rituals', 'habits', 'streaks', 'consistency', 'daily habits', 'how do i track habits', 'how to build habits', 'what is a ritual']
  },
  {
    id: 'goal-horizons',
    title: 'Goal Horizons & Exam / Project Workspaces',
    category: 'grow',
    summary: 'Multi-horizon trajectories for organizing semester exams, major software projects, and personal milestones.',
    estimatedMinutes: 5,
    relatedGuides: ['rituals-and-consistency', 'task-sanctuary'],
    whenToUse: 'When setting term goals, preparing for high-stakes examinations, or managing multi-stage deliverables.',
    steps: [
      {
        stepNumber: 1,
        title: 'Choose Goal Horizon',
        description: 'Select Short-Term (< 1 month), Medium-Term (1–6 months), Long-Term (1+ year), or Life Vision.',
        completionCheck: 'has-goal'
      },
      {
        stepNumber: 2,
        title: 'Select Experience Type (Standard, Exam, Project)',
        description: 'Exam goals unlock countdowns, target scores, and exam weighting. Project goals unlock repository links and deliverables.'
      },
      {
        stepNumber: 3,
        title: 'Add Milestones',
        description: 'Deconstruct large goals into key checkpoints. Overall progress percentage updates dynamically as milestones complete.'
      }
    ],
    connection: {
      upstream: 'Long-term Aspirations',
      current: 'Goal Horizons',
      downstream: 'Tasks & Habits',
      explanation: 'Goals anchor your daily study sessions to meaningful long-term outcomes.'
    },
    action: {
      label: 'Open Goal Horizons',
      targetPath: '/app/goals',
      iconName: 'Target'
    },
    keywords: ['goals', 'horizons', 'milestones', 'exam prep', 'projects', 'long term', 'how to set goals', 'how do i plan an exam']
  },
  {
    id: 'cognitive-rhythm',
    title: 'Cognitive Rhythm & Velocity Constellation',
    category: 'grow',
    summary: 'Telemetry and intelligent analytics tracking study velocity, time allocation, and retention health.',
    estimatedMinutes: 5,
    relatedGuides: ['weekly-review', 'post-focus-reflection'],
    whenToUse: 'To inspect your historical study patterns, time-of-day peak performance, and cognitive load distribution.',
    steps: [
      {
        stepNumber: 1,
        title: 'Review 7-Day Velocity & Heatmap',
        description: 'Observe which days of the week produce your highest focus yields.'
      },
      {
        stepNumber: 2,
        title: 'Inspect Subject Allocation Breakdown',
        description: 'Verify whether you are spending proportional time on your highest-priority subjects.'
      },
      {
        stepNumber: 3,
        title: 'Monitor Cognitive Load Alerts',
        description: 'Heed recommendations if study hours exceed sustainable limits or if retention drops.'
      }
    ],
    connection: {
      upstream: 'All Study & Focus Sessions',
      current: 'Cognitive Rhythm',
      downstream: 'Weekly Calibration',
      explanation: 'Rhythm metrics translate raw session data into actionable feedback on your study habits.'
    },
    commonMistakes: [
      'Expecting complex graphs immediately upon signup (requires 3–5 days of logged sessions to build meaningful curves).'
    ],
    action: {
      label: 'Inspect Cognitive Rhythm',
      targetPath: '/app/analytics',
      iconName: 'BarChart3'
    },
    keywords: ['cognitive rhythm', 'analytics', 'velocity', 'heatmap', 'why is my momentum empty', 'study stats', 'where do i see my progress', 'how to check stats']
  },
  {
    id: 'weekly-review',
    title: 'Weekly Review: The 5-Pillar Calibration Ritual',
    category: 'grow',
    summary: 'A structured ritual for closing the past week, celebrating wins, identifying friction, and planning next week.',
    estimatedMinutes: 10,
    relatedGuides: ['cognitive-rhythm', 'daily-flow'],
    whenToUse: 'Every Sunday evening or Monday morning before starting a new study cycle.',
    steps: [
      {
        stepNumber: 1,
        title: 'Pillar 1: Look Back & Metrics',
        description: 'Review total study minutes, completed tasks, and streak consistency.'
      },
      {
        stepNumber: 2,
        title: 'Pillar 2: Wins & Accomplishments',
        description: 'Acknowledge academic breakthroughs and completed milestones.'
      },
      {
        stepNumber: 3,
        title: 'Pillar 3: Friction & Root Causes',
        description: 'Identify where procrastination, fatigue, or interruptions slowed you down.'
      },
      {
        stepNumber: 4,
        title: 'Pillar 4: System Adjustments',
        description: 'Decide what habits, schedules, or priorities to modify.'
      },
      {
        stepNumber: 5,
        title: 'Pillar 5: Commitments for Next Week',
        description: 'Set top 3 focal points for the upcoming 7 days.'
      }
    ],
    connection: {
      upstream: 'Past Week\'s Logs',
      current: 'Weekly Review',
      downstream: 'Next Week\'s Daily Flow',
      explanation: 'Weekly Review is where Solis learns from the previous week to keep you from repeating friction patterns.'
    },
    action: {
      label: 'Run Weekly Review',
      targetPath: '/app/review',
      iconName: 'Sparkles'
    },
    keywords: ['weekly review', 'review', '5 pillars', 'weekly calibration', 'how do i plan my week', 'reflection', 'how to review my week', 'what is calibration'],
    deepContent: {
      advancedTips: [
        'Track your common friction points over a month to identify systemic issues rather than one-off bad days.',
        'Schedule your review at the exact same time every Sunday to build the habit.'
      ]
    }
  },

  /* ==========================================================================
     CATEGORY: CUSTOMIZE (Atmospheres, Themes & System Parameters)
     ========================================================================== */
  {
    id: 'atmosphere-and-themes',
    title: 'Atmospheres, Day/Night Themes & Soundscapes',
    category: 'customize',
    summary: 'How to customize visual atmospheres, toggle between Warm Ivory and Deep Charcoal, and tune soundscapes.',
    estimatedMinutes: 5,
    relatedGuides: ['preferences-and-density'],
    whenToUse: 'To optimize the visual and auditory environment for your lighting conditions and focus preferences.',
    steps: [
      {
        stepNumber: 1,
        title: 'Toggle Atmosphere Theme (Cmd+M)',
        description: 'Switch between Warm Ivory (Day) and Deep Charcoal (Night) via the Account Menu, Settings, or hotkey.'
      },
      {
        stepNumber: 2,
        title: 'Choose Focus Gradient Palette',
        description: 'Select from Momentum, Focus, Achievement, or Reflection gradient accents.'
      },
      {
        stepNumber: 3,
        title: 'Adjust Soundscape Volume',
        description: 'Fine-tune ambient audio levels within Focus Sanctuary.'
      }
    ],
    connection: {
      current: 'Visual & Sensory Environment',
      explanation: 'Calm, low-distraction visual design reduces optical fatigue during prolonged study.'
    },
    action: {
      label: 'Open Preferences',
      targetPath: '/app/settings',
      iconName: 'Sliders'
    },
    keywords: ['theme', 'dark mode', 'light mode', 'warm ivory', 'deep charcoal', 'soundscapes', 'atmosphere', 'how to change colors', 'how to turn on dark mode']
  },
  {
    id: 'preferences-and-density',
    title: 'Study Parameters, Density & Data Sovereignty',
    category: 'customize',
    summary: 'Configuring daily targets, interface density, notification permissions, and full JSON workspace backups.',
    estimatedMinutes: 5,
    relatedGuides: ['atmosphere-and-themes'],
    whenToUse: 'When setting personalized daily targets, adjusting UI density, or exporting backups.',
    steps: [
      {
        stepNumber: 1,
        title: 'Set Default Focus & Break Durations',
        description: 'Set your preferred timer lengths in Settings.'
      },
      {
        stepNumber: 2,
        title: 'Adjust Interface Density',
        description: 'Choose Comfortable or Compact mode based on your screen size.'
      },
      {
        stepNumber: 3,
        title: 'Export Workspace Backups',
        description: 'Download complete, verifiable JSON backups or CSV exports with zero data lock-in.'
      }
    ],
    connection: {
      current: 'System Settings',
      explanation: 'Solis guarantees total data sovereignty: your notes, tasks, and sessions can be exported anytime.'
    },
    action: {
      label: 'Open Settings',
      targetPath: '/app/settings',
      iconName: 'Sliders'
    },
    keywords: ['preferences', 'settings', 'density', 'backup', 'export', 'notifications', 'data sovereignty', 'how to export data', 'where to find settings']
  }
];

export function findGuideById(id: string): Guide | undefined {
  return SOLIS_GUIDES.find((g) => g.id === id);
}

export function searchGuides(query: string): Guide[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return SOLIS_GUIDES;

  const fillerWords = new Set(['how', 'do', 'i', 'the', 'a', 'to', 'is', 'my', 'can', 'what', 'why', 'where', 'when']);
  const normalizedQuery = cleanQuery.split(/\s+/).filter(word => !fillerWords.has(word)).join(' ');
  const searchTerms = normalizedQuery ? normalizedQuery.split(/\s+/) : [cleanQuery];

  const scoredGuides = SOLIS_GUIDES.map(guide => {
    let score = 0;
    
    const guideTitle = guide.title.toLowerCase();
    const guideSummary = guide.summary.toLowerCase();
    const guideCategory = guide.category.toLowerCase();
    
    for (const term of searchTerms) {
      if (guideTitle.includes(term)) score += 10;
      if (guide.keywords?.some(k => k.toLowerCase().includes(term))) score += 8;
      if (guideSummary.includes(term)) score += 5;
      if (guideCategory.includes(term)) score += 3;
      if (guide.steps.some(s => s.title.toLowerCase().includes(term) || s.description.toLowerCase().includes(term))) score += 1;
    }

    return { guide, score };
  });

  return scoredGuides
    .filter(g => g.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(g => g.guide);
}
