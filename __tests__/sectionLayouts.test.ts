// Guards a navigation bug the owner found: jumping to "New customer" from the Jobs tab opened a
// stack with no list under it, so there was no back arrow and saving fell out to the Dashboard.
jest.mock('expo-router', () => ({ Stack: Object.assign(() => null, { Screen: () => null }), useRouter: () => ({}) }));

import { unstable_settings as customers } from '@/app/(app)/customers/_layout';
import { unstable_settings as settings } from '@/app/(app)/settings/_layout';
import { unstable_settings as workOrders } from '@/app/(app)/work-orders/_layout';

describe('every tab section that has detail screens starts at its list', () => {
  it.each([
    ['customers', customers],
    ['work-orders', workOrders],
    ['settings', settings],
  ])('%s', (_name, settingsObject) => {
    expect(settingsObject.anchor).toBe('index');
  });
});
