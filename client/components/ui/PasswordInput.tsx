'use client';

import { forwardRef, InputHTMLAttributes, ReactNode, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helperText?: string;
  labelAccessory?: ReactNode;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, helperText, labelAccessory, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = error || helperText ? `${inputId}-description` : undefined;
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="w-full">
        <div className="mb-1.5 flex items-center gap-1.5">
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
          {labelAccessory}
        </div>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={isVisible ? 'text' : 'password'}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={descriptionId}
            className={cn(
              'w-full rounded-xl border bg-white px-3.5 py-2.5 pr-12 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
              error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300',
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setIsVisible((visible) => !visible)}
            disabled={disabled}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 disabled:cursor-not-allowed"
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isVisible}
          >
            {isVisible ? (
              <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </button>
        </div>
        {error && (
          <p id={descriptionId} className="mt-1.5 text-xs leading-5 text-red-600" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={descriptionId} className="mt-1.5 text-xs leading-5 text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
