import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import { FunctionsHttpError } from '@supabase/supabase-js';

import type { WorkOrder } from '@/types/workOrder';

const mockInvoke = jest.fn();
const mockSave = jest.fn<Promise<WorkOrder>, [string, string | null]>();
jest.mock('@/lib/supabase', () => ({ supabase: { functions: { invoke: (...args: unknown[]) => mockInvoke(...args) } } }));
jest.mock('@/repositories/workOrderRepository', () => ({
  updateWorkOrderSummary: (id: string, summary: string | null) => mockSave(id, summary),
}));

import { JobSummarySection } from '@/features/workOrders/components/JobSummarySection';

const job: WorkOrder = {
  id: 'w1',
  title: 'Fix leaking tap',
  description: null,
  status: 'completed',
  customerId: 'c1',
  customerName: 'Maple Street Bakery',
  technicianId: null,
  technicianName: null,
  scheduledFor: null,
  completionNotes: 'Replaced the washer and tested for leaks.',
  aiSummary: null,
};

const onChanged = jest.fn();
let shareSpy: jest.SpyInstance;

function setup(workOrder: WorkOrder = job, notesUnsaved = false) {
  return render(<JobSummarySection workOrder={workOrder} notesUnsaved={notesUnsaved} onWorkOrderChanged={onChanged} />);
}

const disabled = (name: string) => screen.getByRole('button', { name }).props.accessibilityState.disabled;

beforeEach(() => {
  jest.clearAllMocks();
  shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
  mockInvoke.mockResolvedValue({ data: { summary: 'We replaced the washer and tested the tap.', source: 'mock' }, error: null });
});

