'use client';

import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Project } from '@/types';
import { formatDate, truncate } from '@/lib/utils';
import { ExternalLink, Settings, Trash2, Calendar } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onDelete: (project: Project) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/project/${project.id}`);
  };

  return (
    <Card hover onClick={handleCardClick} className="p-8 h-full flex flex-col">
      <div className="space-y-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
              {project.name}
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{truncate(project.endpoint_url, 45)}</span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Created {formatDate(project.created_at)}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 py-6 border-y border-gray-200 flex-1">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">-</div>
            <div className="text-sm text-gray-500 font-medium">Prompts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">-</div>
            <div className="text-sm text-gray-500 font-medium">Slots</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">-</div>
            <div className="text-sm text-gray-500 font-medium">Evaluations</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={() => router.push(`/project/${project.id}`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Made with Bob
