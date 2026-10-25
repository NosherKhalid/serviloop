import { useState } from 'react';

import { dataErrorMessage } from '@/utils/dataErrors';

import {
  validateTechnicianForm,
  type TechnicianFormErrors,
  type TechnicianFormValues,
  type TechnicianInput,
} from '../validation';

type UseTechnicianFormOptions = {
  initialValues: TechnicianFormValues;
  onSave: (input: TechnicianInput) => Promise<void>;
};

// The ViewModel for the add/edit technician form (same shape as the customer form).
export function useTechnicianForm({ initialValues, onSave }: UseTechnicianFormOptions) {
  const [values, setValues] = useState<TechnicianFormValues>(initialValues);
  const [errors, setErrors] = useState<TechnicianFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function setField(field: keyof TechnicianFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit() {
    if (isSubmitting) {
      return;
    }
    const result = validateTechnicianForm(values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSave(result.data);
    } catch (error) {
      setSubmitError(dataErrorMessage(error, "We couldn't save this technician. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return { values, errors, isSubmitting, submitError, setField, submit };
}
