import { updateWorkOrderProgress } from '@/repositories/workOrderRepository';
import type { WorkOrder, WorkOrderStatus } from '@/types/workOrder';
import { dataErrorMessage } from '@/utils/dataErrors';

import { canTransition } from '../status';
import { validateCompletionNotes } from '../validation';

// The "intent" half of the job detail screen: move a job along, or save its notes. Every outcome comes back as
// a value (never a thrown error) so the screen can show one friendly sentence and stay where it is.
export type ProgressResult = { ok: true; workOrder: WorkOrder } | { ok: false; message: string };

const saveFailed = "We couldn't save this. Please try again.";

export function useWorkOrderProgress() {
  // Any status change also saves the notes currently typed, so nothing the owner wrote is left behind (D-038).
  async function changeStatus(current: WorkOrder, to: WorkOrderStatus, notesText: string): Promise<ProgressResult> {
    if (!canTransition(current.status, to)) {
      return { ok: false, message: 'That status change is not allowed.' };
    }
    const notes = validateCompletionNotes(notesText);
    if (!notes.success) {
      return { ok: false, message: notes.error };
    }
    return save(current.id, { status: to, completionNotes: notes.data });
  }

  async function saveNotes(current: WorkOrder, notesText: string): Promise<ProgressResult> {
    const notes = validateCompletionNotes(notesText);
    if (!notes.success) {
      return { ok: false, message: notes.error };
    }
    return save(current.id, { completionNotes: notes.data });
  }

  return { changeStatus, saveNotes };
}

async function save(id: string, progress: Parameters<typeof updateWorkOrderProgress>[1]): Promise<ProgressResult> {
  try {
    return { ok: true, workOrder: await updateWorkOrderProgress(id, progress) };
  } catch (error) {
    return { ok: false, message: dataErrorMessage(error, saveFailed) };
  }
}
