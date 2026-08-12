'use client';

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  FolderPlus,
  KeyRound,
  Link2,
  MessageSquareReply,
  MousePointerClick,
  Rocket,
  Send,
  ShieldCheck,
  Type,
  X,
} from 'lucide-react';

export type HomeTutorialStep =
  | 'create'
  | 'project-name'
  | 'endpoint'
  | 'authentication'
  | 'token'
  | 'request-template'
  | 'response-path'
  | 'submit'
  | 'open';

const PROJECT_SETUP_STEPS: readonly HomeTutorialStep[] = [
  'project-name',
  'endpoint',
  'authentication',
  'token',
  'request-template',
  'response-path',
  'submit',
];

export function isProjectSetupTutorialStep(step: HomeTutorialStep) {
  return PROJECT_SETUP_STEPS.includes(step);
}

interface TargetRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

interface HomeTutorialProps {
  isOpen: boolean;
  step: HomeTutorialStep;
  highlightedProjectId: string | null;
  onClose: (doNotShowAgain: boolean) => void;
}

const stepContent = {
  create: {
    progress: 'Step 1 of 3',
    title: 'Create an evaluation project',
    description:
      'A project keeps one agent’s connection settings, test questions, and evaluation history together.',
    action: 'Required: click New project',
    icon: FolderPlus,
  },
  'project-name': {
    progress: 'Step 2 of 3 · Project name',
    title: 'Give the agent a clear name',
    description:
      'A recognizable name makes it easier to distinguish agents when you review projects and evaluation history.',
    action: 'Click the project name field',
    icon: Type,
  },
  endpoint: {
    progress: 'Step 2 of 3 · Endpoint URL',
    title: 'Connect a hosted endpoint',
    description:
      'APREP’s deployed server sends test questions to this URL. It must be public HTTPS—localhost points back to the APREP server, not your computer.',
    action: 'Enter a public HTTPS endpoint',
    icon: Link2,
  },
  authentication: {
    progress: 'Step 2 of 3 · Authentication',
    title: 'Choose how APREP connects',
    description:
      'This tells APREP whether it must include a secret token when it calls your agent endpoint.',
    action: 'Choose whether the endpoint needs a token',
    icon: ShieldCheck,
  },
  token: {
    progress: 'Step 2 of 3 · Access token',
    title: 'Provide the endpoint token',
    description:
      'APREP uses this secret only to authorize requests to your agent and stores it encrypted at rest.',
    action: 'Enter the endpoint access token',
    icon: KeyRound,
  },
  'request-template': {
    progress: 'Step 2 of 3 · Request body',
    title: 'Match the complete request',
    description:
      'The template lets APREP speak your API’s format, including nested objects and arrays. {{message}} marks where each test question belongs.',
    action: 'Review or edit the request template',
    icon: Send,
  },
  'response-path': {
    progress: 'Step 2 of 3 · Answer path',
    title: 'Point APREP to the answer',
    description:
      'The path follows nested response objects and arrays so APREP extracts the actual agent answer instead of requiring a special response shape.',
    action: 'Enter the path to the answer',
    icon: MessageSquareReply,
  },
  submit: {
    progress: 'Step 2 of 3 · Save project',
    title: 'Save the API contract',
    description:
      'Saving keeps the endpoint, authentication choice, request template, and answer path together for every evaluation run.',
    action: 'Required: click Create project',
    icon: CheckCircle2,
  },
  open: {
    progress: 'Step 3 of 3',
    title: 'Open your project',
    description:
      'The project workspace is where you prepare prompts and questions, run evaluations, and inspect the results.',
    action: 'Required: open the project card',
    icon: Rocket,
  },
} satisfies Record<HomeTutorialStep, {
  progress: string;
  title: string;
  description: string;
  action: string;
  icon: typeof FolderPlus;
}>;

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
}

function getVisibleElement(selector: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).find(isVisible) ?? null;
}

