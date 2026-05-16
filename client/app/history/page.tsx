'use client';

import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import Spinner from '@/components/ui/Spinner';
import { apiClient } from '@/lib/api';
import { History as HistoryIcon } from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  // Fetch all projects first
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.getProjects(),
  });

  // Fetch evaluations for all projects
  const { data: allEvaluations, isLoading: evaluationsLoading } = useQuery({
    queryKey: ['all-evaluations'],
    queryFn: async () => {
      if (!projects) return [];
      const evaluationsPromises = projects.map(project =>
        apiClient.getEvaluations(project.id).then(evals =>
          evals.map(e => ({ ...e, projectName: project.name }))
        )
      );
      const results = await Promise.all(evaluationsPromises);
      return results.flat().sort((a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
    },
    enabled: !!projects,
  });

  const isLoading = projectsLoading || evaluationsLoading;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Evaluation History</h1>
            <p className="text-gray-600 mt-2">
              View all evaluations across all projects
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!allEvaluations || allEvaluations.length === 0) && (
            <div className="text-center py-20">
              <HistoryIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No evaluations yet
              </h3>
              <p className="text-gray-600 mb-6">
                Run an evaluation on a project to see results here
              </p>
            </div>
          )}

          {/* Evaluations Table */}
          {!isLoading && allEvaluations && allEvaluations.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overall Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allEvaluations.map((evaluation: any) => (
                    <tr key={evaluation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/project/${evaluation.project_id}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          {evaluation.projectName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(evaluation.started_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            evaluation.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : evaluation.status === 'running'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {evaluation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {evaluation.overall_score
                          ? `${evaluation.overall_score.toFixed(1)}%`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-primary-600 hover:text-primary-700 font-medium">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Made with Bob
