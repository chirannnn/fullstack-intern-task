import { forwardRef, useId, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

const inputBase =
  'block h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-zinc-900 shadow-sm transition-colors ' +
  'placeholder:text-zinc-400 focus:outline-none focus:ring-4 disabled:bg-zinc-50 disabled:text-zinc-500';

const inputState = (hasError) =>
  hasError
    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
    : 'border-zinc-300 hover:border-zinc-400 focus:border-brand-500 focus:ring-brand-100';

/**
 * Labelled text input with an accessible error message. Works with react-hook-form's
 * `register()` because the ref and handlers are forwarded to the <input>.
 */
export const FormField = forwardRef(function FormField(
  { label, error, hint, type = 'text', className, id: idProp, ...inputProps },
  ref,
) {
  const generatedId = useId();
  const id = idProp || generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-800">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(inputBase, inputState(Boolean(error)), isPassword && 'pr-11')}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-zinc-500 transition-colors hover:text-zinc-800"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-zinc-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});