export default function HomeTutorial({
  isOpen,
  step,
  highlightedProjectId,
  onClose,
}: HomeTutorialProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const wasOpen = useRef(false);

  const actionSelector = useMemo(() => {
    if (step === 'create') return '[data-tour="new-project"]';
    if (step === 'submit') return '[data-tour="submit-project"]';
    if (highlightedProjectId) {
      if (step === 'open') {
        return `[data-tour-project-id="${highlightedProjectId}"] [data-tour="open-project"]`;
      }
    }
    if (step === 'open') return '[data-tour="open-project"]';
    return `[data-tour="${step}"]`;
  }, [highlightedProjectId, step]);
  const spotlightSelector = actionSelector;

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setDoNotShowAgain(false);
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    const settleTimers: ReturnType<typeof setTimeout>[] = [];
    let observedTarget: HTMLElement | null = null;
    const resizeObserver = new ResizeObserver(() => updateTarget());
    const updateTarget = () => {
      const target = getVisibleElement(spotlightSelector);
      if (!target) {
        if (observedTarget) resizeObserver.unobserve(observedTarget);
        observedTarget = null;
        setTargetRect(null);
        return;
      }

      if (observedTarget !== target) {
        if (observedTarget) resizeObserver.unobserve(observedTarget);
        observedTarget = target;
        resizeObserver.observe(target);
      }

      const rect = target.getBoundingClientRect();
      const nextRect = {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
      setTargetRect((current) => {
        if (
          current &&
          Math.abs(current.top - nextRect.top) < 0.5 &&
          Math.abs(current.left - nextRect.left) < 0.5 &&
          Math.abs(current.width - nextRect.width) < 0.5 &&
          Math.abs(current.height - nextRect.height) < 0.5
        ) {
          return current;
        }
        return nextRect;
      });
    };

    const target = getVisibleElement(spotlightSelector);
    if (target) {
      const rect = target.getBoundingClientRect();
      if (rect.top < 16 || rect.bottom > window.innerHeight - 16) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        scrollTimer = setTimeout(updateTarget, 350);
      }
    }

    updateTarget();
    [60, 140, 240, 380].forEach((delay) => {
      settleTimers.push(setTimeout(updateTarget, delay));
    });
    const observer = new MutationObserver(updateTarget);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);

    return () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      settleTimers.forEach(clearTimeout);
      resizeObserver.disconnect();
      observer.disconnect();
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [isOpen, spotlightSelector]);

  useEffect(() => {
    if (!isOpen) return;

    const guardTutorialStep = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('[data-tour-guide]')) return;

      const allowedTarget = getVisibleElement(spotlightSelector);
      if (!allowedTarget || !allowedTarget.contains(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('click', guardTutorialStep, true);
    return () => document.removeEventListener('click', guardTutorialStep, true);
  }, [isOpen, spotlightSelector]);

  if (!isOpen) return null;

  const content = stepContent[step];
  const Icon = content.icon;
  const padding = step === 'project-name' ? 10 : 8;
  const tooltipWidth = Math.min(340, window.innerWidth - 32);
  const tooltipHeight = 300;
  const gap = 18;
  let tooltipStyle: CSSProperties = {
    width: tooltipWidth,
    left: Math.max(16, (window.innerWidth - tooltipWidth) / 2),
    top: Math.max(16, (window.innerHeight - tooltipHeight) / 2),
  };

  if (targetRect) {
    const hasRoomBelow = targetRect.bottom + gap + tooltipHeight <= window.innerHeight - 16;
    const hasRoomRight = targetRect.right + gap + tooltipWidth <= window.innerWidth - 16;
    const hasRoomLeft = targetRect.left - gap - tooltipWidth >= 16;

    if (step === 'create' && hasRoomBelow) {
      tooltipStyle = {
        width: tooltipWidth,
        top: targetRect.bottom + gap,
        left: Math.min(
          Math.max(16, targetRect.right - tooltipWidth),
          window.innerWidth - tooltipWidth - 16
        ),
      };
    } else if (hasRoomRight) {
      tooltipStyle = {
        width: tooltipWidth,
        top: Math.min(
          Math.max(16, targetRect.top),
          window.innerHeight - tooltipHeight - 16
        ),
        left: targetRect.right + gap,
      };
    } else if (hasRoomLeft) {
      tooltipStyle = {
        width: tooltipWidth,
        top: Math.min(
          Math.max(16, targetRect.top),
          window.innerHeight - tooltipHeight - 16
        ),
        left: targetRect.left - tooltipWidth - gap,
      };
    } else {
      tooltipStyle = {
        width: tooltipWidth,
        left: Math.max(16, (window.innerWidth - tooltipWidth) / 2),
        top: hasRoomBelow
          ? targetRect.bottom + gap
          : Math.max(16, targetRect.top - tooltipHeight - gap),
      };
    }
  }

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none" aria-live="polite">
      {targetRect && (
        <div
          className="fixed rounded-xl border-2 border-sky-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.66)] transition-all duration-200"
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
        className="pointer-events-auto fixed z-[71] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/25"
        style={tooltipStyle}
        role="dialog"
        aria-label="Interactive setup guide"
        data-tour-guide
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <button
            type="button"
            onClick={() => onClose(doNotShowAgain)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Exit guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
          {content.progress}
        </p>
        <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-950">
          {content.title}
        </h2>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Why this matters
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{content.description}</p>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-700">
          <MousePointerClick className="h-4 w-4 text-sky-700" strokeWidth={1.8} />
          {targetRect ? content.action : 'Waiting for the highlighted control'}
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={doNotShowAgain}
            onChange={(event) => setDoNotShowAgain(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          Do not show this guide again
        </label>
      </aside>
    </div>
  );
}
