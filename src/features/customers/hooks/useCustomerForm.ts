import { useState } from 'react';

import { dataErrorMessage } from '@/utils/dataErrors';

import {
  validateCustomerForm,
  type CustomerFormErrors,
  type CustomerFormValues,
  type CustomerInput,
} from '../validation';

type UseCustomerFormOptions = {
  initialValues: CustomerFormValues;
  onSave: (input: CustomerInput) => Promise<void>;
};

// iOS: a form ViewModel. `values` are the text fields' contents (what `$name` bindings would hold),
// `errors` is the per-field message dictionary, and `isSubmitting` drives the button's spinner.
export function useCustomerForm({ initialValues, onSave }: UseCustomerFormOptions) {
  const [values, setValues] = useState<CustomerFormValues>(initialValues);
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Controlled input: the text field always shows `values[field]`; typing calls this to update it.
  // Both updates use the functional form `(current) => ...` so they never overwrite a newer value
  // with a stale copy captured by an earlier render (the "stale closure" trap).
  function setField(field: keyof CustomerFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value })); // immutable update: copy, then override one key
    setErrors((current) => ({ ...current, [field]: undefined })); // clear that field's error as the user fixes it
  }

  async function submit() {
    if (isSubmitting) {
      return; // ignore a second tap while a save is in flight
    }

    const result = validateCustomerForm(values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSave(result.data);
    } catch (error) {
      setSubmitError(dataErrorMessage(error, "We couldn't save this customer. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return { values, errors, isSubmitting, submitError, setField, submit };
}