describe('<JobSummarySection />', () => {
  describe('when the summary can be generated', () => {
    it('needs saved completion notes', async () => {
      await setup({ ...job, completionNotes: null });

      expect(screen.getByText(/Add completion notes above and save them/)).toBeTruthy();
      expect(disabled('Generate summary')).toBe(true);
    });

    it('waits while the notes box holds unsaved text (the server reads the saved notes)', async () => {
      await setup(job, true);

      expect(screen.getByText('Save your notes first: the summary is written from the saved notes.')).toBeTruthy();
      expect(disabled('Generate summary')).toBe(true);
    });

    it('is ready to generate once notes are saved', async () => {
      await setup();

      expect(disabled('Generate summary')).toBe(false);
      expect(screen.queryByLabelText('Summary')).toBeNull();
    });
  });

  describe('generating a draft', () => {
    it('shows the draft in an editable box, labelled as a demo when it came from the mock', async () => {
      await setup();

      await fireEvent.press(screen.getByRole('button', { name: 'Generate summary' }));

      expect(await screen.findByDisplayValue('We replaced the washer and tested the tap.')).toBeTruthy();
      expect(screen.getByText('Demo summary')).toBeTruthy();
      expect(screen.getByText('No AI key is configured, so this only repeats your notes.')).toBeTruthy();
      expect(mockInvoke).toHaveBeenCalledWith('generate-job-summary', expect.objectContaining({ body: { workOrderId: 'w1' } }));
      expect(mockSave).not.toHaveBeenCalled(); // a draft is never saved by itself
    });

    it('says a real AI draft is a draft to check, without the demo badge', async () => {
      mockInvoke.mockResolvedValue({ data: { summary: 'The tap was repaired.', source: 'ai' }, error: null });
      await setup();

      await fireEvent.press(screen.getByRole('button', { name: 'Generate summary' }));

      expect(await screen.findByText('Draft written by AI from your notes. Check it before saving.')).toBeTruthy();
      expect(screen.queryByText('Demo summary')).toBeNull();
    });

    it.each([
      ['rate_limited', 429, "You've reached the summary limit for now. Please try again later."],
      ['empty_notes', 422, 'Add completion notes to the job and save them, then generate the summary.'],
      ['unavailable', 503, "We couldn't write a summary right now. Please try again later."],
    ])('explains a "%s" refusal and offers no draft', async (code, status, message) => {
      mockInvoke.mockResolvedValue({ data: null, error: new FunctionsHttpError(new Response(JSON.stringify({ error: code }), { status })) });
      await setup();

      await fireEvent.press(screen.getByRole('button', { name: 'Generate summary' }));

      expect(await screen.findByText(message)).toBeTruthy();
      expect(screen.queryByLabelText('Summary')).toBeNull();
    });

    it('keeps the existing draft when a regenerate fails', async () => {
      await setup();
      await fireEvent.press(screen.getByRole('button', { name: 'Generate summary' }));
      await screen.findByDisplayValue('We replaced the washer and tested the tap.');

      mockInvoke.mockResolvedValue({ data: null, error: new TypeError('Network request failed') });
      await fireEvent.press(screen.getByRole('button', { name: 'Regenerate summary' }));

      expect(await screen.findByText("We can't reach the server. Check your connection and try again.")).toBeTruthy();
      expect(screen.getByDisplayValue('We replaced the washer and tested the tap.')).toBeTruthy();
    });
  });

  describe('editing, saving and discarding', () => {
    it('saves the edited text (trimmed) and tells the screen the job changed', async () => {
      const updated = { ...job, aiSummary: 'We replaced the washer.' };
      mockSave.mockResolvedValue(updated);
      await setup();
      await fireEvent.press(screen.getByRole('button', { name: 'Generate summary' }));
      const box = await screen.findByLabelText('Summary');

      expect(disabled('Save summary')).toBe(false); // a new draft differs from nothing saved
      await fireEvent.changeText(box, '  We replaced the washer.  ');
      await fireEvent.press(screen.getByRole('button', { name: 'Save summary' }));

      await waitFor(() => expect(mockSave).toHaveBeenCalledWith('w1', 'We replaced the washer.'));
      expect(onChanged).toHaveBeenCalledWith(updated);
    });

    it('shows the saved summary, with "Regenerate", and keeps Save off until something changes', async () => {
      await setup({ ...job, aiSummary: 'We replaced the washer.' });

      expect(screen.getByDisplayValue('We replaced the washer.')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Regenerate summary' })).toBeTruthy();
      expect(disabled('Save summary')).toBe(true);
      expect(screen.queryByRole('button', { name: 'Discard draft' })).toBeNull();
    });

    it('lets the owner fix a saved summary by hand', async () => {
      mockSave.mockResolvedValue({ ...job, aiSummary: 'Fixed.' });
      await setup({ ...job, aiSummary: 'We replaced the washr.' });

      await fireEvent.changeText(screen.getByLabelText('Summary'), 'We replaced the washer.');
      await fireEvent.press(screen.getByRole('button', { name: 'Save summary' }));

      await waitFor(() => expect(mockSave).toHaveBeenCalledWith('w1', 'We replaced the washer.'));
    });

    it('clearing the box and saving removes the summary (null)', async () => {
      mockSave.mockResolvedValue(job);
      await setup({ ...job, aiSummary: 'We replaced the washer.' });

      await fireEvent.changeText(screen.getByLabelText('Summary'), '   ');
      await fireEvent.press(screen.getByRole('button', { name: 'Save summary' }));

      await waitFor(() => expect(mockSave).toHaveBeenCalledWith('w1', null));
    });

    it('refuses a summary over the database limit without sending anything', async () => {
      await setup({ ...job, aiSummary: 'Short.' });

      await fireEvent.changeText(screen.getByLabelText('Summary'), 'a'.repeat(2001));
      await fireEvent.press(screen.getByRole('button', { name: 'Save summary' }));

      expect(await screen.findByText('Keep the summary under 2000 characters')).toBeTruthy();
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('keeps what was typed and explains when saving fails', async () => {
      mockSave.mockRejectedValue({ code: 'XX000', message: 'relation "work_orders" exploded' });
      await setup({ ...job, aiSummary: 'Short.' });

      await fireEvent.changeText(screen.getByLabelText('Summary'), 'My careful edit');
      await fireEvent.press(screen.getByRole('button', { name: 'Save summary' }));

      expect(await screen.findByText("We couldn't save the summary. Please try again.")).toBeTruthy();
      expect(screen.queryByText(/exploded/)).toBeNull();
      expect(screen.getByDisplayValue('My careful edit')).toBeTruthy();
      expect(onChanged).not.toHaveBeenCalled();
    });

    it('discards a draft and goes back to what is saved', async () => {
      await setup({ ...job, aiSummary: 'The saved text.' });
      await fireEvent.press(screen.getByRole('button', { name: 'Regenerate summary' }));
      await screen.findByDisplayValue('We replaced the washer and tested the tap.');

      await fireEvent.press(screen.getByRole('button', { name: 'Discard draft' }));

      expect(screen.getByDisplayValue('The saved text.')).toBeTruthy();
      expect(screen.queryByText('Demo summary')).toBeNull();
      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  describe('sharing', () => {
    it('hands the current summary text to the phone\'s share sheet', async () => {
      await setup({ ...job, aiSummary: 'We replaced the washer.' });

      await fireEvent.press(screen.getByRole('button', { name: 'Share summary' }));

      await waitFor(() => expect(shareSpy).toHaveBeenCalledWith({ message: 'We replaced the washer.' }));
    });

    it('is off until there is a summary to share', async () => {
      await setup();

      expect(screen.queryByRole('button', { name: 'Share summary' })).toBeNull();
    });

    it('explains when the share sheet cannot open', async () => {
      shareSpy.mockRejectedValue(new Error('no share target'));
      await setup({ ...job, aiSummary: 'We replaced the washer.' });

      await fireEvent.press(screen.getByRole('button', { name: 'Share summary' }));

      expect(await screen.findByText("We couldn't open sharing on this device.")).toBeTruthy();
    });
  });

  it('warns that notes are sent to an AI service, so they should not hold phone numbers or addresses', async () => {
    await setup();

    expect(screen.getByText(/Do not put phone numbers or addresses in the notes/)).toBeTruthy();
  });
});
