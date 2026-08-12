'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock3,
  Code2,
  Download,
  Eye,
  FileJson,
  FileSpreadsheet,
  FileText,
  Lightbulb,
  ListChecks,
  Text,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { apiClient } from '@/lib/api';
import type { EvaluationResult } from '@/types';

interface EvaluationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationId: string;
}

type ScoreKey =
  | 'accuracy_score'
  | 'security_score'
  | 'honesty_score'
  | 'speed_score'
  | 'prompt_adherence_score'
  | 'semantic_accuracy_score';

const scoreMetrics: { key: ScoreKey; label: string; shortLabel: string }[] = [
  { key: 'accuracy_score', label: 'Accuracy', shortLabel: 'Accuracy' },
  { key: 'semantic_accuracy_score', label: 'Semantic accuracy', shortLabel: 'Semantic' },
  { key: 'prompt_adherence_score', label: 'Prompt adherence', shortLabel: 'Adherence' },
  { key: 'security_score', label: 'Security', shortLabel: 'Security' },
  { key: 'honesty_score', label: 'Honesty', shortLabel: 'Honesty' },
  { key: 'speed_score', label: 'Speed', shortLabel: 'Speed' },
];

function formatTraitType(traitType: string | null): string {
  if (!traitType) return 'Behavior probe';
  return traitType.replace(/_/g, ' ');
}

function averageScore(results: EvaluationResult[], key: ScoreKey): number {
  if (!results.length) return 0;
  return results.reduce((sum, result) => sum + result[key], 0) / results.length;
}

function resultAverage(result: EvaluationResult): number {
  return scoreMetrics.reduce((sum, metric) => sum + result[metric.key], 0) / scoreMetrics.length;
}

function performanceLabel(score: number): string {
  if (score >= 80) return 'Going well';
  if (score >= 60) return 'Mixed result';
  return 'Needs attention';
}

function splitExplanation(explanation: string): string[] {
  const normalized = explanation
    .replace(/\r/g, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .trim();

  if (!normalized) return [];

  return (normalized.match(/[^.!?\n]+[.!?]?/g) || [normalized])
    .map((part) => part.trim())
    .filter(Boolean);
}

function AgentAnswer({ answer }: { answer: string }) {
  const [view, setView] = useState<'formatted' | 'raw'>('formatted');

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Agent answer</h4>
          <p className="mt-0.5 text-xs text-slate-500">
            Formatted view makes headings, lists, links, and code easier to read.
          </p>
        </div>
        <div className="inline-flex w-fit rounded-lg bg-slate-100 p-1" aria-label="Answer display mode">
          <button
            type="button"
            onClick={() => setView('formatted')}
            aria-pressed={view === 'formatted'}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
              view === 'formatted' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Text className="h-3.5 w-3.5" />
            Formatted
          </button>
          <button
            type="button"
            onClick={() => setView('raw')}
            aria-pressed={view === 'raw'}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
              view === 'raw' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Raw
          </button>
        </div>
      </div>

      {view === 'formatted' ? (
        <div className="max-w-none break-words px-4 py-4 text-sm leading-7 text-slate-700 [&_a]:font-medium [&_a]:text-sky-700 [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_code]:break-words [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-slate-100 [&_table]:my-3 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
            {answer || 'No answer was returned.'}
          </ReactMarkdown>
        </div>
      ) : (
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words bg-slate-950 px-4 py-4 font-mono text-xs leading-6 text-slate-100">
          {answer || 'No answer was returned.'}
        </pre>
      )}
    </section>
  );
}

