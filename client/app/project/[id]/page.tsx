'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
import EvaluationDetailsModal from '@/components/project/EvaluationDetailsModal';
import EditProjectModal from '@/components/project/EditProjectModal';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { ChevronRight, Upload, Edit, Trash2, Plus, Sparkles, FolderOpen, History as HistoryIcon, Settings, Play } from 'lucide-react';
import Link from 'next/link';
import { QuestionSlot } from '@/types';

// Tab components
function OverviewTab({ projectId }: { projectId: string }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const { data: slots } = useQuery({
    queryKey: ['question-slots', projectId],
    queryFn: () => apiClient.getQuestionSlots(projectId),
  });

  const { data: evaluations } = useQuery({
    queryKey: ['evaluations', projectId],
    queryFn: () => apiClient.getEvaluations(projectId),
  });

  if (!project) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">Project Information</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <dl className="grid grid-cols-1 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{project.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Endpoint URL</dt>
            <dd className="mt-1 text-sm text-gray-900">{project.endpoint_url}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Requires Token</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {project.requires_token ? 'Yes' : 'No'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Request Field</dt>
            <dd className="mt-1 text-sm text-gray-900">{project.request_field_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Response Field</dt>
            <dd className="mt-1 text-sm text-gray-900">{project.response_field_name}</dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-primary-600">1</div>
          <div className="text-sm text-gray-500 mt-1">Total Prompts</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-primary-600">{slots?.length || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Question Slots</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-primary-600">{evaluations?.length || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Evaluations</div>
        </div>
      </div>

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
      toast.success('Prompt deleted successfully!');
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete prompt'));
    },
  });

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">About Agent Prompts</h4>
        <p className="text-sm text-blue-800">
          This prompt is used <strong>by your AI agent</strong> to guide its behavior and responses.
          The evaluator will analyze how well your agent follows this prompt during evaluations.
          Storing prompts here helps you track your agent's behavior over time as you improve it.
        </p>
      </div>
      {isLoading ? (
        <Spinner />
      ) : prompt ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">Current Prompt</h3>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
          <div className="bg-gray-50 rounded p-4">
            <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
              {prompt.content}
            </pre>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Type: {prompt.file_type} • Created: {new Date(prompt.created_at).toLocaleDateString()}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-2">No prompt uploaded yet</p>
          <p className="text-sm text-gray-400 mb-6">Upload a prompt to get started</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Prompt
          </Button>
        </div>
      )}

      <PromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        existingPrompt={prompt}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['prompt', projectId] });
        }}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Prompt"
        message="Are you sure you want to delete this prompt? This action cannot be undone."
        confirmText="Delete"
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
      toast.success('Question slot deleted successfully!');
      setSlotToDelete(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete question slot'));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => setIsManualModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Manual Slot
        </Button>
        <Button onClick={() => setIsGenerateModalOpen(true)}>
          <Sparkles className="h-4 w-4 mr-2" />
          Auto-Generate Questions
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : slots && slots.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {slots.map((slot) => (
            <div key={slot.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{slot.name}</h3>
                  {slot.description && (
                    <p className="text-sm text-gray-600 mt-1">{slot.description}</p>
                  )}
                  <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
                    <span>{slot.questions.length} questions</span>
                    {slot.is_auto_generated && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        AI Generated
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSlotToEdit(slot)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setSlotToDelete(slot)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Show questions preview */}
              {slot.questions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Questions:</p>
                  <div className="space-y-2">
                    {slot.questions.slice(0, 3).map((q, idx) => (
                      <div key={q.id} className="text-sm text-gray-700">
                        {idx + 1}. {q.question_text}
                      </div>
                    ))}
                    {slot.questions.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{slot.questions.length - 3} more questions
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FolderOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-2">No question slots yet</p>
          <p className="text-sm text-gray-400 mb-6">Create a slot to add questions</p>
          <div className="flex justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsManualModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Manual Slot
            </Button>
            <Button onClick={() => setIsGenerateModalOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Auto-Generate Questions
            </Button>
          </div>
        </div>
      )}

      <QuestionSlotModal
        isOpen={isManualModalOpen || !!slotToEdit}
        onClose={() => {
          setIsManualModalOpen(false);
          setSlotToEdit(null);
        }}
        projectId={projectId}
        existingSlot={slotToEdit}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['question-slots', projectId] });
        }}
      />

      <GenerateQuestionsModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        projectId={projectId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['question-slots', projectId] });
        }}
      />

      <ConfirmDialog
        isOpen={!!slotToDelete}
        onClose={() => setSlotToDelete(null)}
        onConfirm={() => slotToDelete && deleteMutation.mutate(slotToDelete.id)}
        title="Delete Question Slot"
        message={`Are you sure you want to delete "${slotToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function EvaluationTab({ projectId }: { projectId: string }) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-primary-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Play className="h-10 w-10 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Run Evaluation</h3>
          <p className="text-gray-600 mb-6">
            Test your AI agent against your question slots and evaluate its performance across multiple traits.
          </p>
          <Button size="lg" onClick={() => setIsWizardOpen(true)}>
            <Play className="h-5 w-5 mr-2" />
            Start Evaluation Wizard
          </Button>
        </div>
      </div>

      <EvaluationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        projectId={projectId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['evaluations', projectId] });
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

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Spinner />
      ) : evaluations && evaluations.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Started At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evaluations.map((evaluation) => (
                <tr key={evaluation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(evaluation.started_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      evaluation.status === 'completed' ? 'bg-green-100 text-green-800' :
                      evaluation.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {evaluation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {evaluation.overall_score?.toFixed(1) || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedEvaluationId(evaluation.id)}
                      disabled={evaluation.status !== 'completed'}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <HistoryIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-2">No evaluations yet</p>
          <p className="text-sm text-gray-400">Run an evaluation to see results</p>
        </div>
      )}

      <EvaluationDetailsModal
        isOpen={!!selectedEvaluationId}
        onClose={() => setSelectedEvaluationId(null)}
        evaluationId={selectedEvaluationId || ''}
      />
    </div>
  );
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const tabs = [
    { id: 'overview', label: 'Overview', content: <OverviewTab projectId={projectId} /> },
    { id: 'prompts', label: 'Prompts', content: <PromptsTab projectId={projectId} /> },
    { id: 'slots', label: 'Question Slots', content: <QuestionSlotsTab projectId={projectId} /> },
    { id: 'evaluate', label: 'Run Evaluation', content: <EvaluationTab projectId={projectId} /> },
    { id: 'history', label: 'History', content: <HistoryTab projectId={projectId} /> },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <Link href="/home" className="hover:text-gray-700">Home</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900">{project?.name || 'Project'}</span>
          </div>

          {/* Header */}
          {isLoading ? (
            <Spinner />
          ) : project ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 mt-2">{project.endpoint_url}</p>
              </div>

              {/* Tabs */}
              <Tabs tabs={tabs} defaultTab="overview" />
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500">Project not found</p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Made with Bob
