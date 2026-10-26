import { useState } from 'react';
import { Share } from 'react-native';

import { generateJobSummary, SummaryError, type SummarySource } from '@/repositories/summaryRepository';
import { updateWorkOrderSummary } from '@/repositories/workOrderRepository';
import type { WorkOrder } from '@/types/workOrder';
import { dataErrorMessage } from '@/utils/dataErrors';

import { validateSummary } from '../validation';

type Busy = 'generating' | 'saving' | null;

// The summary half of the job detail screen. Two different texts are in play and must not be confused:
//   * `saved`  - what is stored on the job (`aiSummary`)
//   * `draft`  - what the owner is looking at or editing right now (`null` = untouched, show what is saved)
// A generated draft is never saved by itself: the owner reads it, edits it, and taps Save.
export function useJobSummary(workOrder: WorkOrder, onWorkOrderChanged: (workOrder: WorkOrder) => void) {
  const [draft, setDraft] = useState<string | null>(null);
  const [source, setSource] = useState<SummarySource | null>(null); // where the unsaved draft came from
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  const saved = workOrder.aiSummary ?? '';
  const text = draft ?? saved;
  const changed = draft !== null && draft.trim() !== saved.trim();

  async function generate() {
    setError(null);
    setBusy('generating');
    try {
      const result = await generateJobSummary(workOrder.id);
      setDraft(result.summary);
      setSource(result.source);
    } catch (caught) {
      setError(caught instanceof SummaryError ? caught.userMessage : "We couldn't write a summary right now. Please try again later.");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    const checked = validateSummary(text);
    if (!checked.success) {
      setError(checked.error);
      return;
    }
    setError(null);
    setBusy('saving');
    try {
      const updated = await updateWorkOrderSummary(workOrder.id, checked.data);
      onWorkOrderChanged(updated);
      setDraft(null);
      setSource(null);
    } catch (caught) {
      setError(dataErrorMessage(caught, "We couldn't save the summary. Please try again."));
    } finally {
      setBusy(null);
    }
  }

  // Throws the draft away and goes back to showing what is saved.
  function discard() {
    setError(null);
    setDraft(null);
    setSource(null);
  }

  // The phone's own share sheet (WhatsApp, SMS, email...). Only the summary text is shared.
  async function share() {
    setError(null);
    try {
      await Share.share({ message: text.trim() });
    } catch {
      setError("We couldn't open sharing on this device.");
    }
  }

  return { text, setText: setDraft, changed, hasDraft: draft !== null, source, busy, error, generate, save, discard, share };
}
