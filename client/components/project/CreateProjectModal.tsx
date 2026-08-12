'use client';

import { CSSProperties, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bot,
  Braces,
  Globe2,
  Info,
  LockKeyhole,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import Button from '@/components/ui/Button';
import {
  getRequestTemplateError,
  SIMPLE_REQUEST_TEMPLATE,
} from '@/lib/agentContract';
import { validateHostedEndpointUrl } from '@/lib/utils';
import type { HomeTutorialStep } from '@/components/home/HomeTutorial';

const requestTemplateSchema = z
  .string()
  .trim()
  .superRefine((value, context) => {
    const error = getRequestTemplateError(value);
    if (error) context.addIssue({ code: z.ZodIssueCode.custom, message: error });
  });

const projectSchema = z
  .object({
    name: z.string().trim().max(120, 'Keep the project name under 120 characters').optional(),
    endpoint_url: z
      .string()
      .trim()
      .refine(validateHostedEndpointUrl, {
        message: 'Use a public HTTPS URL. Localhost and private network addresses are not reachable.',
      }),
    requires_token: z.boolean(),
    token: z.string().trim().max(4096, 'Token is too long').optional(),
    request_body_template: requestTemplateSchema,
    response_path: z
      .string()
      .trim()
      .min(1, 'Enter the path to the answer in the response')
      .max(512, 'Response path is too long'),
  })
  .superRefine((data, context) => {
    if (data.requires_token && !data.token) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['token'],
        message: 'Enter the token required by your endpoint',
      });
    }
  });

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  tutorialStep?: HomeTutorialStep | null;
  onTutorialStepChange?: (step: HomeTutorialStep) => void;
}

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  info: string;
}

