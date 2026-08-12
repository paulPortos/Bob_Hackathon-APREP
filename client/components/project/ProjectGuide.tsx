'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  History,
  LayoutDashboard,
  ListChecks,
  Play,
  X,
  type LucideIcon,
} from 'lucide-react';

export type ProjectGuideStep = 'overview' | 'prompts' | 'slots' | 'evaluate' | 'history';

interface GuideStepContent {
  id: ProjectGuideStep;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const PROJECT_GUIDE_STEPS: readonly GuideStepContent[] = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'Check the project setup',
    description:
      'Review the endpoint contract, authentication method, prompt status, test-question count, and previous runs before evaluating.',
    icon: LayoutDashboard,
  },
  {
    id: 'prompts',
    label: 'Prompt',
    title: 'Define intended behavior',
    description:
      'Save the instructions the agent is expected to follow. APREP uses them as context when measuring prompt adherence.',
    icon: FileText,
  },
  {
    id: 'slots',
    label: 'Questions',
    title: 'Build reusable test sets',
    description:
      'Group related questions into slots so you can run focused tests repeatedly and compare results consistently.',
    icon: ListChecks,
  },
  {
    id: 'evaluate',
    label: 'Evaluate',
    title: 'Run a controlled evaluation',
    description:
      'Choose a question slot and test options, then send each question to the configured agent endpoint for scoring.',
    icon: Play,
  },
  {
    id: 'history',
    label: 'History',
    title: 'Review progress over time',
    description:
      'Open completed reports, inspect scores, and compare past runs as the agent and its prompt improve.',
    icon: History,
  },
];

interface ProjectGuideProps {
  isOpen: boolean;
  stepIndex: number;
  onStepChange: (index: number) => void;
  onClose: () => void;
}

interface TargetRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

export default function ProjectGuide({
  isOpen,
  stepIndex,
  onStepChange,
  onClose,
}: ProjectGuideProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const step = PROJECT_GUIDE_STEPS[stepIndex] ?? PROJECT_GUIDE_STEPS[0];

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight' && stepIndex < PROJECT_GUIDE_STEPS.length - 1) {
        onStepChange(stepIndex + 1);
      }
      if (event.key === 'ArrowLeft' && stepIndex > 0) {
        onStepChange(stepIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onStepChange, stepIndex]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setTargetRect(null);
      return;
    }

    const target = document.querySelector<HTMLElement>(`[data-project-guide="${step.id}"]`);
    if (!target) {
      setTargetRect(null);
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

    const updateTarget = () => {
      const rect = target.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    const frame = window.requestAnimationFrame(updateTarget);
    const settleTimer = window.setTimeout(updateTarget, 350);
    const observer = new ResizeObserver(updateTarget);
    observer.observe(target);
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      observer.disconnect();
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [isOpen, step.id]);

  if (!isOpen) return null;

  const Icon = step.icon;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === PROJECT_GUIDE_STEPS.length - 1;
  const tooltipWidth = Math.min(380, (typeof window === 'undefined' ? 412 : window.innerWidth) - 32);
  const tooltipHeight = 280;
  const gap = 18;
  const padding = 7;

  let tooltipStyle: CSSProperties = {
    width: tooltipWidth,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  };

  if (targetRect && typeof window !== 'undefined') {
    const left = Math.min(
      Math.max(16, targetRect.left + targetRect.width / 2 - tooltipWidth / 2),
      window.innerWidth - tooltipWidth - 16
    );
    const hasRoomBelow = window.innerHeight - targetRect.bottom >= tooltipHeight + gap;

    tooltipStyle = {
      width: tooltipWidth,
      left,
      top: hasRoomBelow
        ? targetRect.bottom + gap
        : Math.max(16, targetRect.top - tooltipHeight - gap),
    };
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" aria-live="polite">
      {targetRect && (
        <div
          className="fixed rounded-xl border-2 border-sky-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.68)] transition-all duration-200"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
          }}
        >
          <span className="absolute -right-2 -top-2 h-4 w-4 animate-ping rounded-full bg-sky-400" />
          <span className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-sky-500" />
        </div>
      )}

      <aside
        className="pointer-events-auto fixed z-[81] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/25 sm:p-6"
        style={tooltipStyle}
        role="dialog"
        aria-label="Project navigation guide"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="Close project guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
          {stepIndex + 1} of {PROJECT_GUIDE_STEPS.length} · {step.label}
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{step.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => onStepChange(stepIndex - 1)}
            disabled={isFirst}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={() => (isLast ? onClose() : onStepChange(stepIndex + 1))}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            {isLast ? (
              <>
                Finish
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}
