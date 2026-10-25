import { completionNotesMaxLength, emptyWorkOrderForm, statusChoices, validateCompletionNotes, validateWorkOrderForm } from '@/features/workOrders/validation';

const valid = { ...emptyWorkOrderForm, title: 'Replace kitchen faucet', customerId: 'c1' };

describe('validateWorkOrderForm', () => {
  it('accepts a minimal new job and cleans it up', () => {
    expect(validateWorkOrderForm({ ...valid, title: '  Replace kitchen faucet ' })).toEqual({
      success: true,
      data: {
        title: 'Replace kitchen faucet',
        description: null,
        customerId: 'c1',
        technicianId: null,
        scheduledFor: null,
        status: 'open',
      },
    });
  });

  it('keeps an assigned technician, a description and a date', () => {
    const result = validateWorkOrderForm({
      ...valid,
      description: '  Dripping tap ',
      technicianId: 't1',
      scheduledFor: '2026-10-26T09:00:00.000Z',
    });
    expect(result).toMatchObject({
      success: true,
      data: { description: 'Dripping tap', technicianId: 't1', scheduledFor: '2026-10-26T09:00:00.000Z' },
    });
  });

  it('requires a customer and a sensible title', () => {
    expect(validateWorkOrderForm({ ...valid, customerId: '' })).toEqual({ success: false, errors: { customerId: 'Choose a customer for this job' } });
    expect(validateWorkOrderForm({ ...valid, title: 'X' })).toEqual({ success: false, errors: { title: 'Enter at least 2 characters' } });
    expect(validateWorkOrderForm({ ...valid, title: 'x'.repeat(121) })).toEqual({
      success: false,
      errors: { title: 'Keep the title under 120 characters' },
    });
  });

  it('limits the description to 2000 characters', () => {
    expect(validateWorkOrderForm({ ...valid, description: 'x'.repeat(2001) })).toEqual({
      success: false,
      errors: { description: 'Keep the description under 2000 characters' },
    });
  });

  it('rejects a date that is not a date', () => {
    expect(validateWorkOrderForm({ ...valid, scheduledFor: 'not a date' })).toEqual({
      success: false,
      errors: { scheduledFor: 'Choose a valid date and time' },
    });
  });

  it('reports every problem at once', () => {
    const result = validateWorkOrderForm({ ...valid, title: '', customerId: '' });
    expect(result).toEqual({ success: false, errors: { title: 'Enter at least 2 characters', customerId: 'Choose a customer for this job' } });
  });

  describe('status', () => {
    it('lets a new job start only as Open', () => {
      expect(validateWorkOrderForm({ ...valid, status: 'completed' })).toEqual({ success: false, errors: { status: 'A new job starts as Open' } });
    });

    it('allows the moves in the status rules', () => {
      expect(validateWorkOrderForm({ ...valid, status: 'in_progress' }, 'open').success).toBe(true);
      expect(validateWorkOrderForm({ ...valid, status: 'completed' }, 'in_progress').success).toBe(true);
      expect(validateWorkOrderForm({ ...valid, status: 'open' }, 'cancelled').success).toBe(true);
    });

    it('refuses moves the rules forbid', () => {
      expect(validateWorkOrderForm({ ...valid, status: 'completed' }, 'open')).toEqual({
        success: false,
        errors: { status: 'That status change is not allowed' },
      });
      expect(validateWorkOrderForm({ ...valid, status: 'open' }, 'completed').success).toBe(false); // completed is final
    });

    it('lets an unchanged status through', () => {
      expect(validateWorkOrderForm({ ...valid, status: 'completed' }, 'completed').success).toBe(true);
    });
  });
});

describe('statusChoices', () => {
  it('offers the current status plus the allowed moves, in a stable order', () => {
    expect(statusChoices('open')).toEqual(['open', 'in_progress', 'cancelled']);
    expect(statusChoices('in_progress')).toEqual(['open', 'in_progress', 'completed', 'cancelled']);
    expect(statusChoices('completed')).toEqual(['completed']);
    expect(statusChoices('cancelled')).toEqual(['open', 'cancelled']);
  });
});

describe('validateCompletionNotes', () => {
  it('trims the text', () => {
    expect(validateCompletionNotes('  Replaced the washer.  ')).toEqual({ success: true, data: 'Replaced the washer.' });
  });

  it('treats blank text as "no notes" (null)', () => {
    expect(validateCompletionNotes('')).toEqual({ success: true, data: null });
    expect(validateCompletionNotes('  \n  ')).toEqual({ success: true, data: null });
  });

  it('accepts exactly the database limit and refuses one more', () => {
    expect(validateCompletionNotes('a'.repeat(completionNotesMaxLength)).success).toBe(true);
    expect(validateCompletionNotes('a'.repeat(completionNotesMaxLength + 1))).toEqual({
      success: false,
      error: 'Keep the notes under 4000 characters',
    });
  });
});
