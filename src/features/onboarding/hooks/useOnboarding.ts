import { useState } from 'react';

import { useBusiness } from '@/providers/BusinessProvider';

import { businessErrorMessage } from '../errors';
import { validateBusinessName } from '../validation';

type Action = 'create' | 'demo';

// iOS: the ViewModel for the onboarding screen. One action can run at a time.
export function useOnboarding() {
  const { createBusiness, loadDemoData } = useBusiness();
  const [name, setNameState] = useState('');
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<Action | null>(null);

  function setName(value: string) {
    setNameState(value);
    setNameError(undefined);
    setFormError(null);
  }

  async function run(action: Action, work: () => Promise<void>) {
    if (runningAction !== null) {
      return; // ignore taps while another request is in flight
    }
    setRunningAction(action);
    setFormError(null);
    try {
      await work();
      // Success: the business state changes and the screen is replaced; nothing more to do here.
    } catch (error) {
      setFormError(businessErrorMessage(error));
    } finally {
      setRunningAction(null);
    }
  }

  async function submitName() {
    const result = validateBusinessName(name);
    if (!result.success) {
      setNameError(result.error);
      return;
    }
    await run('create', () => createBusiness(result.name));
  }

  async function startWithDemoData() {
    await run('demo', loadDemoData);
  }

  return { name, nameError, formError, runningAction, setName, submitName, startWithDemoData };
}
