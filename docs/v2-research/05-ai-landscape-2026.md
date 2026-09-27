# 05 — AI Landscape 2026: What Is Realistically Possible for Solis

**Date:** 2026-09-27
**Scope:** Evidence-based assessment of AI/agent capabilities in 2025–2026, applied to Solis (personal student productivity app). Covers AI study assistants, agentic planning, adaptive scheduling, context-aware recommendations, personalized learning, AI-generated plans/reviews, NL & voice interaction, calendar-aware agents, long-term memory, tool-using agents, human-in-the-loop patterns, costs, latency/reliability.
**Method:** Web research (searches + direct page fetches, September 2026) plus direct code inspection of this repository. Sources are listed at the end; each load-bearing claim is labeled.

---

## 0. How to read this document

Every load-bearing claim carries one of four labels:

| Label | Meaning |
|---|---|
| **VERIFIED FACT** | Checked against a primary/secondary source I loaded during this research, or against repository code I read (path cited). |
| **OBSERVED PATTERN** | A trend seen consistently across multiple sources, but not proven by a controlled study; some sources may conflict. |
| **EXPERT OPINION** | A judgment from a credible named source (e.g., Anthropic's engineering guidance, academic benchmark authors). |
| **RECOMMENDATION** | My own synthesis for Solis. Not a fact. Disagreeable by design. |

Nothing is labeled VERIFIED FACT unless I either fetched the source or read the code in this session.

---

## 1. Evidence base (what I actually did)

- ~15 web searches and 3 direct page fetches (Anthropic's *Building Effective Agents*, Google's Gemini API pricing page, search-derived OpenAI/Anthropic pricing pages), September 2026.
- Direct inspection of Solis source: `src/services/ai/ai.service.ts`, `src/utils/ai/guardrails.ts`, `src/utils/ai/telemetry.ts`.
- Not done (stated honestly): I could not run latency benchmarks myself, could not obtain independent RCTs for specific commercial study apps beyond the one cited, and could not find a primary engineering post confirming Todoist's parser is rule-based (inferred from documented grammar-based behavior — labeled accordingly).

---

## 2. Baseline: Solis V1 as the evaluation target

**VERIFIED FACT (material provided by the ask, from prior direct code inspection of this repository):**
React 18 + TypeScript + Vite SPA; Supabase (Postgres, auth, realtime) behind an `IDataService` abstraction with a mock offline service. Feature surface: dashboard cockpit, tasks (list/schedule/week/matrix, NLP capture, recurrence, replan), study (subjects, syllabus topic trees, FSRS/SM-2 flashcards, Anki import/export, adaptive suggester, subject health), focus room (Web-Audio soundscapes, tab defense, reflection auto-logging), realtime study rooms, notes (wiki-links, backlinks, knowledge graph, version history, AI flashcard/quiz generation, grounded "Ask Solis" Q&A), habits (streaks, heatmaps, auto-toggle), goals (milestones, exam feasibility, generated study plans), analytics (deterministic intelligence engine: retention decay, mastery, subject health, circadian synthesis, explainable recommendations), weekly review ritual, settings (AI key management, backups, iCal). Cross-domain wiring already exists (focus→study auto-log, ritual toggles, review→next-week seeding, habit auto-toggle, retention alerts, exam feasibility drift warnings). AI is Gemini via a user-supplied, session-scoped key, used only for Ask Solis, Scholar Report, and weekly narrative; everything else is deterministic.

**VERIFIED FACT (my inspection this session):**
- `src/services/ai/ai.service.ts:37` — `DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'` (Flash-class default; `:235-242` shows localStorage model override + env fallback).
- `src/services/ai/ai.service.ts:221-225` — the API key lives in `sessionStorage` (`solis_gemini_api_key`), explicitly as a secrets-hygiene choice ("plan §1.6").
- `src/services/ai/ai.service.ts:621` — Ask Solis output passes a faithfulness check; ungrounded claims are logged as potential hallucinations. `src/utils/ai/guardrails.ts` sanitizes input before the model; `src/utils/ai/telemetry.ts` records usage. Card generation can route through a Supabase edge function (`GENERATE_CARDS_EDGE_FUNCTION`, line 40) rather than the client key.

This baseline matters for everything below: Solis already has (a) the structured user data AI features would need, (b) a working grounding/faithfulness pipeline, (c) BYOK privacy architecture, and (d) a deterministic intelligence engine that AI should not compete with but decorate.

---

## 3. The 2025–2026 landscape, area by area

### 3.1 AI study assistants and tutoring

- **VERIFIED FACT:** Student AI adoption is near-universal. The HEPI/Kortext 2025 UK survey found 92% of full-time undergraduates using generative AI in some form (up from 66% in 2024) and 88% using it for assessments; a December 2025 HEPI follow-up put it at 95%. The Digital Education Council survey across 29 institutions found 92% of students actively using AI. Dominant uses: explaining concepts and summarizing material.
- **VERIFIED FACT:** The strongest independent effectiveness evidence is the Harvard "PS2 Pal" RCT (Kestin & Miller, ~2024–2025): 194 undergraduates in introductory physics, crossover design; the constrained AI tutor produced roughly **double the learning gains** of in-class active learning, in less time, with higher reported engagement. Crucially, the tutor was deliberately engineered with pedagogical constraints (Socratic prompting, feedback, no answer-giving).
- **OBSERVED PATTERN:** Commercial study-assistant effectiveness claims are mostly vendor marketing (e.g., StudyFetch's "92% of students report improved grades" is self-reported; Trustpilot 4.2/5 with noted bugs on messy inputs; Khanmigo remains the Socratic benchmark but publishes no independent RCT). Independent trials are rare; the Harvard study is the exception, not the rule.
- **EXPERT OPINION (implied by the Harvard study design):** Constrained, pedagogy-shaped AI beats unconstrained chat. Unconstrained ChatGPT is already free and ubiquitous; a product's AI value must come from its data advantage, not from being another chat box.
- **Implication for Solis (RECOMMENDATION):** AI that operates on *the user's own* notes, plans, and performance data (grounded Q&A, flashcard generation from their material) is defensible. Generic chat tutoring is not.

### 3.2 Agentic planning and autonomous task planning

- **VERIFIED FACT:** Gartner (Aug 2025) predicts 40% of enterprise apps will feature task-specific AI agents by end of 2026, up from <5% in 2025; Gartner also predicted (June 2025) that **over 40% of agentic AI projects will be canceled by end of 2027**, citing unclear value, escalating costs, and inadequate risk controls. A 2026 Hype Cycle for Agentic AI exists specifically to cut through "agent washing."
- **VERIFIED FACT:** The leading academic benchmark line (PlanBench, Valmeekam et al., NeurIPS 2022; "LLMs Still Can't Plan; Can LRMs?" 2024) shows LLMs rely on pattern matching, not genuine planning: OpenAI's o1 saturates familiar Blocksworld but degrades on ≥20-step and out-of-distribution plan generation/verification.
- **EXPERT OPINION (Anthropic, *Building Effective Agents* — fetched):** Agents are "LLMs using tools based on environmental feedback in a loop," with "higher costs and the potential for compounding errors"; most applications should use the simplest thing that works — "optimizing single LLM calls with retrieval and in-context examples is usually enough."
- **Implication (RECOMMENDATION):** For a solo student app, "agentic planning" as marketed (an autonomous agent that reshuffles your life) is the least mature, highest-failure-risk pattern in the landscape. Long-horizon plan *generation* by LLMs is demonstrably unreliable; short-horizon plan *drafting* with human confirmation is fine.

### 3.3 Adaptive scheduling

- **VERIFIED FACT:** FSRS (Free Spaced Repetition Scheduler) is natively built into Anki; the official Anki FAQ states users need fewer reviews than SM-2 for the same retention. (MintDeck's "outperforms SM-2 in 99% of cases" is a vendor claim, not independently verified.)
- **OBSERVED PATTERN:** AI scheduling tools are commercially viable but the leading product's most-cited weakness is *autonomy without control*: Motion (~$19/seat/mo) is praised for auto-time-blocking yet criticized in multiple reviews for opaque autonomous rescheduling and weak manual override; Reclaim.ai wins praise as a lighter, more conservative "calendar defense" with a free tier. Users gravitate to the tool that respects their control.
- **Implication (RECOMMENDATION):** Solis's FSRS + deterministic replanner is already the right architecture. LLMs should never compute schedule feasibility; they may at most *draft* a plan the user edits, with a deterministic checker validating it.

### 3.4 Context-aware recommendations and proactive AI

- **VERIFIED FACT:** Active research in 2025–2026 treats proactive AI as a trade-off, not a win: "Assistance or Disruption?" (arXiv, Feb 2025, Pu et al.) studies when automated help should interject vs. harms focus; the SSRN "IPPO" analysis flags autonomous scheduling agents (auto-declining, rescheduling) as a control problem.
- **OBSERVED PATTERN:** The core unresolved question in proactive AI is *timing* — a focus app whose AI interrupts you is self-defeating.
- **Implication (RECOMMENDATION):** Solis V1's proactive layer is deterministic and explainable (retention alerts, drift warnings). That is the correct pattern. AI-generated proactive advice should not exist in v2; at most, deterministic triggers can offer an *optional* AI action the user invokes.

### 3.5 Personalized learning

- **VERIFIED FACT:** The Harvard RCT (3.1) demonstrates real personalization gains *when* the system has pedagogical structure and user-specific interaction.
- **OBSERVED PATTERN:** Most "personalized" AI outputs remain generic: education research on LLM-generated plans and feedback repeatedly finds hallucinated content, one-size-fits-all advice, and prompt-dependence (SAGE Journals hallucination review; NIH/PMC hallucination analysis; ESL writing studies finding AI feedback approaching teacher quality but weaker on personalization).
- **Implication (RECOMMENDATION):** Solis's real personalization is its data: FSRS memory parameters, mastery scores, circadian synthesis, habit streaks. AI should re-express that data in language, not invent personalization.

### 3.6 AI-generated study plans and reviews

- **OBSERVED PATTERN:** Evidence for AI-generated study plans is thin and mixed; the recurring findings are (a) useful as scaffolds/drafts, (b) hallucination and generic-filler risk, (c) strong dependence on input quality, (d) consensus that human verification is required.
- **EXPERT OPINION (Anthropic):** Prompt chaining with programmatic gates is the right workflow for tasks that decompose into fixed subtasks — exactly a "syllabus → topics → plan" pipeline.
- **Implication (RECOMMENDATION):** AI plans must be: schema-constrained (JSON), generated from the user's actual syllabus/goals data, validated by a deterministic feasibility check (Solis already has exam feasibility math), and confirmed by the user before touching state. Narrative reviews should only narrate numbers the deterministic engine computed.

### 3.7 Natural-language and voice interaction

- **VERIFIED FACT:** Speech-to-text is cheap and good: OpenAI Whisper API ≈ $0.006/min (gpt-4o-mini-transcribe ≈ $0.003/min; Groq-hosted Whisper ≈ $0.04–0.11/hr). Menlo Ventures' *2025 State of Consumer AI* reports voice AI "taking off" as speech recognition reaches near-perfect accuracy.
- **VERIFIED FACT:** Adoption has a social barrier: PYMNTS ("Nobody's Talking," 2025) reports usability concerns and discomfort speaking to machines in public are slowing voice adoption; eMarketer finds Gen Z leads daily voice-AI engagement but over one-third of US consumers overall.
- **OBSERVED PATTERN (with stated uncertainty):** No primary source confirms Todoist's Quick Add parser is rule-based, but its documented grammar-based behavior (dates, `#projects`, `@labels`, `p1` priorities, recurrence syntax, offline-fast parsing) is consistent with a deterministic parser, and the team iterates on rules rather than swapping in an LLM. Task capture in mainstream apps is overwhelmingly instant and offline-capable.
- **Implication (RECOMMENDATION):** Solis's NLP capture should stay deterministic-first (instant, offline, free) with an LLM fallback only for inputs the parser fails on. Voice dictation is a cheap optional add; a voice *conversational* interface is not justified.

### 3.8 Calendar-aware agents

- **VERIFIED FACT:** Motion and Reclaim.ai are the market leaders; the observed pattern (3.3) is that autonomy/opacity is the dominant complaint. No evidence found that LLM-driven calendar agents outperform constraint-based auto-scheduling; Motion's engine is algorithmic with AI features on top.
- **Implication (RECOMMENDATION):** Calendar awareness in Solis = iCal integration + deterministic time-blocking (already present). An "AI agent that reads your Google Calendar and reschedules tasks" adds API surface, OAuth risk, and the control problem for little gain.

### 3.9 Long-term user memory

- **VERIFIED FACT:** A mature tooling layer now exists (Mem0 — $24M raise late 2025, self-reported LoCoMo 91.6%/LongMemEval 94.8% and claims of beating OpenAI's memory by 26%; Zep/Graphiti; Letta; OpenAI's opaque ChatGPT memory). Vendor benchmarks are disputed and non-comparable.
- **VERIFIED FACT (research signal):** An August 2026 arXiv benchmarking paper ("Total Recall at What Cost?") and related analyses find plain RAG baselines can match top memory systems at roughly **8× lower total cost of ownership**; "Trojan Hippo" (arXiv, May 2026) demonstrates memory-poisoning attacks on agent memory layers.
- **Implication (RECOMMENDATION):** For a *single-user* app whose Postgres database already stores every task, note, session, grade, and streak, a learned memory layer is redundant: retrieval over structured data IS the memory, with full user control. Adding Mem0-style extraction would add cost, latency, a contamination risk, and an attack surface for zero new capability.

### 3.10 Tool-using agents

- **VERIFIED FACT:** MCP (Model Context Protocol) became the de facto agent-tool standard: OpenAI, Google DeepMind, and Microsoft adopted it through 2025; an NSA/CISA Cybersecurity Information Sheet (June 2026) calls it the de facto standard and publishes security guidance; the 2026-07-28 spec moves toward stateless, cacheable, routable agent infrastructure.
- **OBSERVED PATTERN:** MCP's value is proven in multi-tool *developer/automation* contexts; consumer productivity apps mostly still expose plain, purpose-built integrations.
- **Implication (RECOMMENDATION):** Solis has no user problem that requires an autonomous tool loop. Expose *data to* other tools (backups, iCal, Anki export — already present) rather than building agent infrastructure.

### 3.11 Human-in-the-loop patterns

- **EXPERT OPINION (Anthropic, *Building Effective Agents* — fetched):** Use workflows (predefined code paths) over autonomous agents; pause for human feedback at checkpoints and blockers; maintain transparency by showing planning steps; invest in the agent-computer interface ("we actually spent more time optimizing our tools than the overall prompt" — on SWE-bench); make mistakes structurally hard (poka-yoke tools).
- **OBSERVED PATTERN:** 2025–2026 practitioner guidance converges on approval gates before irreversible actions, risk-tiered oversight (human-in-the-loop vs. on-the-loop), and audit trails.
- **Implication (RECOMMENDATION):** Solis's natural shape — "AI proposes a draft/diff, user confirms, state changes only on confirm" — is precisely the industry-validated pattern. Formalize it as an architectural invariant: **no AI output ever writes user state silently.** V1 already does this for flashcards/plans (verified in the ask's feature description: generation is preview-and-edit based).

### 3.12 Costs (order-of-magnitude API pricing)

**VERIFIED FACT (Google Gemini pricing page fetched 2026-09-27; page last updated 2026-09-24):**

| Model | Input /M tok | Output /M tok | Notes |
|---|---|---|---|
| Gemini 2.5 Pro | $1.25 (≤200k) / $2.50 (>200k) | $10.00 / $15.00 | caching $0.125–0.25 |
| Gemini 2.5 Flash | $0.30 (text), $1.00 (audio) | $2.50 | Batch/Flex half price |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | Batch/Flex $0.05/$0.20 |
| Gemini Live audio (2.5 Flash Native Audio) | $3.00 (audio in) | $12.00 (audio out) | ≈$0.005/min in, ~$0.018/min out |
| Free tier | $0 | $0 | **Free-tier usage may be used to improve Google's products; paid-tier data is not** (verbatim policy note on the pricing page) |

**VERIFIED FACT (OpenAI/Anthropic pricing pages via search):** GPT-5 $1.25/$10, GPT-5 mini $0.25/$2, nano $0.05/$0.40 (400K context, 50% batch discount); Claude Sonnet $3/$15, Claude Haiku 4.5 $1/$5; Whisper $0.006/min.

**RECOMMENDATION-RELEVANT COMPUTATION (my arithmetic on the verified prices above, not a source claim):** A "heavy" Solis AI user (6 Ask-Solis queries/day with ~15k-token grounded context + ~700-token answers; 1 flashcard generation/day from ~25k tokens of notes; 1 weekly narrative) consumes ≈ 3.5M input + 175k output tokens/month:
- **Flash-class:** ≈ **$1.20–1.50 per heavy user per month**; typical user (1–2 AI touches/day) ≈ **$0.30–0.60/month**; Flash-Lite cuts this ~4×.
- **Pro-class everywhere:** ≈ **$5–6 per heavy user per month** — viable only with BYOK or aggressive caching/batching.
- **Voice dictation:** 20 min/month ≈ $0.12 (Whisper rates). **Live voice conversation:** an hour of daily use ≈ $2–4/month audio tokens — real money for a student app.
- **Grounding with Google Search:** $35 per 1,000 grounded queries after 1,500/day free — noticeable if AI search-grounding becomes a feature.

**OBSERVED PATTERN:** Frontier model prices keep falling (GPT-5's launch pricing was called aggressive enough to "spark a price war" — TechCrunch, Aug 2025), but *agentic* usage multiplies token consumption, so per-task cost is governed by architecture, not model choice.

### 3.13 Latency and reliability expectations

- **OBSERVED PATTERN (sources conflict; treated as ranges):** Public leaderboards (Artificial Analysis measures time-to-first-token; BenchLM tracks output tok/s) show fast non-reasoning Flash-class models at roughly sub-second to ~2s TTFT, while high-reasoning modes can take 10s+ to first token (Artificial Analysis reported 13.56s for a Gemini Flash "high" reasoning configuration vs. ~0.42s for a non-reasoning Flash config on BenchLM). Interactive UX must assume 1–3s and stream; batch/async is right for weekly jobs.
- **VERIFIED FACT:** Best-in-class LLMs score ≈ **1.8% hallucination rate on the Vectara summarization benchmark** (leaderboard last updated Dec 2025, per secondary coverage) — and that benchmark measures *grounded summarization only*, not open-ended generation or multi-step tasks.
- **EXPERT OPINION (Anthropic):** Agent loops compound errors; guardrails and stopping conditions are mandatory.
- **Implication (RECOMMENDATION):** Design targets: interactive features stream and tolerate ~2s; nothing blocks the core non-AI workflow on AI availability; AI failure = feature gracefully absent (V1 already works fully without a key — keep that property as a hard invariant).

### 3.14 Privacy and compliance

- **VERIFIED FACT:** Solis's BYOK + `sessionStorage` key design (code: `ai.service.ts:221-225`) means the operator holds no API keys and no AI-provider relationship; Google's free tier trains on submitted data while paid tier does not (pricing page, 3.12). FERPA/COPPA compliance is a recognized hurdle for school-facing AI (US Dept. of Ed studentprivacy.ed.gov hub; multiple 2025 compliance guides), though BYOK consumer apps sidestep most of it by keeping the data relationship user→provider.
- **Implication (RECOMMENDATION):** Keep BYOK. Never transmit data the feature doesn't need (grounded Q&A should send retrieved chunks, not whole notebooks — already the design). Document the data flow per feature; avoid free-tier-key defaults where user notes are involved, or make the tradeoff explicit in Settings.

---

## 4. Candidate-by-candidate evaluation for Solis

Scores: ● strong / ◐ adequate / ○ weak or negative. "Det. wins?" = does deterministic software already solve it better?

| # | Candidate capability | User problem | Maturity 2026 | Usefulness | Reliability if wrong | Data needs | Cost/user/mo | Privacy | Failure modes | Det. wins? | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A | **Grounded note Q&A (Ask Solis)** — deepen | "Where did I write X / what does my note mean?" | ● RAG is mature; grounded summarization ≈1.8% halluc best-case | ● unique over ChatGPT: grounded in *user's* notes with citations | ◐ wrong answer cites source → user can check; guardrails already present | ● notes exist in Postgres | ◐ ~$0.5–1.5 (Flash) | ◐ sends note chunks only | generic answer, missed retrieval; mitigated by citations | ◐ keyword search can't answer synthesis questions | **KEEP & DEEPEN** — core AI anchor |
| B | **AI flashcard/quiz generation** | manual card-writing is tedious | ● proven pattern (StudyFetch et al.) | ● high tedium elimination | ◐ worst case = bad card, user edits/deletes | ● user's own notes | ◐ ~$0.3 | ◐ | low-quality/fabricated cards | ○ FSRS schedules but can't author | **KEEP** — user-triggered, preview-edit |
| C | **Syllabus/document → structured topics & exam dates** | tedious manual syllabus entry | ◐ document understanding mature for clean PDFs; messy scans weak (StudyFetch reviews) | ● kills hours of setup; feeds existing topic trees | ◐ wrong date/topic = user fixes in review step | ◐ needs the syllabus file (user-provided) | ◐ one-off ~$0.05–0.2/semester | ◐ | hallucinated dates/deadlines — the dangerous one | ○ nothing deterministic can parse free-text syllabi | **BUILD (new)** — schema-validated, user-confirms every field |
| D | **AI-drafted study plan / exam feasibility draft** | "how do I split 12 weeks into topics?" | ◐ plan *drafting* OK; long-horizon *planning* weak (PlanBench) | ◐ good draft accelerator | ● must be validated: deterministic feasibility check stays source of truth | ● subjects, dates, mastery already in DB | ◐ ~$0.1–0.3/draft | ● uses internal data only, no docs needed | confident-but-infeasible plans; mitigated by validator | ◐ feasibility math det.; plan *sequencing* benefits from LLM | **BUILD** — draft + confirm + validate |
| E | **Weekly narrative / Scholar Report** | "what did this week mean?" | ● trivially mature | ◐ motivating framing; low decision weight | ● narrates only computed numbers → can't be factually wrong about the user | ● analytics engine output | ○ ~$0.05 | ● | purple prose; number-free filler if ungrounded | ◐ numbers are det.; narrative isn't | **KEEP** — numbers-in-prompt pattern, optional |
| F | **NLP quick capture (LLM)** | fast task entry | ● but deterministic parsers are the norm | ◐ | ● wrong date on a task is costly and invisible | ○ | ○ per-capture latency+cost | ● | misparsed dates; needs network; slow | ● chrono-style parsing wins offline/instant/free | **DETERMINISTIC-FIRST, LLM fallback only** |
| G | **Voice dictation for capture** | hands-free entry | ● STT near-perfect, $0.006/min | ◐ nice-to-have; public-use discomfort (PYMNTS) | ◐ mis-transcription visible pre-save | ○ | ○ ~$0.1/mo | ◐ audio leaves device if cloud STT | transcription errors | ● Web Speech API free on-device first | **OPTIONAL experiment** — not core |
| H | **Autonomous daily replanning (agentic)** | "fix my schedule for me" | ○ LLMs can't plan reliably (PlanBench); agent loops compound errors | ○ | ●● silent bad reschedules destroy trust — the exact Motion complaint | ● | ●● per-run agentic cost | ● | opaque, compounding, uncontrollable | ● deterministic replanner already exists and is explainable | **AVOID autonomous; optional AI *suggestion* only** |
| I | **Proactive AI-generated nudges/advice** | "coach me" | ◐ tech feasible; timing/annoyance unsolved (Assistance or Disruption?) | ○ risk of becoming the distraction the app fights | ●● bad proactive advice erodes everything | ● | ◐ | ● | interruption, generic advice | ● V1's deterministic explainable alerts already solve it | **AVOID** — keep deterministic alerts |
| J | **LLM long-term memory layer (Mem0/Zep)** | "remember me across sessions" | ● tooling mature | ○ DB already is the memory | ◐ contamination/stale facts; poisoning attacks (Trojan Hippo) | ● | ● 8× TCO vs RAG (arXiv finding) | ●● another vendor sees user data | memory poisoning, stale recall | ● Postgres + retrieval wins outright | **AVOID** |
| K | **Live voice tutor / conversational companion** | "talk while studying" | ◐ works (Live API) but not the product | ○ off-mission; Harvard evidence is for *constrained* tutors, not companions | ●● cost+latency+public discomfort; quality claims vendor-only | ● | ● ~$2–4/mo audio tokens | ●● continuous audio | scope creep into generic chatbot | ● | **AVOID** |
| L | **Autonomous calendar agent / MCP tool-use loop** | "manage my calendar" | ● infra exists (MCP) but consumer need unproven for Solis | ○ iCal integration + deterministic blocking already covers it | ●● auto-decline/reschedule = control problem (IPPO) | ◐ OAuth scopes | ◐ | ●● broad OAuth scope risk | wrong destructive calendar actions | ● | **AVOID for v2** |
| M | **LLM estimating effort/feasibility replacing FSRS/mastery math** | smarter estimates | ○ | ○ | ●● opaque single-source-of-truth corruption | ● | ◐ | ● | unexplainable drift in core metrics | ● FSRS/math are validated, explainable, free | **AVOID** — AI never replaces the intelligence engine |

**Cross-cutting design conclusions (RECOMMENDATION):**
1. **The invariant:** AI proposes → user disposes. No silent state writes, ever (validated pattern per 3.11; already Solis's shape).
2. **The moat:** Solis's AI value comes from its data (notes, FSRS, mastery, plans), not from model quality. Every AI feature should answer "what does ChatGPT not know that Solis does?"
3. **The cost envelope:** Flash-class models keep all worthwhile features under ~$1.50/heavy-user/month (~$0.30–0.60 typical); BYOK keeps it $0 for the operator. Default to Flash-Lite for high-frequency, low-stakes calls.
4. **The failure posture:** AI is an enhancement layer over a fully functional deterministic app; key absent/network down ⇒ nothing breaks. This remains a differentiator; preserve it as an architectural test.
5. **Latency:** interactive features stream with ~2s TTFT budget; heavy jobs (syllabus parse, weekly narrative) run async with progress states.

---

## 5. The two lists

### AI GENUINELY WORTH BUILDING for Solis

1. **Grounded "Ask Solis" Q&A over the user's own notes** (deepen: better retrieval, forced citations, faithfulness gating — pipeline already partly exists in `ai.service.ts:621` + `guardrails.ts`). *Reason: it answers questions keyword search cannot, grounded in data ChatGPT doesn't have, with checkable sources.*
2. **AI flashcard/quiz generation from the user's notes** (keep; user-triggered, preview-and-edit before save). *Reason: highest tedium-to-value ratio, worst case is a bad card the user deletes, proven category.*
3. **Syllabus/document parsing → structured topic tree + exam dates** (new). *Reason: removes the single most tedious setup step; feeds the existing syllabus engine; every extracted field is user-confirmed before saving; deterministic software cannot do this at all.*
4. **AI-drafted study plans (exam → weekly plan) as a schema-constrained draft** over the user's real subjects, mastery, and dates, validated by the existing deterministic feasibility math, confirmed by the user. *Reason: LLMs draft sequences well and plan invariants badly — so the LLM drafts, the deterministic checker disposes.*
5. **Weekly review / Scholar narrative that only narrates numbers the deterministic engine computed** (keep; reposition as cheap, optional polish on the analytics engine). *Reason: zero factual risk (numbers-in-prompt), high motivation value, ~$0.05/user/month.*
6. **Voice dictation into capture fields** (optional, small). *Reason: near-free STT, on-device Web Speech API first, worst case is visible-before-save mis-transcription. Deliberately not a conversational voice assistant.*

### AI TO AVOID (with the reason)

1. **Autonomous agentic replanning / "AI reschedules your life."** LLMs demonstrably cannot do reliable long-horizon planning (PlanBench); agent loops compound errors (Anthropic); the market leader's biggest complaint is exactly this opacity (Motion reviews). The deterministic replanner already solves it, explainably.
2. **Proactive AI-generated nudges and advice.** In a focus product, an interrupting AI is self-defeating (2025 proactive-AI research: "Assistance or Disruption?"); V1's deterministic, explainable alerts already cover the need without hallucination risk.
3. **An LLM long-term-memory layer (Mem0/Zep-style).** The Postgres database *is* the user's memory; retrieval matches dedicated memory systems at ~8× lower cost (arXiv 2026) and avoids memory-poisoning attack surfaces and a second data-sharing relationship.
4. **Live voice tutor / AI companion.** Wrong product, real recurring audio costs (~$2–4/user/month), public-use discomfort is a documented adoption barrier, and the only strong tutoring evidence (Harvard RCT) applies to tightly constrained tutors, not open companions.
5. **Autonomous calendar/calendar-OAuth agent (and MCP tool loops generally).** No Solis user problem is blocked on tool autonomy; iCal + deterministic time-blocking already deliver the value; auto-decline/reschedule autonomy is the documented control failure mode; OAuth scope is pure added risk.
6. **Letting the LLM replace the deterministic intelligence engine (FSRS scheduling, mastery/health/feasibility math).** Those components are validated, explainable, free, and offline — the LLM's job is language and drafting around them, never the numbers themselves.
7. **LLM-per-capture task parsing.** Instant, offline, free deterministic parsing is the industry norm; a network round-trip on every task entry adds latency, cost, and misparse risk for marginal gain — use the LLM only as a fallback the user invokes.

---

## 6. Sources

URLs actually loaded or used during this research (September 2026):

**Fetched directly:**
- Anthropic — *Building Effective Agents*: https://www.anthropic.com/engineering/building-effective-agents
- Google — Gemini Developer API pricing (page last updated 2026-09-24): https://ai.google.dev/gemini-api/docs/pricing

**Search-consulted (claims taken from these results):**
- OpenAI API pricing: https://developers.openai.com/api/docs/pricing · TechCrunch on GPT-5 pricing: https://techcrunch.com/2025/08/08/openai-priced-gpt-5-so-low-it-may-spark-a-price-war · Simon Willison: https://simonwillison.net/2025/Aug/7/gpt-5
- Anthropic Claude pricing (Sonnet $3/$15, Haiku 4.5 $1/$5, Opus $5/$25): anthropic.com / platform.claude.com pricing pages via search
- Speech-to-text costs (Whisper $0.006/min, Groq Whisper $0.04–0.11/hr): https://kenodo.com (cost calculator); Gemini Live/audio rates from the fetched Google pricing page
- Gartner agentic predictions & 2026 Hype Cycle: https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025 · https://www.gartner.com/en/articles/hype-cycle-for-agentic-ai
- PlanBench / "LLMs Still Can't Plan": https://neurips.cc (PlanBench paper); Valmeekam et al. 2024 evaluation of o1 (via search: arxiv.org, emergentmind summary)
- Harvard PS2 Pal AI-tutor RCT (Kestin & Miller): Scientific American coverage + mindomax.com write-up (194-student RCT, ~2× learning gains)
- StudyFetch: https://www.studyfetch.com (self-reported claims, flagged as marketing)
- Motion/Reclaim reviews: https://efficient.app · https://runable.com · saner.ai/ellieplanner/unite.ai comparative reviews via search
- Student AI adoption: HEPI/Kortext 2025 (92%/88%; Dec 2025 95%) via https://ioaglobal.org and HEPI coverage; Digital Education Council survey (92% of students, 29 institutions) via nemo.asee.org citation
- Memory systems: Mem0 benchmarks & criticism, Zep/Graphiti, RAG-vs-memory TCO finding (~8×), "Total Recall at What Cost?" (arXiv Aug 2026), "Trojan Hippo" (arXiv May 2026) via search summaries
- Vectara hallucination leaderboard (~1.8% best, Dec 2025 update) via https://clarion.ai and brinsa.com coverage
- MCP adoption & security: NSA/CISA sheet https://media.defense.gov/2026/Jun/02/2003943289/-1/-1/0/CSI_MCP_SECURITY.PDF · https://blog.modelcontextprotocol.io/posts/2026-07-28 · https://zuplo.com/mcp-report
- FSRS: Anki FAQ https://faqs.ankiweb.net/what-spaced-repetition-algorithm · https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm · MintDeck (vendor claim) https://www.mintdeck.app/blog/fsrs-spaced-repetition-algorithm
- Proactive AI: "Assistance or Disruption?" (arXiv, 2025) via alphaxiv; IPPO model analysis via SSRN search result
- Voice adoption: Menlo Ventures https://menlovc.com/perspective/2025-the-state-of-consumer-ai · PYMNTS https://www.pymnts.com/news/artificial-intelligence/2025/nobodys-talking-voice-interfaces-face-hurdles-for-wide-adoption · eMarketer voice-AI FAQ
- Todoist Quick Add grammar: https://www.todoist.com/help/todoist/features/schedule-a-date-and-time-for-your-todoist-tasks-q7VobO · https://www.leightonprice.com/todoist/dates.html
- AI study-plan limitations: SAGE Journals hallucination review; NIH/PMC hallucination analysis; evidentlyai.com examples
- Student privacy: https://studentprivacy.ed.gov · https://www.eff.org/issues/student-privacy/legalanalysis
- Latency leaderboards: https://artificialanalysis.ai · https://benchlm.ai (conflicting figures noted in §3.13)

**Repository evidence (this session):** `src/services/ai/ai.service.ts:37`, `:221-225`, `:235-242`, `:621`; `src/utils/ai/guardrails.ts`; `src/utils/ai/telemetry.ts`; Solis V1 feature inventory as provided in the research brief (prior direct code inspection).

*Not verified (stated per honesty standard):* I did not run my own latency benchmarks; commercial-app effectiveness claims remain vendor-sourced except the Harvard RCT; Todoist parser implementation is inferred, not officially documented.
