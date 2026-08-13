'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Bot,
  Braces,
  CalendarDays,
  CircleHelp,
  Clock3,
  Edit3,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe2,
  History as HistoryIcon,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Play,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PromptModal from '@/components/project/PromptModal';
import QuestionSlotModal from '@/components/project/QuestionSlotModal';
import GenerateQuestionsModal from '@/components/project/GenerateQuestionsModal';
import EvaluationWizard from '@/components/project/EvaluationWizard';
import EvaluationTransparency from '@/components/project/EvaluationTransparency';
import EvaluationDetailsModal from '@/components/project/EvaluationDetailsModal';
import EditProjectModal from '@/components/project/EditProjectModal';
import ProjectGuide, {
  PROJECT_GUIDE_STEPS,
  type ProjectGuideStep,
} from '@/components/project/ProjectGuide';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { QuestionSlot } from '@/types';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

function SectionHeader({ eyebrow, title, description, actions }: SectionHeaderProps) {
  return (
    <div className="grid min-w-0 gap-4 md:h-[112px] md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">{eyebrow}</p>
        <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 md:line-clamp-2">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2 md:self-end md:justify-end">{actions}</div>}
    </div>
  );
}

interface EmptyStateProps {
  icon: typeof FolderOpen;
  title: string;
  description: string;
  children?: ReactNode;
}

function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm shadow-slate-900/[0.02] sm:py-16">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
        <Icon className="h-7 w-7" strokeWidth={1.7} />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
      <Spinner className="border-sky-600" />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className="min-w-0 bg-white p-4 sm:p-5 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-x-3 lg:p-4">
      <div className="flex items-center justify-between lg:contents">
        <div className="min-w-0 lg:order-2">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 hidden truncate text-xs text-slate-400 lg:block">{detail}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 lg:order-1">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 lg:order-3 lg:mt-0 lg:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400 lg:hidden">{detail}</p>
    </article>
  );
}

