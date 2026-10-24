import { useState } from 'react';

import { useAuth } from '@/providers/AuthProvider';

import { authErrorMessage } from '../errors';
import { validateCredentials, type AuthMode, type CredentialsErrors, type CredentialsValues } from '../validation';

// iOS: the ViewModel shared by the Sign in and Create account screens (they differ only in `mode`).
export function useAuthForm(mode: AuthMode) {
  const { signIn, signUp } = useAuth();
  const [values, setValues] = useState<CredentialsValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<CredentialsErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Controlled input with functional updates (never overwrite newer state with a stale copy).
  function setField(field: keyof CredentialsValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  async function submit() {
    if (isSubmitting) {
      return; // ignore a second tap while the request is in flight
    }

    const result = validateCredentials(mode, values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setNotice(null);
    try {
      if (mode === 'signIn') {
        await signIn(result.data.email, result.data.password);
        // Success: the signed-in state changes and the root layout swaps to the app. Nothing to do here.
      } else {
        const { needsEmailConfirmation } = await signUp(result.data.email, result.data.password);
        if (needsEmailConfirmation) {
          setNotice('Check your email to confirm your account, then sign in.');
          setIsSubmitting(false);
        }
      }
    } catch (error) {
      setFormError(authErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return { values, errors, isSubmitting, formError, notice, setField, submit };
}
