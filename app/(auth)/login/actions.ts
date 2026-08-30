'use server';

import { redirect } from 'next/navigation';
import { LoginFormSchema, FormState } from '@/lib/definitions';
import { createSession } from '@/lib/auth';

type FirebaseSignInResponse = {
  localId: string;
  email: string;
};

function isAuthorizedAdmin(email: string) {
  const adminEmails = process.env.FIREBASE_ADMIN_EMAILS?.split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return !adminEmails?.length || adminEmails.includes(email.toLowerCase());
}

export async function login(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    return {
      message: 'Firebase authentication is not configured.',
    };
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  );

  if (!response.ok) {
    return {
      message: 'Invalid email or password.',
    };
  }

  const user = (await response.json()) as FirebaseSignInResponse;

  if (!isAuthorizedAdmin(user.email)) {
    return {
      message: 'This Firebase user is not authorized for the dashboard.',
    };
  }

  await createSession(user.localId, 'admin');

  redirect('/admin');
}