function OverviewTab({ projectId }: { projectId: string }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiClient.getProject(projectId),
  });
  const { data: prompt } = useQuery({
    queryKey: ['prompt', projectId],
    queryFn: () => apiClient.getPrompt(projectId),
    retry: false,
  });
  const { data: slots } = useQuery({
    queryKey: ['question-slots', projectId],
    queryFn: () => apiClient.getQuestionSlots(projectId),
  });
  const { data: evaluations } = useQuery({
    queryKey: ['evaluations', projectId],
    queryFn: () => apiClient.getEvaluations(projectId),
  });

  if (!project) return <LoadingBlock />;

  const questionCount = slots?.reduce((total, slot) => total + slot.questions.length, 0) ?? 0;

  return (
    <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(14rem,0.34fr)_minmax(0,1fr)]">
      <section
        className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-sm shadow-slate-900/[0.03] sm:grid-cols-3 lg:grid-cols-1"
        aria-label="Project readiness"
      >
        <MetricCard
          icon={FileText}
          label="Agent prompt"
          value={prompt?.content?.trim() ? 1 : 0}
          detail={prompt?.content?.trim() ? 'Ready for evaluation' : 'Not added yet'}
        />
        <MetricCard
          icon={ListChecks}
          label="Test questions"
          value={questionCount}
          detail={`${slots?.length ?? 0} question ${(slots?.length ?? 0) === 1 ? 'slot' : 'slots'}`}
        />
        <MetricCard
          icon={HistoryIcon}
          label="Evaluations"
          value={evaluations?.length ?? 0}
          detail="Runs saved to history"
        />
      </section>

      <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Connection</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">Agent API contract</h3>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="w-full rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            <Settings2 className="mr-1.5 h-4 w-4" strokeWidth={1.8} />
            Edit configuration
          </Button>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.85fr)]">
          <div className="min-w-0 space-y-5 px-5 py-6 sm:px-6 lg:border-r lg:border-slate-100">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Endpoint</p>
              <a
                href={project.endpoint_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                <Globe2 className="h-4 w-4 shrink-0 text-sky-700" strokeWidth={1.8} />
                <span className="min-w-0 flex-1 truncate">{project.endpoint_url}</span>
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
              </a>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 px-4 py-3.5">
                <p className="text-xs font-medium text-slate-400">Authentication</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  {project.requires_token ? (
                    <LockKeyhole className="h-4 w-4 text-amber-600" strokeWidth={1.8} />
                  ) : (
                    <Globe2 className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
                  )}
                  {project.requires_token ? 'Bearer token' : 'No token'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3.5">
                <p className="text-xs font-medium text-slate-400">Created</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <CalendarDays className="h-4 w-4 text-sky-700" strokeWidth={1.8} />
                  {formatDate(project.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-5 border-t border-slate-100 bg-slate-50/60 px-5 py-6 sm:px-6 lg:border-t-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Braces className="h-4 w-4 text-slate-500" strokeWidth={1.8} />
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Request template</p>
              </div>
              <pre className="mt-2 max-w-full whitespace-pre-wrap break-all rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-cyan-100 shadow-inner">
                <code>{project.request_body_template}</code>
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Answer path</p>
              <code className="mt-2 block max-w-full break-all rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-medium leading-5 text-slate-700">
                {project.response_path}
              </code>
            </div>
          </div>
        </div>
      </section>

      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={project}
      />
    </div>
  );
}

function PromptsTab({ projectId }: { projectId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: prompt, isLoading } = useQuery({
    queryKey: ['prompt', projectId],
    queryFn: () => apiClient.getPrompt(projectId),
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.createOrUpdatePrompt(projectId, { content: '', file_type: 'txt' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt', projectId] });
      toast.success('Prompt removed');
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to remove prompt')),
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Behavior reference"
        title="Agent prompt"
        description="Save the instructions your agent should follow so evaluations can measure prompt adherence."
        actions={
          prompt?.content?.trim() ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
              >
                <Edit3 className="mr-1.5 h-4 w-4" strokeWidth={1.8} />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-1.5 h-4 w-4" strokeWidth={1.8} />
                Remove
              </Button>
            </>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingBlock />
      ) : prompt?.content?.trim() ? (
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <FileText className="h-4 w-4 text-sky-700" strokeWidth={1.8} />
              Current prompt
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium uppercase text-slate-500">
              {prompt.file_type}
            </span>
          </div>
          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap break-words px-5 py-6 font-mono text-sm leading-7 text-slate-700 sm:px-6">
            {prompt.content}
          </pre>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400 sm:px-6">
            Added {formatDate(prompt.created_at)}
          </div>
        </article>
      ) : (
        <EmptyState
          icon={Upload}
          title="No agent prompt yet"
          description="Add the behavior instructions used by your agent to make prompt-adherence scoring more meaningful."
        >
          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-slate-950 hover:bg-slate-800 focus:ring-slate-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add prompt
          </Button>
        </EmptyState>
      )}

      <PromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        existingPrompt={prompt?.content?.trim() ? prompt : null}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['prompt', projectId] })}
      />
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Remove prompt"
        message="Remove this prompt from the project? This cannot be undone."
        confirmText="Remove"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function QuestionSlotsTab({ projectId }: { projectId: string }) {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<QuestionSlot | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<QuestionSlot | null>(null);
  const queryClient = useQueryClient();

  const { data: slots, isLoading } = useQuery({
    queryKey: ['question-slots', projectId],
    queryFn: () => apiClient.getQuestionSlots(projectId),
  });

  const deleteMutation = useMutation({
    mutationFn: (slotId: string) => apiClient.deleteQuestionSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-slots', projectId] });
      toast.success('Question slot deleted');
      setSlotToDelete(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to delete question slot')),
  });

  const actions = (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsManualModalOpen(true)}
        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        New slot
      </Button>
      <Button
        size="sm"
        onClick={() => setIsGenerateModalOpen(true)}
        className="rounded-xl bg-slate-950 hover:bg-slate-800 focus:ring-slate-500"
      >
        <Sparkles className="mr-1.5 h-4 w-4" />
        Generate questions
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Test library"
        title="Question slots"
        description="Group related questions into reusable sets for focused, repeatable evaluations."
        actions={actions}
      />

      {isLoading ? (
        <LoadingBlock />
      ) : slots?.length ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {slots.map((slot) => (
            <article
              key={slot.id}
              className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.03] transition hover:border-slate-300 hover:shadow-md sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg font-semibold tracking-tight text-slate-950">
                      {slot.name}
                    </h3>
                    {slot.is_auto_generated && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                        <Sparkles className="h-3 w-3" />
                        Generated
                      </span>
                    )}
                  </div>
                  {slot.description && (
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{slot.description}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {slot.questions.length} {slot.questions.length === 1 ? 'question' : 'questions'}
                </span>
              </div>

              <div className="mt-4 flex-1 rounded-2xl bg-slate-50 p-3">
                {slot.questions.length ? (
                  <ol className="space-y-2">
                    {slot.questions.slice(0, 3).map((question, index) => (
                      <li key={question.id} className="flex gap-3 text-sm leading-5 text-slate-600">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white text-[10px] font-semibold text-slate-400 shadow-sm">
                          {index + 1}
                        </span>
                        <span className="line-clamp-2">{question.question_text}</span>
                      </li>
                    ))}
                    {slot.questions.length > 3 && (
                      <li className="pl-8 text-xs font-medium text-slate-400">
                        {slot.questions.length - 3} more
                      </li>
                    )}
                  </ol>
                ) : (
                  <p className="text-sm text-slate-400">No questions in this slot.</p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSlotToEdit(slot)}
                  className="rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  <Edit3 className="mr-1.5 h-4 w-4" strokeWidth={1.8} />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSlotToDelete(slot)}
                  className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" strokeWidth={1.8} />
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="Build your first question set"
          description="Use the actions above to create questions manually or generate a starting set."
        />
      )}

      <QuestionSlotModal
        isOpen={isManualModalOpen || !!slotToEdit}
        onClose={() => {
          setIsManualModalOpen(false);
          setSlotToEdit(null);
        }}
        projectId={projectId}
        existingSlot={slotToEdit}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['question-slots', projectId] })}
      />
      <GenerateQuestionsModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        projectId={projectId}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['question-slots', projectId] })}
      />
      <ConfirmDialog
        isOpen={!!slotToDelete}
        onClose={() => setSlotToDelete(null)}
        onConfirm={() => slotToDelete && deleteMutation.mutate(slotToDelete.id)}
        title="Delete question slot"
        message={`Delete “${slotToDelete?.name}” and its questions? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function EvaluationTab({
  projectId,
  onEvaluationComplete,
}: {
  projectId: string;
  onEvaluationComplete: () => void;
}) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Evaluation run"
        title="Test your agent"
        description="Choose a question set and score the agent across accuracy, safety, honesty, speed, and prompt adherence."
      />

      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-9 text-white shadow-xl shadow-slate-950/10 sm:px-9 sm:py-11">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="max-w-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-sky-300">
              <Play className="h-5 w-5 fill-current" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">Run a reviewable evaluation</h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Choose the test set and optional trait probes. APREP records each answer, score, timing, and explanation so the final result can be inspected.
            </p>
            <Button
              size="lg"
              onClick={() => setIsWizardOpen(true)}
              className="mt-7 rounded-xl bg-white px-5 text-base text-slate-950 hover:bg-slate-100 focus:ring-white"
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              Configure evaluation
            </Button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Every run records</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {['Question and final answer', 'Endpoint response time', 'Six individual scores', 'Per-response explanation'].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <EvaluationTransparency />

      <EvaluationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        projectId={projectId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['evaluations', projectId] });
          onEvaluationComplete();
        }}
      />
    </div>
  );
}

function HistoryTab({ projectId }: { projectId: string }) {
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['evaluations', projectId],
    queryFn: () => apiClient.getEvaluations(projectId),
  });

  const statusStyles = {
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    running: 'bg-sky-50 text-sky-700 ring-sky-600/10',
    failed: 'bg-red-50 text-red-700 ring-red-600/10',
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Past performance"
        title="Evaluation history"
        description="Review scores and open the full breakdown from each completed run."
      />

      {isLoading ? (
        <LoadingBlock />
      ) : evaluations?.length ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-6">Started</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Score</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700 sm:px-6">
                      <span className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
                        {formatDateTime(evaluation.started_at)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles[evaluation.status]}`}>
                        {evaluation.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-sm font-semibold tabular-nums text-slate-900">
                        {evaluation.overall_score == null ? '—' : evaluation.overall_score.toFixed(1)}
                      </span>
                      {evaluation.overall_score != null && <span className="text-xs text-slate-400"> / 100</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right sm:px-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEvaluationId(evaluation.id)}
                        disabled={evaluation.status !== 'completed'}
                        className="rounded-xl text-slate-700 hover:bg-slate-100"
                      >
                        View report
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={HistoryIcon}
          title="No evaluations yet"
          description="Completed runs will appear here with their score, status, and full report."
        />
      )}

      <EvaluationDetailsModal
        isOpen={!!selectedEvaluationId}
        onClose={() => setSelectedEvaluationId(null)}
        evaluationId={selectedEvaluationId || ''}
      />
    </div>
  );
}

