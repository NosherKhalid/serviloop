import { createCustomer, getCustomer, listCustomers, updateCustomer } from '@/repositories/customerRepository';

// The mock repository waits 600 ms to imitate a network call. Fake timers let tests skip the wait.
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// Runs `action` and fast-forwards the fake network delay.
async function finish<T>(action: Promise<T>): Promise<T> {
  await jest.advanceTimersByTimeAsync(600);
  return action;
}

const input = { name: 'Riverside Cafe', phone: null, address: '5 River Road' };

describe('customerRepository (mock)', () => {
  it('adds a created customer to the list with a new id', async () => {
    const before = await finish(listCustomers());

    const created = await finish(createCustomer(input));
    const after = await finish(listCustomers());

    expect(after).toHaveLength(before.length + 1);
    expect(after.map((customer) => customer.id)).toContain(created.id);
    expect(before.map((customer) => customer.id)).not.toContain(created.id);
  });

  it('does not change the previously returned list (no in-place mutation)', async () => {
    const before = await finish(listCustomers());
    const sizeBefore = before.length;

    await finish(createCustomer({ ...input, name: 'Another Cafe' }));

    expect(before).toHaveLength(sizeBefore);
  });

  it('updates only the edited customer', async () => {
    const created = await finish(createCustomer(input));

    const updated = await finish(updateCustomer(created.id, { ...input, name: 'Riverside Bistro' }));
    const reloaded = await finish(getCustomer(created.id));

    expect(updated.name).toBe('Riverside Bistro');
    expect(reloaded?.name).toBe('Riverside Bistro');
    expect(reloaded?.createdAt).toBe(created.createdAt);
  });

  it('returns null for an unknown customer id', async () => {
    expect(await finish(getCustomer('does-not-exist'))).toBeNull();
  });

  it('rejects when updating a customer that does not exist', async () => {
    const attempt = expect(updateCustomer('does-not-exist', input)).rejects.toThrow('Customer not found');

    await jest.advanceTimersByTimeAsync(600);
    await attempt;
  });
});
