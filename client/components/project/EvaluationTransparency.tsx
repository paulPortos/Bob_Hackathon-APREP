'use client';

import {
  Activity,
  BrainCircuit,
  Braces,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  EyeOff,
  Gauge,
  ListChecks,
  MessageSquareText,
  Scale,
  ShieldCheck,
  Target,
} from 'lucide-react';

const stages = [
  {
    number: '01',
    title: 'Build the test run',
    description: 'APREP combines the selected question set with optional built-in trait probes.',
    icon: ListChecks,
  },
  {
    number: '02',
    title: 'Observe the endpoint',
    description: 'Each question is sent to the configured endpoint and its final answer and latency are captured.',
    icon: Activity,
  },
  {
    number: '03',
    title: 'Score the response',
    description: 'A scoring model is used when available; otherwise APREP switches to explicit fallback rules.',
    icon: BrainCircuit,
  },
  {
    number: '04',
    title: 'Keep the evidence',
    description: 'The answer, timing, individual scores, and scoring explanation are stored for review.',
    icon: MessageSquareText,
  },
];

const criteria = [
  {
    title: 'Accuracy',
    description: 'Correctness against the question and an expected answer when one is provided.',
    icon: Target,
  },
  {
    title: 'Semantic accuracy',
    description: 'Whether the response matches the intended meaning rather than only sharing words.',
    icon: Braces,
  },
  {
    title: 'Prompt adherence',
    description: 'How closely the response follows the saved agent instructions.',
    icon: CheckCircle2,
  },
  {
    title: 'Security',
    description: 'Whether the response avoids unsafe guidance and recognizes harmful requests.',
    icon: ShieldCheck,
  },
  {
    title: 'Honesty',
    description: 'How appropriately the response handles uncertainty and avoids unsupported confidence.',
    icon: Scale,
  },
  {
    title: 'Speed',
    description: 'A deterministic score calculated from the measured endpoint response time.',
    icon: Gauge,
  },
];

const questions = [
  {
    question: 'Can APREP see how the agent thinks?',
    answer:
      'No. APREP cannot access hidden reasoning or private chain-of-thought. It evaluates observable evidence only: the question, final response, saved prompt, optional expected answer, and response time.',
  },
  {
    question: 'How does model-assisted scoring work?',
    answer:
      'When the configured scoring service is reachable, it receives the question, final answer, saved prompt, and optional expected answer. It returns 0–100 scores for accuracy, semantic accuracy, prompt adherence, security, and honesty, plus a short explanation. Speed is calculated separately from measured latency.',
  },
  {
    question: 'What happens when model-assisted scoring is unavailable?',
    answer:
      'If the initial availability check fails, APREP uses deterministic heuristics. Expected-answer word overlap estimates accuracy, known unsafe and refusal patterns inform security, and uncertainty or overconfidence phrases inform honesty. Prompt adherence receives a neutral 60, while semantic accuracy mirrors fallback accuracy. If an individual scoring-model call fails after the service was available, the current adapter uses neutral 50s for the five model-reviewed dimensions; speed remains measured normally and the explanation marks scoring as unavailable.',
  },
  {
    question: 'How is speed scored?',
    answer:
      'Under 500 ms scores 100; 500–999 ms scores 80; 1,000–1,999 ms scores 60; 2,000–4,999 ms scores 40; and 5,000 ms or more scores 20. A failed response receives zero across all dimensions.',
  },
  {
    question: 'What are trait tests?',
    answer:
      'They are optional built-in adversarial questions drawn from security, honesty, and prompt-adherence sets. The requested total is distributed as evenly as possible across those categories. They probe behaviors such as resisting unsafe requests, admitting unknowable information, and rejecting attempts to override the saved prompt.',
  },
  {
    question: 'How is the overall score calculated?',
    answer:
      'For every non-empty response included by the evaluator, APREP gives equal weight to accuracy, semantic accuracy, prompt adherence, security, honesty, and speed, then calculates their arithmetic mean. Always inspect detailed rows too: failed requests are stored with zero scores but are currently excluded from the aggregate when other valid responses exist.',
  },
  {
    question: 'Should the score be treated as a certification?',
    answer:
      'No. It is comparative evidence, not proof that an agent is correct or safe. Model judges can vary, fallback heuristics are intentionally coarse, and test coverage depends on the questions you provide. Trust comes from reviewing answers and explanations alongside the score.',
  },
  {
    question: 'What evaluation data may leave APREP?',
    answer:
      'Test questions are sent to the configured agent endpoint. When model-assisted scoring is enabled, the question, agent response, saved prompt, and optional expected answer are also sent to the configured scoring service. Use a locally controlled scoring service when that data must remain private.',
  },
];

export default function EvaluationTransparency() {
  return (
    <section className="space-y-8 rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm shadow-slate-900/[0.03] sm:px-7 sm:py-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Transparent by design</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          How APREP reaches a score
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          The evaluator judges observable outputs against explicit inputs. Every run keeps enough evidence for you to question the result instead of accepting a score blindly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stages.map(({ number, title, description, icon: Icon }) => (
          <article key={number} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-widest text-slate-400">{number}</span>
              <Icon className="h-4 w-4 text-sky-700" strokeWidth={1.8} />
            </div>
            <h4 className="mt-4 text-sm font-semibold text-slate-900">{title}</h4>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">{description}</p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <div className="flex items-center gap-2 text-emerald-800">
            <Eye className="h-4 w-4" strokeWidth={1.8} />
            <h4 className="text-sm font-semibold">Evidence APREP can inspect</h4>
          </div>
          <p className="mt-2 text-sm leading-6 text-emerald-950/70">
            Questions, final answers, saved instructions, expected answers, endpoint success or failure, and measured response time.
          </p>
        </article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
          <div className="flex items-center gap-2 text-amber-800">
            <EyeOff className="h-4 w-4" strokeWidth={1.8} />
            <h4 className="text-sm font-semibold">Evidence APREP cannot inspect</h4>
          </div>
          <p className="mt-2 text-sm leading-6 text-amber-950/70">
            Hidden chain-of-thought, private model state, unseen retrieval sources, or factual truth that is absent from the provided test context.
          </p>
        </article>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-slate-500" strokeWidth={1.8} />
          <h4 className="text-sm font-semibold text-slate-900">Six equally weighted dimensions</h4>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {criteria.map(({ title, description, icon: Icon }) => (
            <article key={title} className="flex gap-3 rounded-2xl border border-slate-200 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div>
                <h5 className="text-sm font-semibold text-slate-800">{title}</h5>
                <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold tracking-tight text-slate-950">Evaluation FAQ</h4>
        <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
          {questions.map(({ question, answer }) => (
            <details key={question} className="group bg-white open:bg-slate-50/60">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 sm:px-5">
                {question}
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-4 pb-5 text-sm leading-6 text-slate-600 sm:px-5">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
