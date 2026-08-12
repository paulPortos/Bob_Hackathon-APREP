'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  FileText,
  Loader2,
  PenLine,
  Upload,
  X,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import type { Prompt } from '@/types';

const MAX_PROMPT_CHARACTERS = 100_000;
const MAX_FILE_BYTES = 256 * 1024;
const ACCEPTED_FILE_TYPES = ['txt', 'md'] as const;

const promptSchema = z.object({
  content: z
    .string()
    .trim()
    .min(10, 'Add at least 10 characters of prompt content')
    .max(MAX_PROMPT_CHARACTERS, 'Prompt content is too long'),
  file_type: z.enum(ACCEPTED_FILE_TYPES),
});

type PromptFormData = z.infer<typeof promptSchema>;

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingPrompt?: Prompt | null;
  onSuccess: () => void;
}

function getFileType(fileName: string): PromptFormData['file_type'] | null {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension === 'txt' || extension === 'md' ? extension : null;
}

function formatFileSize(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : `${Math.ceil(bytes / 1024)} KB`;
}

export default function PromptModal({
  isOpen,
  onClose,
  projectId,
  existingPrompt,
  onSuccess,
}: PromptModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      content: existingPrompt?.content || '',
      file_type: existingPrompt?.file_type || 'txt',
    },
  });

  const content = watch('content') || '';
  const fileType = watch('file_type');

  useEffect(() => {
    if (!isOpen) return;
    reset({
      content: existingPrompt?.content || '',
      file_type: existingPrompt?.file_type || 'txt',
    });
    setSelectedFile(null);
    setFileError(null);
    setIsDragging(false);
  }, [existingPrompt, isOpen, reset]);

  const extractFileContent = async (file: File) => {
    const detectedType = getFileType(file.name);
    setFileError(null);

    if (!detectedType) {
      setFileError('Choose a .txt or .md file');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError('File must be 256 KB or smaller');
      return;
    }

    setIsReadingFile(true);
    try {
      const extractedContent = (await file.text()).replace(/^\uFEFF/, '');
      if (extractedContent.includes('\u0000')) {
        setFileError('This file does not appear to contain plain text');
        return;
      }
      if (extractedContent.length > MAX_PROMPT_CHARACTERS) {
        setFileError('Extracted content exceeds 100,000 characters');
        return;
      }
      if (!extractedContent.trim()) {
        setFileError('The selected file is empty');
        return;
      }

      setSelectedFile(file);
      setValue('file_type', detectedType, { shouldDirty: true, shouldValidate: true });
      setValue('content', extractedContent, { shouldDirty: true, shouldValidate: true });
    } catch {
      setFileError('The file could not be read');
    } finally {
      setIsReadingFile(false);
    }
  };

  const onSubmit = async (data: PromptFormData) => {
    setIsSubmitting(true);
    try {
      await apiClient.createOrUpdatePrompt(projectId, data);
      toast.success(existingPrompt ? 'Prompt updated' : 'Prompt added');
      onSuccess();
      onClose();
      reset();
      setSelectedFile(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save prompt'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting || isReadingFile) return;
    reset();
    setSelectedFile(null);
    setFileError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={existingPrompt ? 'Edit agent prompt' : 'Add agent prompt'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <p className="text-sm leading-6 text-slate-500">
          Import a text file or write the instructions directly, then review the content before saving.
        </p>

        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-sky-700" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold text-slate-800">Import from file</h3>
            </div>
            <span className="text-xs text-slate-400">TXT or MD · max 256 KB</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void extractFileContent(file);
              event.currentTarget.value = '';
            }}
          />

          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsDragging(false);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) void extractFileContent(file);
            }}
            className={`rounded-2xl border border-dashed px-4 py-5 transition ${
              isDragging
                ? 'border-sky-500 bg-sky-50 ring-4 ring-sky-100'
                : fileError
                  ? 'border-red-300 bg-red-50/50'
                  : 'border-slate-300 bg-slate-50/70 hover:border-slate-400'
            }`}
          >
            {selectedFile ? (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{selectedFile.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatFileSize(selectedFile.size)} · content extracted
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setValue('content', '', { shouldDirty: true, shouldValidate: true });
                  }}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  aria-label="Remove imported file and extracted content"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm">
                  {isReadingFile ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5" strokeWidth={1.8} />
                  )}
                </span>
                <p className="mt-3 text-sm font-medium text-slate-700">
                  {isReadingFile ? 'Reading file…' : 'Drop a prompt file here'}
                </p>
                {!isReadingFile && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-sm font-semibold text-sky-700 hover:text-sky-800 focus:outline-none focus:underline"
                  >
                    Choose a file
                  </button>
                )}
              </div>
            )}
          </div>
          {fileError && <p className="mt-2 text-xs font-medium text-red-600">{fileError}</p>}
        </section>

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Review or write manually
          </span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <section>
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <PenLine className="h-4 w-4 text-sky-700" strokeWidth={1.8} />
              <label htmlFor="prompt-content" className="text-sm font-semibold text-slate-800">
                Prompt content
              </label>
            </div>
            <div className="inline-flex self-start rounded-xl bg-slate-100 p-1" aria-label="Content format">
              {ACCEPTED_FILE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('file_type', type, { shouldDirty: true })}
                  aria-pressed={fileType === type}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition ${
                    fileType === type
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="prompt-content"
            {...register('content')}
            rows={8}
            className={`h-52 w-full resize-none overflow-y-auto rounded-2xl border bg-slate-950 px-4 py-3.5 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-4 sm:h-56 ${
              errors.content
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-700 focus:border-sky-500 focus:ring-sky-100'
            }`}
            placeholder="Describe the role, rules, tone, and expected behavior of your agent…"
            spellCheck={false}
          />
          <div className="mt-1.5 flex items-start justify-between gap-4">
            <div>
              {errors.content ? (
                <p className="text-xs font-medium text-red-600">{errors.content.message}</p>
              ) : (
                <p className="text-xs text-slate-400">You can edit extracted content before saving.</p>
              )}
            </div>
            <span
              className={`shrink-0 text-xs tabular-nums ${
                content.length > MAX_PROMPT_CHARACTERS ? 'font-semibold text-red-600' : 'text-slate-400'
              }`}
            >
              {content.length.toLocaleString()} / {MAX_PROMPT_CHARACTERS.toLocaleString()}
            </span>
          </div>
        </section>

        <div className="sticky bottom-0 -mx-1 flex items-center justify-end gap-3 border-t border-slate-100 bg-white/95 px-1 pt-4 backdrop-blur">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting || isReadingFile}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isReadingFile}
            className="rounded-xl bg-slate-950 px-5 hover:bg-slate-800 focus:ring-slate-500"
          >
            {existingPrompt ? 'Save changes' : 'Save prompt'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
