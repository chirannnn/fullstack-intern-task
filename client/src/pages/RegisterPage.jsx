import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { FormAlert } from '../components/FormAlert';
import { getErrorMessage, getErrorStatus, getFieldErrors } from '../utils/errors';
import { registerSchema } from '../utils/validation';

const FIELDS = ['name', 'email', 'password'];

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const location = useLocation();
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ name, email, password }) => {
    setFormError(null);
    try {
      const user = await registerAccount({ name, email, password });
      toast.success(`Welcome, ${user.name.split(' ')[0]}! Your account is ready.`);
    } catch (error) {
      const message = getErrorMessage(error, 'Could not create your account. Please try again.');

      if (getErrorStatus(error) === 409) {
        setError('email', { message }, { shouldFocus: true });
      } else {
        // Surface server-side validation on the matching fields.
        getFieldErrors(error)
          .filter(({ field }) => FIELDS.includes(field))
          .forEach(({ field, message: fieldMessage }) => setError(field, { message: fieldMessage }));
        setFormError(message);
      }
      toast.error(message);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Create your account</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormAlert message={formError} />
        <FormField
          label="Full name"
          autoComplete="name"
          placeholder="Jane Doe"
          error={errors.name?.message}
          disabled={isSubmitting}
          {...register('name')}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register('email')}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          hint="At least 8 characters, including a letter and a number."
          error={errors.password?.message}
          disabled={isSubmitting}
          {...register('password')}
        />
        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          disabled={isSubmitting}
          {...register('confirmPassword')}
        />
        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </>
  );
}
