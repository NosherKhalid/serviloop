import { validateTechnicianForm } from '@/features/technicians/validation';

describe('validateTechnicianForm', () => {
  it('accepts a technician and trims whitespace', () => {
    expect(validateTechnicianForm({ name: '  Sam Rivera ', specialty: ' Plumbing ' })).toEqual({
      success: true,
      data: { name: 'Sam Rivera', specialty: 'Plumbing' },
    });
  });

  it('turns a blank specialty into null (the database does not allow empty text)', () => {
    expect(validateTechnicianForm({ name: 'Sam Rivera', specialty: '   ' })).toEqual({
      success: true,
      data: { name: 'Sam Rivera', specialty: null },
    });
  });

  it('rejects short, blank and over-long names (same limits as the database)', () => {
    expect(validateTechnicianForm({ name: 'S', specialty: '' })).toEqual({ success: false, errors: { name: 'Enter at least 2 characters' } });
    expect(validateTechnicianForm({ name: '   ', specialty: '' }).success).toBe(false);
    expect(validateTechnicianForm({ name: 'x'.repeat(101), specialty: '' })).toEqual({
      success: false,
      errors: { name: 'Keep the name under 100 characters' },
    });
  });

  it('rejects an over-long specialty', () => {
    expect(validateTechnicianForm({ name: 'Sam Rivera', specialty: 'x'.repeat(101) })).toEqual({
      success: false,
      errors: { specialty: 'Keep the specialty under 100 characters' },
    });
  });
});