function InfoTip({ text, align = 'left' }: { text: string; align?: 'left' | 'right' }) {
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});

  const showTooltip = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const width = Math.min(256, window.innerWidth - 24);
    const preferredLeft = align === 'right' ? rect.right - width : rect.left;
    const left = Math.min(Math.max(12, preferredLeft), window.innerWidth - width - 12);
    const placeAbove = rect.bottom + 140 > window.innerHeight;

    setPosition({
      width,
      left,
      top: placeAbove ? rect.top - 8 : rect.bottom + 8,
      transform: placeAbove ? 'translateY(-100%)' : undefined,
    });
    setIsOpen(true);
  };

  return (
    <span className="inline-flex shrink-0">
      <button
        ref={buttonRef}
        type="button"
        className="rounded-full text-slate-400 transition hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
        aria-label="More information"
        aria-describedby={tooltipId}
        aria-expanded={isOpen}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={showTooltip}
        onBlur={() => setIsOpen(false)}
        onClick={showTooltip}
      >
        <Info className="h-4 w-4" strokeWidth={1.8} />
      </button>
      {isOpen && typeof document !== 'undefined' && createPortal(
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none fixed z-[100] rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-normal leading-5 text-slate-100 shadow-xl"
          style={position}
        >
          {text}
        </span>,
        document.body
      )}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, info }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <InfoTip text={info} />
      </div>
    </div>
  );
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  tutorialStep,
  onTutorialStepChange,
}: CreateProjectModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      endpoint_url: '',
      requires_token: false,
      token: '',
      request_body_template: SIMPLE_REQUEST_TEMPLATE,
      response_path: 'answer',
    },
  });

  const requiresToken = watch('requires_token');
  const endpointRegistration = register('endpoint_url');
  const tokenRegistration = register('token');

  const advanceTutorial = (current: HomeTutorialStep, next: HomeTutorialStep) => {
    if (tutorialStep === current) onTutorialStepChange?.(next);
  };

  const handleFormSubmit = async (data: ProjectFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleInvalidForm = (formErrors: FieldErrors<ProjectFormData>) => {
    if (!tutorialStep || !onTutorialStepChange) return;

    const errorOrder: Array<[keyof ProjectFormData, HomeTutorialStep]> = [
      ['name', 'project-name'],
      ['endpoint_url', 'endpoint'],
      ['token', 'token'],
      ['request_body_template', 'request-template'],
      ['response_path', 'response-path'],
    ];
    const firstInvalidField = errorOrder.find(([field]) => Boolean(formErrors[field]));
    if (firstInvalidField) onTutorialStepChange(firstInvalidField[1]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const chooseAuthentication = (needsToken: boolean) => {
    setValue('requires_token', needsToken, { shouldDirty: true, shouldValidate: true });
    if (tutorialStep === 'authentication') {
      onTutorialStepChange?.(needsToken ? 'token' : 'request-template');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create project" size="lg">
      <form
        onSubmit={handleSubmit(handleFormSubmit, handleInvalidForm)}
        className="max-h-[calc(100svh-10rem)] space-y-5 overflow-y-auto px-1 pb-1 pr-2"
        data-tour="project-form"
      >
        <p className="text-sm text-slate-600">Connect a hosted agent API to begin evaluating it.</p>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
          <SectionHeader
            icon={Bot}
            title="Project details"
            info="Use a recognizable name so the agent is easy to find in project and evaluation history."
          />
          <div data-tour="project-name">
            <Input
              label="Project name (optional)"
              placeholder="Customer support agent"
              labelAccessory={<InfoTip text="Leave this blank and APREP will create a short default name." />}
              error={errors.name?.message}
              {...register('name')}
              onFocus={() => advanceTutorial('project-name', 'endpoint')}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <SectionHeader
            icon={Globe2}
            title="Agent connection"
            info="APREP calls this API from the deployed server whenever it runs an evaluation."
          />

          <div data-tour="endpoint">
            <Input
              label="Hosted endpoint URL"
              placeholder="https://agent.example.com/chat"
              labelAccessory={<InfoTip text="Use the exact route that accepts a question and returns the agent response." />}
              error={errors.endpoint_url?.message}
              {...endpointRegistration}
              onChange={(event) => {
                endpointRegistration.onChange(event);
                if (validateHostedEndpointUrl(event.target.value)) {
                  advanceTutorial('endpoint', 'authentication');
                }
              }}
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
            />

            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-900">
              <span>Public HTTPS only. Localhost will not work.</span>
              <InfoTip
                text="A deployed APREP server cannot reach localhost or your private network. Host the agent behind a public HTTPS domain and allow that hostname in the APREP deployment."
                align="right"
              />
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5" data-tour="authentication">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-500" strokeWidth={1.8} />
              <p className="text-sm font-medium text-slate-700">Does the endpoint require a token?</p>
              <InfoTip
                text="Choose a bearer token only when your agent API rejects unauthenticated requests."
                align="right"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Endpoint authentication">
              <button
                type="button"
                onClick={() => chooseAuthentication(false)}
                aria-pressed={!requiresToken}
                className={`rounded-xl border px-3.5 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-sky-100 ${
                  !requiresToken
                    ? 'border-sky-500 bg-sky-50 text-sky-950'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="block text-sm font-semibold">No token</span>
                <span className="mt-0.5 block text-xs">Public endpoint</span>
              </button>
              <button
                type="button"
                onClick={() => chooseAuthentication(true)}
                aria-pressed={requiresToken}
                className={`rounded-xl border px-3.5 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-sky-100 ${
                  requiresToken
                    ? 'border-sky-500 bg-sky-50 text-sky-950'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <LockKeyhole className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Bearer token
                </span>
                <span className="mt-0.5 block text-xs">Protected endpoint</span>
              </button>
            </div>
          </div>

          {requiresToken && (
            <div className="mt-4" data-tour="token">
              <PasswordInput
                label="Endpoint access token"
                placeholder="Paste the token issued by your agent service"
                labelAccessory={<InfoTip text="Stored encrypted and never returned by the API after saving." />}
                error={errors.token?.message}
                {...tokenRegistration}
                onChange={(event) => {
                  tokenRegistration.onChange(event);
                  if (event.target.value.trim()) {
                    advanceTutorial('token', 'request-template');
                  }
                }}
                autoComplete="off"
              />
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <SectionHeader
            icon={Braces}
            title="API format"
            info="APREP builds the exact JSON your API expects, then reads the answer from any nested response path."
          />

          <div className="space-y-4">
            <div data-tour="request-template">
              <div className="mb-1.5 flex items-center gap-1.5">
                <label htmlFor="request-body-template" className="text-sm font-medium text-slate-700">
                  Request JSON template
                </label>
                <InfoTip text="Write the complete request body. APREP safely replaces every {{message}} value with the current evaluation question." />
              </div>
              <textarea
                id="request-body-template"
                rows={7}
                className={`w-full resize-y rounded-xl border bg-slate-950 px-3.5 py-3 font-mono text-xs leading-5 text-cyan-100 outline-none transition focus:ring-4 ${
                  errors.request_body_template
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-700 focus:border-sky-500 focus:ring-sky-100'
                }`}
                spellCheck={false}
                {...register('request_body_template')}
                onFocus={() => advanceTutorial('request-template', 'response-path')}
              />
              {errors.request_body_template?.message && (
                <p className="mt-1.5 text-xs text-red-600">{errors.request_body_template.message}</p>
              )}
            </div>

            <div data-tour="response-path">
              <Input
                label="Answer path"
                placeholder="data.results[0].answer"
                labelAccessory={<InfoTip text="Follow the response from its root to the answer. Dot notation enters objects and [0] selects an array item." />}
                error={errors.response_path?.message}
                {...register('response_path')}
                onFocus={() => advanceTutorial('response-path', 'submit')}
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
          </div>
        </section>

        <div className="sticky bottom-0 -mx-1 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-1 pb-1 pt-4 backdrop-blur">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            data-tour="submit-project"
            className="rounded-xl bg-slate-950 px-5 hover:bg-slate-800 focus:ring-slate-500"
          >
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
