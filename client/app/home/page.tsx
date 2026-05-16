'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import ProjectCard from '@/components/project/ProjectCard';
import CreateProjectModal from '@/components/project/CreateProjectModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';
import { apiClient } from '@/lib/api';
import { Project, CreateProjectRequest } from '@/types';
import { FolderOpen } from 'lucide-react';

export default function HomePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.getProjects(),
  });

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProjectRequest) => apiClient.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully!');
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create project');
    },
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully!');
      setProjectToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete project');
    },
  });

  const handleCreateProject = async (data: CreateProjectRequest) => {
    await createMutation.mutateAsync(data);
  };

  const handleDeleteProject = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete.id);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar onCreateProject={() => setIsCreateModalOpen(true)} />

        <main className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-10">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900">My Projects</h1>
            <p className="text-lg text-gray-600 mt-3">
              Manage your AI agent evaluation projects
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-32">
              <Spinner size="lg" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && projects?.length === 0 && (
            <div className="text-center py-32">
              <FolderOpen className="mx-auto h-20 w-20 text-gray-400 mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                No projects yet
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Get started by creating your first project
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Create Project
              </button>
            </div>
          )}

          {/* Projects Grid */}
          {!isLoading && projects && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={setProjectToDelete}
                />
              ))}
            </div>
          )}
        </main>

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProject}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!projectToDelete}
          onClose={() => setProjectToDelete(null)}
          onConfirm={handleDeleteProject}
          title="Delete Project"
          message={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </ProtectedRoute>
  );
}

// Made with Bob
