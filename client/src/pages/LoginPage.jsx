import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { FormAlert } from '../components/FormAlert';
import { getErrorMessage } from '../utils/errors';
import { loginSchema } from '../utils/validation';

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), mode: 'onTouched', defaultValues: { email: '', password: '' } });

  // On success GuestRoute redirects to the page the user originally requested.
  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
    } catch (error) {
      const message = getErrorMessage(error, 'Could not log you in. Please try again.');
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Log in to your account</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" state={location.state} className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
            Create one
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormAlert message={formError} />
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
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          disabled={isSubmitting}
          {...register('password')}
        />
        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </>
  );
}