function ExplanationHighlights({ explanation }: { explanation: string }) {
  const [showAll, setShowAll] = useState(false);
  const highlights = splitExplanation(explanation);

  if (!highlights.length) return null;

  const supporting = showAll ? highlights.slice(1) : highlights.slice(1, 3);
  const hiddenCount = Math.max(highlights.length - 3, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm ring-1 ring-slate-200">
          <Lightbulb className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scoring takeaway</p>
          <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-900">{highlights[0]}</p>

          {supporting.length > 0 && (
            <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3">
              {supporting.map((highlight, index) => (
                <li key={`${highlight}-${index}`} className="flex gap-2 text-xs leading-5 text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          )}

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="mt-3 text-xs font-semibold text-sky-700 hover:text-sky-800"
            >
              {showAll ? 'Show less' : `Show ${hiddenCount} more ${hiddenCount === 1 ? 'detail' : 'details'}`}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function ExtractMenu({
  onExportJSON,
  onExportCSV,
}: {
  onExportJSON: () => Promise<void>;
  onExportCSV: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const chooseExport = (exporter: () => Promise<void>) => {
    setIsOpen(false);
    void exporter();
  };

  return (
    <div ref={menuRef} className="relative flex">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex min-h-[58px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Download className="h-4 w-4" />
        Extract
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => chooseExport(onExportCSV)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-500" />
            <span>
              <span className="block text-sm font-semibold text-slate-800">CSV spreadsheet</span>
              <span className="block text-xs text-slate-500">For tables and analysis</span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => chooseExport(onExportJSON)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
          >
            <FileJson className="h-4 w-4 text-slate-500" />
            <span>
              <span className="block text-sm font-semibold text-slate-800">JSON data</span>
              <span className="block text-xs text-slate-500">For systems and developers</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function ScorePreview({ result }: { result: EvaluationResult }) {
  const average = resultAverage(result);

  return (
    <div className="group/scores relative shrink-0 self-center">
      <button
        type="button"
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-right transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
        aria-label={`Preview scores for this response. Average ${average.toFixed(0)} out of 100`}
        aria-describedby={`score-preview-${result.id}`}
      >
        <span className="block text-sm font-semibold tabular-nums text-slate-950">{average.toFixed(0)}</span>
        <span className="block text-[10px] uppercase tracking-wide text-slate-400">Scores</span>
      </button>

      <div
        id={`score-preview-${result.id}`}
        role="tooltip"
        className="invisible absolute right-0 top-full z-30 mt-2 w-72 translate-y-1 rounded-xl border border-slate-200 bg-white p-3 opacity-0 shadow-xl shadow-slate-950/10 transition group-hover/scores:visible group-hover/scores:translate-y-0 group-hover/scores:opacity-100 group-focus-within/scores:visible group-focus-within/scores:translate-y-0 group-focus-within/scores:opacity-100"
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-800">Score preview</p>
          <p className="text-[11px] text-slate-400">out of 100</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {scoreMetrics.map((metric) => (
            <div key={metric.key} className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
              <span className="truncate text-[11px] text-slate-500">{metric.shortLabel}</span>
              <span className="text-xs font-semibold tabular-nums text-slate-900">
                {result[metric.key].toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsView({ results }: { results: EvaluationResult[] }) {
  const [questionOrder, setQuestionOrder] = useState<'lowest' | 'highest'>('lowest');
  const profile = scoreMetrics.map((metric) => ({
    ...metric,
    score: averageScore(results, metric.key),
  }));
  const strongest = results.length
    ? profile.reduce((best, metric) => (metric.score > best.score ? metric : best), profile[0])
    : undefined;
  const weakest = results.length
    ? profile.reduce((lowest, metric) => (metric.score < lowest.score ? metric : lowest), profile[0])
    : undefined;
  const averageResponseTime = results.length
    ? results.reduce((sum, result) => sum + result.response_time_ms, 0) / results.length
    : 0;
  const questionAnalytics = results.map((result, originalIndex) => ({
    result,
    originalIndex,
    score: resultAverage(result),
  }));
  const rankedResults = [...questionAnalytics].sort((a, b) =>
    questionOrder === 'lowest' ? a.score - b.score : b.score - a.score
  );
  const distribution = [
    { label: 'Going well', range: '80–100', count: questionAnalytics.filter(({ score }) => score >= 80).length },
    {
      label: 'Mixed result',
      range: '60–79',
      count: questionAnalytics.filter(({ score }) => score >= 60 && score < 80).length,
    },
    { label: 'Needs attention', range: 'Below 60', count: questionAnalytics.filter(({ score }) => score < 60).length },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Responses tested</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{results.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Average response time</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {averageResponseTime.toFixed(0)} <span className="text-sm font-medium text-slate-400">ms</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Strongest area</p>
          <p className="mt-2 truncate text-base font-semibold text-slate-950">{strongest?.label || 'No data'}</p>
          <p className="mt-1 text-xs tabular-nums text-slate-500">{strongest?.score.toFixed(0) || 0} average</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Focus area</p>
          <p className="mt-2 truncate text-base font-semibold text-slate-950">{weakest?.label || 'No data'}</p>
          <p className="mt-1 text-xs tabular-nums text-slate-500">{weakest?.score.toFixed(0) || 0} average</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-950">Performance profile</h3>
        <p className="mt-1 text-sm text-slate-500">Average score across all evaluated responses.</p>
        <div className="mt-5 grid gap-x-8 gap-y-4 md:grid-cols-2">
          {profile.map((metric) => (
            <div key={metric.key}>
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-700">{metric.label}</span>
                <span className="font-semibold tabular-nums text-slate-950">{metric.score.toFixed(0)}</span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label={`${metric.label}: ${metric.score.toFixed(0)} out of 100`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(metric.score)}
              >
                <div
                  className="h-full rounded-full bg-sky-700"
                  style={{ width: `${Math.max(0, Math.min(metric.score, 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-950">Question distribution</h3>
        <p className="mt-1 text-sm text-slate-500">How question-level averages are grouped.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {distribution.map((item) => {
            const percentage = results.length ? (item.count / results.length) * 100 : 0;
            return (
              <div key={item.label} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-xs font-semibold text-slate-700">{item.label}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">{item.range}</span>
                  </span>
                  <span className="text-lg font-semibold tabular-nums text-slate-950">{item.count}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-700" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Question performance</h3>
            <p className="mt-1 text-sm text-slate-500">
              Compare the overall result and individual metrics for every question.
            </p>
          </div>
          <div className="inline-flex w-fit rounded-lg bg-slate-100 p-1" aria-label="Question performance order">
            <button
              type="button"
              onClick={() => setQuestionOrder('lowest')}
              aria-pressed={questionOrder === 'lowest'}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                questionOrder === 'lowest'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Lowest first
            </button>
            <button
              type="button"
              onClick={() => setQuestionOrder('highest')}
              aria-pressed={questionOrder === 'highest'}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                questionOrder === 'highest'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Highest first
            </button>
          </div>
        </div>

        {rankedResults.length ? (
          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {rankedResults.map(({ result, score, originalIndex }) => (
              <article key={result.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                    {originalIndex + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                        {performanceLabel(score)}
                      </span>
                      {result.is_trait_test && (
                        <span className="text-[10px] font-medium capitalize text-slate-400">
                          {formatTraitType(result.trait_type)}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{result.question_text}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-semibold tabular-nums text-slate-950">{score.toFixed(0)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Average</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
                  {scoreMetrics.map((metric) => {
                    const metricScore = result[metric.key];
                    return (
                      <div key={metric.key}>
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="truncate text-slate-500" title={metric.label}>
                            {metric.shortLabel}
                          </span>
                          <span className="font-semibold tabular-nums text-slate-800">{metricScore.toFixed(0)}</span>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-sky-700"
                            style={{ width: `${Math.max(0, Math.min(metricScore, 100))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-4 flex items-center gap-1 border-t border-slate-200 pt-3 text-[11px] text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  Responded in {result.response_time_ms} ms
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500">
            No question analytics are available.
          </p>
        )}
      </section>
    </div>
  );
}

export default function EvaluationDetailsModal({
  isOpen,
  onClose,
  evaluationId,
}: EvaluationDetailsModalProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<'results' | 'analytics'>('results');
  const [isQuestionSetOpen, setIsQuestionSetOpen] = useState(false);

  const { data: evaluation, isLoading } = useQuery({
    queryKey: ['evaluation', evaluationId],
    queryFn: () => apiClient.getEvaluation(evaluationId),
    enabled: isOpen && Boolean(evaluationId),
  });

  useEffect(() => {
    if (!isOpen) return;
    setActiveView('results');
    setExpandedRows(new Set());
    setIsQuestionSetOpen(false);
  }, [evaluationId, isOpen]);

  const handleExportJSON = async () => {
    try {
      const blob = await apiClient.exportEvaluationJSON(evaluationId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `evaluation-${evaluationId}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      toast.success('JSON exported');
    } catch {
      toast.error('Failed to export JSON');
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await apiClient.exportEvaluationCSV(evaluationId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `evaluation-${evaluationId}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      toast.success('CSV exported');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const closeDetails = () => {
    setIsQuestionSetOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  const overallScore = evaluation?.overall_score ?? 0;
  const recommendationParts = evaluation?.recommendation?.split(/:\s*/, 2) || [];
  const savedQuestions = evaluation?.results.filter((result) => !result.is_trait_test) || [];
  const behaviorProbes = evaluation?.results.filter((result) => result.is_trait_test) || [];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={isQuestionSetOpen ? () => setIsQuestionSetOpen(false) : closeDetails}
        title="Evaluation details"
        size="full"
      >
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : evaluation ? (
          <div className="max-h-[calc(100svh-10rem)] space-y-5 overflow-y-auto pr-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          evaluation.status === 'completed'
                            ? 'bg-emerald-500'
                            : evaluation.status === 'running'
                              ? 'bg-sky-500'
                              : 'bg-rose-500'
                        }`}
                      />
                      {evaluation.status}
                    </span>
                    <span className="text-xs text-slate-400">{evaluation.results.length} responses</span>
                  </div>
                  <h2 className="mt-3 truncate text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                    {evaluation.project_name}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span>Question set: {evaluation.slot_name}</span>
                    <button
                      type="button"
                      onClick={() => setIsQuestionSetOpen(true)}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View questions
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>Started {new Date(evaluation.started_at).toLocaleString()}</span>
                    {evaluation.completed_at && (
                      <span>Completed {new Date(evaluation.completed_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex w-full items-stretch gap-2 sm:w-auto">
                  <div className="flex min-h-[58px] flex-1 items-center justify-between gap-5 rounded-xl border border-slate-200 bg-slate-50 px-4 sm:flex-none">
                    <span>
                      <span className="block text-xs font-medium text-slate-500">Overall score</span>
                      <span className="block text-[11px] text-slate-400">out of 100</span>
                    </span>
                    <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-950">
                      {overallScore.toFixed(1)}
                    </span>
                  </div>
                  <ExtractMenu onExportJSON={handleExportJSON} onExportCSV={handleExportCSV} />
                </div>
              </div>
            </section>

            <div className="flex" role="tablist" aria-label="Evaluation view">
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === 'results'}
                  aria-controls="evaluation-results-view"
                  onClick={() => setActiveView('results')}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    activeView === 'results' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Results
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === 'analytics'}
                  aria-controls="evaluation-analytics-view"
                  onClick={() => setActiveView('analytics')}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    activeView === 'analytics'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </button>
              </div>
            </div>

            {activeView === 'results' ? (
              <div id="evaluation-results-view" role="tabpanel" className="space-y-5">
                {evaluation.recommendation && (
                  <section className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm ring-1 ring-slate-200">
                      <Lightbulb className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommendation</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">{recommendationParts[0]}</p>
                      {recommendationParts[1] && (
                        <p className="mt-1 text-sm leading-6 text-slate-600">{recommendationParts[1]}</p>
                      )}
                    </div>
                  </section>
                )}

                <section className="relative rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between gap-4 rounded-t-2xl border-b border-slate-200 px-4 py-4 sm:px-5">
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">Response details</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Hover or focus a score to preview it. Open the row for the complete answer.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <ListChecks className="h-4 w-4" />
                      {evaluation.results.length}
                    </span>
                  </div>

                  {evaluation.results.length ? (
                    <div className="divide-y divide-slate-100">
                      {evaluation.results.map((result, index) => {
                        const isExpanded = expandedRows.has(result.id);
                        const detailsId = `evaluation-result-${result.id}`;

                        return (
                          <article key={result.id}>
                            <div className="flex items-stretch transition hover:bg-slate-50">
                              <button
                                type="button"
                                onClick={() => toggleRow(result.id)}
                                className="flex min-w-0 flex-1 items-start gap-3 px-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 sm:items-center sm:px-5 sm:pr-3"
                                aria-expanded={isExpanded}
                                aria-controls={detailsId}
                              >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                                  {index + 1}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-medium leading-6 text-slate-900">
                                    {result.question_text}
                                  </span>
                                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    {result.is_trait_test && (
                                      <span className="capitalize">{formatTraitType(result.trait_type)}</span>
                                    )}
                                    <span className="inline-flex items-center gap-1">
                                      <Clock3 className="h-3.5 w-3.5" />
                                      {result.response_time_ms} ms
                                    </span>
                                  </span>
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-slate-400 sm:mt-0" />
                                ) : (
                                  <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400 sm:mt-0" />
                                )}
                              </button>
                              <div className="flex items-center pr-4 sm:pr-5">
                                <ScorePreview result={result} />
                              </div>
                            </div>

                            {isExpanded && (
                              <div
                                id={detailsId}
                                className="space-y-4 border-t border-slate-100 bg-slate-50/70 px-4 py-5 sm:px-5"
                              >
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                                  {scoreMetrics.map((metric) => (
                                    <div key={metric.key} className="rounded-xl border border-slate-200 bg-white p-3">
                                      <p className="truncate text-[11px] font-medium text-slate-500" title={metric.label}>
                                        {metric.shortLabel}
                                      </p>
                                      <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">
                                        {result[metric.key].toFixed(0)}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
                                  <AgentAnswer answer={result.agent_answer} />
                                  {result.score_explanation && (
                                    <ExplanationHighlights explanation={result.score_explanation} />
                                  )}
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-5 py-12 text-center text-sm text-slate-500">No responses were recorded.</div>
                  )}
                </section>
              </div>
            ) : (
              <div id="evaluation-analytics-view" role="tabpanel">
                <AnalyticsView results={evaluation.results} />
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">Evaluation not found</div>
        )}
      </Modal>

      {evaluation && (
        <Modal
          isOpen={isQuestionSetOpen}
          onClose={() => setIsQuestionSetOpen(false)}
          title="Evaluation questions"
          size="md"
        >
          <div className="max-h-[calc(100svh-11rem)] overflow-y-auto pr-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Question set</p>
              <p className="mt-1 font-semibold text-slate-950">{evaluation.slot_name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {savedQuestions.length} saved {savedQuestions.length === 1 ? 'question' : 'questions'}
                {behaviorProbes.length > 0 && ` · ${behaviorProbes.length} behavior probes`}
              </p>
            </div>

            <section className="mt-5">
              <h3 className="text-sm font-semibold text-slate-900">Saved questions</h3>
              {savedQuestions.length ? (
                <ol className="mt-3 space-y-2">
                  {savedQuestions.map((result, index) => (
                    <li key={result.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-500">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-slate-700">{result.question_text}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No saved questions were recorded.</p>
              )}
            </section>

            {behaviorProbes.length > 0 && (
              <section className="mt-6 border-t border-slate-200 pt-5">
                <h3 className="text-sm font-semibold text-slate-900">Behavior probes</h3>
                <ul className="mt-3 space-y-2">
                  {behaviorProbes.map((result) => (
                    <li key={result.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[11px] font-semibold capitalize text-slate-500">
                        {formatTraitType(result.trait_type)}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{result.question_text}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
