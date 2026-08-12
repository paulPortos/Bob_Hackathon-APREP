'use client';

import Link from 'next/link';
import { Project } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowUpRight,
  CalendarDays,
  Globe2,
  LockKeyhole,
  Trash2,
  Webhook,
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onDelete: (project: Project) => void;
  onOpen?: (project: Project) => void;
}

export default function ProjectCard({ project, onDelete, onOpen }: ProjectCardProps) {
  return (
    <article
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5"
      data-tour-project-id={project.id}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <Webhook className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <button
          type="button"
          onClick={() => onDelete(project)}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
          aria-label={`Delete ${project.name}`}
          title="Delete project"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>

      <Link
        href={`/project/${project.id}`}
        className="mt-5 flex flex-1 flex-col rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-4"
        data-tour="open-project"
        onClick={() => onOpen?.(project)}
      >
        <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">
          {project.name}
        </h2>
        <div className="mt-2 flex min-w-0 items-center gap-2 text-sm text-slate-500">
          <Globe2 className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          <span className="truncate" title={project.endpoint_url}>{project.endpoint_url}</span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {project.requires_token ? (
              <LockKeyhole className="h-3.5 w-3.5" strokeWidth={1.8} />
            ) : (
              <Globe2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            )}
            {project.requires_token ? 'Protected endpoint' : 'Public endpoint'}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5 text-sm">
          <span className="flex items-center gap-1.5 text-slate-500">
            <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
            {formatDate(project.created_at)}
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-900 transition-colors group-hover:text-sky-700">
            Open
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
          </span>
        </div>
      </Link>
    </article>
  );
}

// Made with Bob
