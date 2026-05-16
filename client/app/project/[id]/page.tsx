'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import { apiClient } from '@/lib/api';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Tab components (simplified versions)
function OverviewTab({ projectId }: { projectId: string }) {
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiClient.getProject(projectId),
  });

  if (!project) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Project Information</h3>
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
          <div className="text-3xl font-bold text-primary-600">0</div>
          <div className="text-sm text-gray-500 mt-1">Total Prompts</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-primary-600">0</div>
          <div className="text-sm text-gray-500 mt-1">Question Slots</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-primary-600">0</div>
          <div className="text-sm text-gray-500 mt-1">Evaluations</div>
        </div>
      </div>
    </div>
  );
}

function PromptsTab({ projectId }: { projectId: string }) {
  const { data: prompt, isLoading } = useQuery({
    queryKey: ['prompt', projectId],
    queryFn: () => apiClient.getPrompt(projectId),
    retry: false,
  });

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Spinner />
      ) : prompt ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Current Prompt</h3>
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
          <p className="text-gray-500">No prompt uploaded yet</p>
          <p className="text-sm text-gray-400 mt-2">Upload a prompt to get started</p>
        </div>
      )}
    </div>
  );
}

function QuestionSlotsTab({ projectId }: { projectId: string }) {
  const { data: slots, isLoading } = useQuery({
    queryKey: ['question-slots', projectId],
    queryFn: () => apiClient.getQuestionSlots(projectId),
  });

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Spinner />
      ) : slots && slots.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {slots.map((slot) => (
            <div key={slot.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold">{slot.name}</h3>
              {slot.description && (
                <p className="text-sm text-gray-600 mt-1">{slot.description}</p>
              )}
              <div className="mt-4 text-sm text-gray-500">
                {slot.questions.length} questions
                {slot.is_auto_generated && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    AI Generated
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No question slots yet</p>
          <p className="text-sm text-gray-400 mt-2">Create a slot to add questions</p>
        </div>
      )}
    </div>
  );
}

function EvaluationTab({ projectId }: { projectId: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <p className="text-gray-500">Evaluation wizard coming soon</p>
      <p className="text-sm text-gray-400 mt-2">
        Configure and run evaluations on your AI agent
      </p>
    </div>
  );
}

function HistoryTab({ projectId }: { projectId: string }) {
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evaluations.map((evaluation) => (
                <tr key={evaluation.id}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No evaluations yet</p>
          <p className="text-sm text-gray-400 mt-2">Run an evaluation to see results</p>
        </div>
      )}
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
