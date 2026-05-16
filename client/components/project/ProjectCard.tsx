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
    <Card hover onClick={handleCardClick} className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {project.name}
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <ExternalLink className="h-3 w-3 mr-1" />
              <span className="truncate">{truncate(project.endpoint_url, 40)}</span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center text-xs text-gray-500 space-x-4">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Created {formatDate(project.created_at)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">-</div>
            <div className="text-xs text-gray-500">Prompts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">-</div>
            <div className="text-xs text-gray-500">Slots</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">-</div>
            <div className="text-xs text-gray-500">Evaluations</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-4 border-t border-gray-200">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={() => router.push(`/project/${project.id}`)}
          >
            <Settings className="h-4 w-4 mr-1" />
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
