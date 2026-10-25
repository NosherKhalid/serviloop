import { useState } from 'react';

import type { WorkOrderStatus } from '@/types/workOrder';
import { dataErrorMessage } from '@/utils/dataErrors';

import {
  validateWorkOrderForm,
  type WorkOrderFormErrors,
  type WorkOrderFormValues,
  type WorkOrderInput,
} from '../validation';

type UseWorkOrderFormOptions = {
  initialValues: WorkOrderFormValues;
  // The job's status before editing; undefined when creating a new job.
  originalStatus?: WorkOrderStatus;
  onSave: (input: WorkOrderInput) => Promise<void>;
};

// The ViewModel for the new/edit job form (same shape as the customer and technician forms).
export function useWorkOrderForm({ initialValues, originalStatus, onSave }: UseWorkOrderFormOptions) {
  const [values, setValues] = useState<WorkOrderFormValues>(initialValues);
  const [errors, setErrors] = useState<WorkOrderFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // `setField` takes the field name and its new value; a functional update never overwrites newer state.
  function setField<K extends keyof WorkOrderFormValues>(field: K, value: WorkOrderFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit() {
    if (isSubmitting) {
      return;
    }
    const result = validateWorkOrderForm(values, originalStatus);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSave(result.data);
    } catch (error) {
      setSubmitError(dataErrorMessage(error, "We couldn't save this job. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return { values, errors, isSubmitting, submitError, setField, submit };
}
