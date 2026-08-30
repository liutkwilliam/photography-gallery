import { z } from 'zod';

export const LoginFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }).trim(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

export type FormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;