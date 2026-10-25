import { z } from 'zod';

import type { WorkOrderStatus } from '@/types/workOrder';

import { canTransition, workOrderStatuses } from './status';

// Same style as the customer and technician forms: a pure function, one message per field, limits
// that mirror the database (title 2-120, description up to 2000).

function blankToNull(value: string): string | null {
  return value === '' ? null : value;
}

export const workOrderFormSchema = z.object({
  title: z.string().trim().min(2, 'Enter at least 2 characters').max(120, 'Keep the title under 120 characters'),
  description: z.string().trim().max(2000, 'Keep the description under 2000 characters').transform(blankToNull),
  // The form keeps "nothing chosen" as an empty string.
  customerId: z.string().min(1, 'Choose a customer for this job'),
  technicianId: z.string().transform(blankToNull),
  // A UTC ISO timestamp or nothing: the date picker produces it, the person never types it.
  scheduledFor: z
    .string()
    .nullable()
    .refine((value) => value === null || !Number.isNaN(new Date(value).getTime()), 'Choose a valid date and time'),
  status: z.enum(workOrderStatuses as [WorkOrderStatus, ...WorkOrderStatus[]]),
});

export type WorkOrderFormValues = z.input<typeof workOrderFormSchema>;
export type WorkOrderInput = z.output<typeof workOrderFormSchema>;
export type WorkOrderFormErrors = Partial<Record<keyof WorkOrderFormValues, string>>;

export type WorkOrderFormResult =
  | { success: true; data: WorkOrderInput }
  | { success: false; errors: WorkOrderFormErrors };

export const emptyWorkOrderForm: WorkOrderFormValues = {
  title: '',
  description: '',
  customerId: '',
  technicianId: '',
  scheduledFor: null,
  status: 'open',
};

// `originalStatus` is the job's status before editing (undefined when creating a new job).
// The rules in `status.ts` decide which moves are allowed (D-017).
export function validateWorkOrderForm(values: WorkOrderFormValues, originalStatus?: WorkOrderStatus): WorkOrderFormResult {
  const result = workOrderFormSchema.safeParse(values);
  const errors: WorkOrderFormErrors = {};

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (
        (field === 'title' || field === 'description' || field === 'customerId' || field === 'technicianId' || field === 'scheduledFor' || field === 'status') &&
        errors[field] === undefined
      ) {
        errors[field] = issue.message;
      }
    }
  }

  // A new job always starts open; an existing job may only make an allowed move.
  const startingStatus: WorkOrderStatus = originalStatus ?? 'open';
  if (values.status !== startingStatus && !canTransition(startingStatus, values.status) && errors.status === undefined) {
    errors.status = originalStatus === undefined ? 'A new job starts as Open' : 'That status change is not allowed';
  }

  if (!result.success || Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  return { success: true, data: result.data };
}

// The statuses a job may be set to from where it is now: itself plus the allowed moves.
export function statusChoices(current: WorkOrderStatus): WorkOrderStatus[] {
  return workOrderStatuses.filter((status) => status === current || canTransition(current, status));
}
