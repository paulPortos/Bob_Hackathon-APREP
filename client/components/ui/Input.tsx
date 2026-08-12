import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  labelAccessory?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, labelAccessory, id, type = 'text', ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = error || helperText ? `${inputId}-description` : undefined;

    return (
      <div className="w-full">
        {label && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
              {label}
            </label>
            {labelAccessory}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className={cn(
            'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300',
            className
          )}
          ref={ref}
          {...props}
        />
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

Input.displayName = 'Input';

export default Input;

// Made with Bob
