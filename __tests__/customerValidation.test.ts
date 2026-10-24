import { validateCustomerForm } from '@/features/customers/validation';

describe('validateCustomerForm', () => {
  it('accepts a valid customer and trims whitespace', () => {
    const result = validateCustomerForm({ name: '  Jane Doe  ', phone: ' 555-0100 ', address: '1 Main St ' });

    expect(result).toEqual({
      success: true,
      data: { name: 'Jane Doe', phone: '555-0100', address: '1 Main St' },
    });
  });

  it('turns a blank phone and address into null', () => {
    const result = validateCustomerForm({ name: 'Jane Doe', phone: '   ', address: '' });

    expect(result).toEqual({ success: true, data: { name: 'Jane Doe', phone: null, address: null } });
  });

  it('rejects a name shorter than 2 characters', () => {
    const result = validateCustomerForm({ name: 'J', phone: '', address: '' });

    expect(result).toEqual({ success: false, errors: { name: 'Enter at least 2 characters' } });
  });

  it('rejects a name that is only spaces', () => {
    const result = validateCustomerForm({ name: '     ', phone: '', address: '' });

    expect(result.success).toBe(false);
  });

  it('reports one error per field when several are invalid', () => {
    const result = validateCustomerForm({ name: '', phone: '1'.repeat(31), address: 'x'.repeat(201) });

    expect(result).toEqual({
      success: false,
      errors: {
        name: 'Enter at least 2 characters',
        phone: 'Keep the phone number under 30 characters',
        address: 'Keep the address under 200 characters',
      },
    });
  });
});
