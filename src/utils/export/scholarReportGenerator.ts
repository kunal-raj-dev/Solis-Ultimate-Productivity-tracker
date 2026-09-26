import { SolisIntelligenceReport } from '../intelligence';

export interface ScholarSubjectSummary {
  name: string;
  hours: number;
  sharePercent: number;
}

export interface ScholarReportMetrics {
  scholarName: string;
  periodLabel: string;
  windowStartDate: string;
  windowEndDate: string;
  totalStudyHours: number;
  totalStudyMinutes: number;
  completedFocusSessions: number;
  averageFocusDurationMinutes: number;
  planAdherenceRate: number;
  activeDaysCount: number;
  consistencyStreakDays: number;
  masteredTopicsCount: number;
  totalTopicsCount: number;
  averageMasteryScore: number;
  topSubjects: ScholarSubjectSummary[];
  verificationHash: string;
  generatedAtIso: string;
}

/**
 * Computes a deterministic 32-bit FNV-1a verification signature formatted as `SOLIS-XXXX-XXXX`.
 */
export function computeProofOfStudyHash(payload: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const unsigned = hash >>> 0;
  const hex = unsigned.toString(16).toUpperCase().padStart(8, '0');
  return `SOLIS-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extracts a `ScholarReportMetrics` snapshot from a `SolisIntelligenceReport` and streak telemetry.
 */
export function buildScholarReportMetrics(params: {
  report: SolisIntelligenceReport;
  scholarName?: string;
  periodLabel?: string;
  consistencyStreakDays?: number;
  now?: Date;
}): ScholarReportMetrics {
  const {
    report,
    scholarName = 'Solis Scholar',
    periodLabel = 'Academic Deep-Work Ledger',
    consistencyStreakDays = 0,
    now = new Date()
  } = params;

  const topSubjects: ScholarSubjectSummary[] = report.rhythm.subjectEfforts
    .slice(0, 4)
    .map((alloc) => ({
      name: alloc.subjectName,
      hours: Number(alloc.actualHours.toFixed(1)),
      sharePercent: Math.round(alloc.actualSharePercentage)
    }));

  const totalTopicsCount =
    report.mastery.masteredCount +
    report.mastery.learningCount +
    report.mastery.unstudiedCount;

  const canonicalSignatureString = [
    scholarName.trim(),
    report.window.startDate,
    report.window.endDate,
    report.rhythm.totalStudyMinutes,
    report.attention.completedFocusSessions,
    report.execution.planAdherenceRate,
    report.mastery.masteredCount,
    consistencyStreakDays
  ].join('|');

  const verificationHash = computeProofOfStudyHash(canonicalSignatureString);

  return {
    scholarName: scholarName.trim() || 'Solis Scholar',
    periodLabel: periodLabel.trim() || 'Academic Deep-Work Ledger',
    windowStartDate: report.window.startDate,
    windowEndDate: report.window.endDate,
    totalStudyHours: report.rhythm.totalStudyHours,
    totalStudyMinutes: report.rhythm.totalStudyMinutes,
    completedFocusSessions: report.attention.completedFocusSessions,
    averageFocusDurationMinutes: report.attention.averageFocusDurationMinutes,
    planAdherenceRate: report.execution.planAdherenceRate,
    activeDaysCount: report.rhythm.activeStudyDaysCount,
    consistencyStreakDays,
    masteredTopicsCount: report.mastery.masteredCount,
    totalTopicsCount,
    averageMasteryScore: report.mastery.averageMasteryScore,
    topSubjects,
    verificationHash,
    generatedAtIso: now.toISOString()
  };
}

/**
 * Generates an editorial SVG Proof-of-Study visual artifact card (800x480).
 */
export function generateScholarReportSvg(metrics: ScholarReportMetrics): string {
  const safeName = escapeXml(metrics.scholarName);
  const safePeriod = escapeXml(metrics.periodLabel);
  const safeWindow = escapeXml(`${metrics.windowStartDate} → ${metrics.windowEndDate}`);
  const safeHash = escapeXml(metrics.verificationHash);

  const subjectBarsSvg =
    metrics.topSubjects.length > 0
      ? metrics.topSubjects
          .map((sub, idx) => {
            const y = 315 + idx * 28;
            const barWidth = Math.max(8, Math.round((sub.sharePercent / 100) * 280));
            return `
      <text x="48" y="${y}" fill="#E5E0D8" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="500">${escapeXml(sub.name.slice(0, 28))}</text>
      <rect x="260" y="${y - 11}" width="280" height="10" rx="5" fill="#23262F" />
      <rect x="260" y="${y - 11}" width="${barWidth}" height="10" rx="5" fill="#EB5E28" />
      <text x="556" y="${y}" fill="#A39E93" font-family="Inter, system-ui, sans-serif" font-size="12">${sub.hours}h (${sub.sharePercent}%)</text>`;
          })
          .join('\n')
      : `<text x="48" y="335" fill="#A39E93" font-family="Inter, system-ui, sans-serif" font-size="13">Log study sessions to populate subject distribution.</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="800" height="480">
  <defs>
    <linearGradient id="solisBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141619" />
      <stop offset="100%" stop-color="#1C1F26" />
    </linearGradient>
    <linearGradient id="solisAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#EB5E28" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
  </defs>

  <!-- Card Frame -->
  <rect width="800" height="480" rx="20" fill="url(#solisBg)" stroke="#2E323B" stroke-width="2" />
  <rect x="0" y="0" width="800" height="6" rx="3" fill="url(#solisAccent)" />

  <!-- Editorial Header -->
  <text x="48" y="52" fill="#EB5E28" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="700" letter-spacing="2">SOLIS STUDY OS // PROOF-OF-STUDY ARTIFACT</text>
  <text x="48" y="86" fill="#FAF8F5" font-family="Georgia, serif" font-size="28" font-weight="700">${safeName}</text>
  <text x="48" y="112" fill="#A39E93" font-family="Inter, system-ui, sans-serif" font-size="14">${safePeriod} • ${safeWindow}</text>

  <!-- Verification Stamp -->
  <rect x="565" y="36" width="187" height="36" rx="8" fill="#1F242D" stroke="#363B47" stroke-width="1" />
  <text x="658" y="59" text-anchor="middle" fill="#10B981" font-family="monospace" font-size="12" font-weight="700">${safeHash}</text>

  <!-- Primary 4-Pillar Metric Tiles -->
  <g transform="translate(48, 138)">
    <rect x="0" y="0" width="165" height="104" rx="12" fill="#1B1E24" stroke="#2B2F3A" />
    <text x="18" y="28" fill="#A39E93" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="600">DEEP STUDY VOLUME</text>
    <text x="18" y="68" fill="#FAF8F5" font-family="Georgia, serif" font-size="30" font-weight="700">${metrics.totalStudyHours}h</text>
    <text x="18" y="90" fill="#8C877E" font-family="Inter, system-ui, sans-serif" font-size="11">${metrics.activeDaysCount} active study days</text>

    <rect x="180" y="0" width="165" height="104" rx="12" fill="#1B1E24" stroke="#2B2F3A" />
    <text x="198" y="28" fill="#A39E93" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="600">FOCUS SANCTUARY</text>
    <text x="198" y="68" fill="#FAF8F5" font-family="Georgia, serif" font-size="30" font-weight="700">${metrics.completedFocusSessions}</text>
    <text x="198" y="90" fill="#8C877E" font-family="Inter, system-ui, sans-serif" font-size="11">${metrics.averageFocusDurationMinutes}m avg flow block</text>

    <rect x="360" y="0" width="165" height="104" rx="12" fill="#1B1E24" stroke="#2B2F3A" />
    <text x="378" y="28" fill="#A39E93" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="600">PLANNING REALISM</text>
    <text x="378" y="68" fill="#10B981" font-family="Georgia, serif" font-size="30" font-weight="700">${metrics.planAdherenceRate}%</text>
    <text x="378" y="90" fill="#8C877E" font-family="Inter, system-ui, sans-serif" font-size="11">Scheduled vs executed</text>

    <rect x="540" y="0" width="164" height="104" rx="12" fill="#1B1E24" stroke="#2B2F3A" />
    <text x="558" y="28" fill="#A39E93" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="600">SYLLABUS MASTERY</text>
    <text x="558" y="68" fill="#C084FC" font-family="Georgia, serif" font-size="30" font-weight="700">${metrics.averageMasteryScore}%</text>
    <text x="558" y="90" fill="#8C877E" font-family="Inter, system-ui, sans-serif" font-size="11">${metrics.masteredTopicsCount}/${metrics.totalTopicsCount} topics mastered</text>
  </g>

  <!-- Subject Allocation Section -->
  <text x="48" y="284" fill="#A39E93" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="700" letter-spacing="1.5">SUBJECT ALLOCATION BREAKDOWN</text>
  ${subjectBarsSvg}

  <!-- Footer -->
  <line x1="48" y1="432" x2="752" y2="432" stroke="#2B2F3A" stroke-width="1" />
  <text x="48" y="456" fill="#8C877E" font-family="Inter, system-ui, sans-serif" font-size="11">Deterministic Academic Telemetry • Consistency Streak: ${metrics.consistencyStreakDays}d</text>
  <text x="752" y="456" text-anchor="end" fill="#8C877E" font-family="Inter, system-ui, sans-serif" font-size="11">Verified by Solis Study OS</text>
</svg>`;
}

/**
 * Generates a structured Markdown Semester Reflection & Proof-of-Study report.
 */
export function generateScholarReportMarkdown(metrics: ScholarReportMetrics): string {
  const subjectRows =
    metrics.topSubjects.length > 0
      ? metrics.topSubjects
          .map((s) => `| ${s.name} | ${s.hours} hrs | ${s.sharePercent}% |`)
          .join('\n')
      : '| No subjects logged in window | 0 hrs | 0% |';

  return [
    `# Solis Scholar Report — Proof of Study`,
    ``,
    `- **Scholar**: ${metrics.scholarName}`,
    `- **Academic Period**: ${metrics.periodLabel} (${metrics.windowStartDate} to ${metrics.windowEndDate})`,
    `- **Verification Fingerprint**: \`${metrics.verificationHash}\``,
    `- **Generated At**: ${metrics.generatedAtIso.slice(0, 10)}`,
    ``,
    `## 1. Executive Deep-Work Summary`,
    ``,
    `| Metric | Verified Value |`,
    `| :--- | :--- |`,
    `| **Total Study Volume** | **${metrics.totalStudyHours} hours** (${metrics.totalStudyMinutes} mins across ${metrics.activeDaysCount} active days) |`,
    `| **Completed Focus Sessions** | **${metrics.completedFocusSessions} sessions** (avg ${metrics.averageFocusDurationMinutes} mins/session) |`,
    `| **Planning Realism & Adherence** | **${metrics.planAdherenceRate}%** scheduled-to-actual calibration |`,
    `| **Syllabus Mastery Progression** | **${metrics.averageMasteryScore}%** (${metrics.masteredTopicsCount} of ${metrics.totalTopicsCount} topics mastered) |`,
    `| **Active Consistency Streak** | **${metrics.consistencyStreakDays} days** |`,
    ``,
    `## 2. Subject Effort Distribution`,
    ``,
    `| Subject | Logged Hours | Share of Effort |`,
    `| :--- | :--- | :--- |`,
    subjectRows,
    ``,
    `---`,
    `*Deterministically computed by Solis Study OS • Fingerprint \`${metrics.verificationHash}\`*`
  ].join('\n');
}
