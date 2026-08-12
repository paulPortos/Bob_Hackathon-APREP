'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import HomeTutorial, {
  isProjectSetupTutorialStep,
  type HomeTutorialStep,
} from '@/components/home/HomeTutorial';
import ProjectCard from '@/components/project/ProjectCard';
import CreateProjectModal from '@/components/project/CreateProjectModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Project, CreateProjectRequest } from '@/types';
import { FolderPlus, Plus, RefreshCw } from 'lucide-react';

const HOME_TUTORIAL_DISMISSED_KEY = 'aprep.homeTutorial.dismissed.v4';

export default function HomePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<HomeTutorialStep>('create');
  const [tutorialCheckedForUser, setTutorialCheckedForUser] = useState<string | null>(null);
  const [guidedProjectId, setGuidedProjectId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const tutorialUserKey = user?.id || user?.email.toLowerCase();
  const tutorialStorageKey = tutorialUserKey
    ? `${HOME_TUTORIAL_DISMISSED_KEY}.${tutorialUserKey}`
    : null;

  const { data: projects, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.getProjects(),
  });

  useEffect(() => {
    if (
      !tutorialUserKey ||
      !tutorialStorageKey ||
      tutorialCheckedForUser === tutorialUserKey ||
      isLoading ||
      isError
    ) {
      return;
    }

    setTutorialCheckedForUser(tutorialUserKey);
    if (window.localStorage.getItem(tutorialStorageKey) !== 'true') {
      setTutorialStep((projects?.length ?? 0) >= 2 ? 'open' : 'create');
      setIsTutorialOpen(true);
    }
  }, [isError, isLoading, projects?.length, tutorialCheckedForUser, tutorialStorageKey, tutorialUserKey]);

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectRequest) => apiClient.createProject(data),
    onSuccess: (project) => {
      queryClient.setQueryData<Project[]>(['projects'], (current = []) => [
        project,
        ...current.filter((item) => item.id !== project.id),
      ]);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
      setIsCreateModalOpen(false);
      if (isTutorialOpen) {
        setGuidedProjectId(project.id);
        setTutorialStep('open');
      }
    },
    onError: (error) => {
      if (isTutorialOpen && tutorialStep === 'submit') {
        setTutorialStep('endpoint');
      }
      toast.error(getApiErrorMessage(error, 'Failed to create project'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
      setProjectToDelete(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete project'));
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

  const handleOpenCreateProject = () => {
    setIsCreateModalOpen(true);
    if (isTutorialOpen && tutorialStep === 'create') {
      setTutorialStep('project-name');
    }
  };

  const handleCloseCreateProject = () => {
    setIsCreateModalOpen(false);
    if (isTutorialOpen && isProjectSetupTutorialStep(tutorialStep) && !guidedProjectId) {
      setTutorialStep('create');
    }
  };

  const handleTutorialClose = (doNotShowAgain: boolean) => {
    if (doNotShowAgain && tutorialStorageKey) {
      window.localStorage.setItem(tutorialStorageKey, 'true');
    }
    setGuidedProjectId(null);
    setIsTutorialOpen(false);
  };

  const handleTutorialComplete = () => {
    if (tutorialStorageKey) {
      window.localStorage.setItem(tutorialStorageKey, 'true');
    }
    setGuidedProjectId(null);
    setIsTutorialOpen(false);
  };

  const handleProjectOpen = (project: Project) => {
    if (
      isTutorialOpen &&
      tutorialStep === 'open' &&
      (!guidedProjectId || guidedProjectId === project.id)
    ) {
      handleTutorialComplete();
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50/70">
        <Navbar onCreateProject={handleOpenCreateProject} />

        <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:px-12">
          <header className="mb-8">
            <div>
              <p className="text-sm font-medium text-sky-700">Workspace</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Projects
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Connect your agents, run evaluations, and review results in one place.
              </p>
            </div>
          </header>

          {isLoading && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading projects">
              {[0, 1].map((item) => (
                <div key={item} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="h-10 w-10 rounded-xl bg-slate-100" />
                  <div className="mt-5 h-5 w-2/5 rounded bg-slate-100" />
                  <div className="mt-3 h-4 w-4/5 rounded bg-slate-100" />
                  <div className="mt-8 h-7 w-36 rounded-full bg-slate-100" />
                  <div className="mt-7 h-px bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && isError && (
            <div className="rounded-2xl border border-red-200 bg-white px-6 py-12 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Projects could not be loaded</h2>
              <p className="mt-2 text-sm text-slate-600">Check your connection, then try again.</p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Try again
              </button>
            </div>
          )}

          {!isLoading && !isError && projects?.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm sm:py-20">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <FolderPlus className="h-7 w-7" strokeWidth={1.7} />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
                Create your first project
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Add an agent endpoint to start preparing questions and running evaluations.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateProject}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                data-tour="new-project"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                New project
              </button>
            </div>
          )}

          {!isLoading && !isError && projects && projects.length > 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={setProjectToDelete}
                  onOpen={handleProjectOpen}
                />
              ))}
            </div>
          )}
        </main>

        <HomeTutorial
          isOpen={isTutorialOpen}
          step={tutorialStep}
          highlightedProjectId={guidedProjectId}
          onClose={handleTutorialClose}
        />

        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateProject}
          onSubmit={handleCreateProject}
          tutorialStep={isTutorialOpen ? tutorialStep : null}
          onTutorialStepChange={setTutorialStep}
        />

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
