'use client';

import { useActionState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form action={action} className="w-full max-w-md space-y-4 rounded border p-6 shadow">
        <h1 className="text-2xl font-bold">Admin Login</h1>

        {state?.message && <p className="text-sm text-red-500">{state.message}</p>}

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            className="w-full rounded border p-2"
            required
          />
          {state?.errors?.email && (
            <p className="text-xs text-red-500">{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            name="password"
            className="w-full rounded border p-2"
            required
          />
          {state?.errors?.password && (
            <p className="text-xs text-red-500">{state.errors.password[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded bg-primary p-2 text-white disabled:bg-gray-300"
        >
          {isPending ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}