function getEndpointHost(endpointUrl: string) {
  try {
    return new URL(endpointUrl).host;
  } catch {
    return endpointUrl;
  }
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [activeTab, setActiveTab] = useState<ProjectGuideStep>('overview');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideStepIndex, setGuideStepIndex] = useState(0);
  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, content: <OverviewTab projectId={projectId} /> },
    { id: 'prompts', label: 'Prompt', icon: FileText, content: <PromptsTab projectId={projectId} /> },
    { id: 'slots', label: 'Questions', icon: ListChecks, content: <QuestionSlotsTab projectId={projectId} /> },
    {
      id: 'evaluate',
      label: 'Evaluate',
      icon: Play,
      content: (
        <EvaluationTab
          projectId={projectId}
          onEvaluationComplete={() => setActiveTab('history')}
        />
      ),
    },
    { id: 'history', label: 'History', icon: HistoryIcon, content: <HistoryTab projectId={projectId} /> },
  ];

  const handleGuideStepChange = (index: number) => {
    const nextStep = PROJECT_GUIDE_STEPS[index];
    if (!nextStep) return;
    setGuideStepIndex(index);
    setActiveTab(nextStep.id);
  };

  const handleTabChange = (tabId: string) => {
    const nextTab = tabId as ProjectGuideStep;
    setActiveTab(nextTab);
    if (isGuideOpen) {
      const nextIndex = PROJECT_GUIDE_STEPS.findIndex((step) => step.id === nextTab);
      if (nextIndex >= 0) setGuideStepIndex(nextIndex);
    }
  };

  const openGuide = () => {
    setIsGuideOpen(true);
    handleGuideStepChange(0);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50/70">
        <Navbar />

        <main className="mx-auto w-full min-w-0 max-w-[1400px] overflow-x-clip px-4 py-7 sm:px-6 sm:py-9 lg:px-12">
          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-slate-500 transition hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
            All projects
          </Link>

          {isLoading ? (
            <div className="mt-6 animate-pulse">
              <div className="h-5 w-32 rounded bg-slate-200" />
              <div className="mt-4 h-10 w-80 max-w-full rounded-lg bg-slate-200" />
              <div className="mt-3 h-5 w-56 rounded bg-slate-200" />
              <div className="mt-8 h-14 rounded-2xl border border-slate-200 bg-white" />
              <div className="mt-6 h-72 rounded-3xl border border-slate-200 bg-white" />
            </div>
          ) : project && !isError ? (
            <>
              <header className="mb-7 mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
                <div className="relative px-5 py-6 sm:px-7 sm:py-7">
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-sky-100/70 blur-3xl" />
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sky-300 shadow-lg shadow-slate-900/10">
                      <Bot className="h-7 w-7" strokeWidth={1.7} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Agent project</p>
                      </div>
                      <h1 className="mt-1.5 truncate text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                        {project.name}
                      </h1>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Globe2 className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                          <span className="truncate">{getEndpointHost(project.endpoint_url)}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          {project.requires_token ? (
                            <KeyRound className="h-4 w-4" strokeWidth={1.8} />
                          ) : (
                            <Globe2 className="h-4 w-4" strokeWidth={1.8} />
                          )}
                          {project.requires_token ? 'Protected endpoint' : 'Public endpoint'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openGuide}
                      className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:self-center"
                      aria-label="Open project guide"
                    >
                      <CircleHelp className="h-4 w-4 text-sky-700" strokeWidth={1.8} />
                      Guide
                    </button>
                  </div>
                </div>
              </header>

              <Tabs
                tabs={tabs}
                defaultTab="overview"
                activeTab={activeTab}
                onChange={handleTabChange}
              />
            </>
          ) : (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Bot className="h-7 w-7" strokeWidth={1.7} />
              </div>
              <h1 className="mt-5 text-xl font-semibold text-slate-950">Project not found</h1>
              <p className="mt-2 text-sm text-slate-500">It may have been deleted or you may not have access.</p>
              <Link
                href="/home"
                className="mt-6 inline-flex items-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Return to projects
              </Link>
            </div>
          )}
        </main>

        <ProjectGuide
          isOpen={isGuideOpen}
          stepIndex={guideStepIndex}
          onStepChange={handleGuideStepChange}
          onClose={() => setIsGuideOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
