'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { apiClient } from '@/lib/api';
import { getScoreColor, getScoreBgColor } from '@/lib/constants';
import { Download, FileJson, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface EvaluationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationId: string;
}

export default function EvaluationDetailsModal({
  isOpen,
  onClose,
  evaluationId,
}: EvaluationDetailsModalProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: evaluation, isLoading } = useQuery({
    queryKey: ['evaluation', evaluationId],
    queryFn: () => apiClient.getEvaluation(evaluationId),
    enabled: isOpen && !!evaluationId,
  });

  const handleExportJSON = async () => {
    try {
      const blob = await apiClient.exportEvaluationJSON(evaluationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluation-${evaluationId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('JSON exported successfully!');
    } catch (error) {
      toast.error('Failed to export JSON');
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await apiClient.exportEvaluationCSV(evaluationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluation-${evaluationId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV exported successfully!');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (!isOpen) return null;

  const radarData = evaluation ? [
    { trait: 'Accuracy', score: evaluation.results.reduce((sum, r) => sum + r.accuracy_score, 0) / evaluation.results.length },
    { trait: 'Security', score: evaluation.results.reduce((sum, r) => sum + r.security_score, 0) / evaluation.results.length },
    { trait: 'Honesty', score: evaluation.results.reduce((sum, r) => sum + r.honesty_score, 0) / evaluation.results.length },
    { trait: 'Speed', score: evaluation.results.reduce((sum, r) => sum + r.speed_score, 0) / evaluation.results.length },
    { trait: 'Adherence', score: evaluation.results.reduce((sum, r) => sum + r.prompt_adherence_score, 0) / evaluation.results.length },
    { trait: 'Semantic', score: evaluation.results.reduce((sum, r) => sum + r.semantic_accuracy_score, 0) / evaluation.results.length },
  ] : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Evaluation Details" size="full">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : evaluation ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  Evaluation Results
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  evaluation.status === 'completed' ? 'bg-green-100 text-green-800' :
                  evaluation.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {evaluation.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Started: {new Date(evaluation.started_at).toLocaleString()}
                {evaluation.completed_at && ` • Completed: ${new Date(evaluation.completed_at).toLocaleString()}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary-600">
                {evaluation.overall_score?.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportJSON}>
              <FileJson className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Trait Scores Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="trait" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Average Trait Scores</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={radarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trait" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommendation */}
          {evaluation.recommendation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Recommendation</h3>
              <p className="text-sm text-blue-800">{evaluation.recommendation}</p>
            </div>
          )}

          {/* Results Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Detailed Results</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Security</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Honesty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Speed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time (ms)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {evaluation.results.map((result) => (
                    <>
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {result.question_text}
                          {result.is_trait_test && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                              {result.trait_type}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(result.accuracy_score)}`}>
                            {result.accuracy_score.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(result.security_score)}`}>
                            {result.security_score.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(result.honesty_score)}`}>
                            {result.honesty_score.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(result.speed_score)}`}>
                            {result.speed_score.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {result.response_time_ms}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => toggleRow(result.id)}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {expandedRows.has(result.id) ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(result.id) && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Agent Answer:</span>
                                <p className="text-gray-900 mt-1">{result.agent_answer}</p>
                              </div>
                              {result.score_explanation && (
                                <div>
                                  <span className="font-medium text-gray-700">Explanation:</span>
                                  <p className="text-gray-600 mt-1">{result.score_explanation}</p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                  <span className="font-medium text-gray-700">Prompt Adherence:</span>
                                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getScoreColor(result.prompt_adherence_score)}`}>
                                    {result.prompt_adherence_score.toFixed(0)}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Semantic Accuracy:</span>
                                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getScoreColor(result.semantic_accuracy_score)}`}>
                                    {result.semantic_accuracy_score.toFixed(0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Evaluation not found
        </div>
      )}
    </Modal>
  );
}

// Made with Bob