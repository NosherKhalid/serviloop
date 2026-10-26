import { renderHook } from '@testing-library/react-native';
import { Platform, type LayoutChangeEvent, type ScrollView } from 'react-native';

import { useScrollToField } from '@/utils/useScrollToField';

// Regression for a defect found on the Android emulator in the M6 screenshot pass: with the on-screen keyboard
// open, the completion-notes box (and the summary box below it) sat behind the keyboard and the screen stayed
// scrolled to the top, so the person typed blind. Android resizes the window but does not scroll the focused
// field into view, so the screen has to do it.
function layoutAt(y: number): LayoutChangeEvent {
  return { nativeEvent: { layout: { x: 0, y, width: 300, height: 100 } } } as LayoutChangeEvent;
}

describe('useScrollToField', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.replaceProperty(Platform, 'OS', 'ios');
  });

  async function setup() {
    const scrollTo = jest.fn();
    const hook = await renderHook(() => useScrollToField());
    hook.result.current.scrollRef.current = { scrollTo } as unknown as ScrollView;
    return { hook, scrollTo };
  }

  it('on Android, scrolls the focused field near the top once the keyboard has resized the window', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const { hook, scrollTo } = await setup();
    hook.result.current.onLayoutFor('notes')(layoutAt(900));

    hook.result.current.scrollToField('notes');
    expect(scrollTo).not.toHaveBeenCalled(); // waits for the keyboard animation

    jest.advanceTimersByTime(300);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ y: 900 - 16, animated: true });
  });

  it('adds an offset for a field inside a section (the summary box)', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const { hook, scrollTo } = await setup();
    hook.result.current.onLayoutFor('summary')(layoutAt(1400));

    hook.result.current.scrollToField('summary', 250);
    jest.advanceTimersByTime(300);

    expect(scrollTo).toHaveBeenCalledWith({ y: 1400 + 250 - 16, animated: true });
  });

  it('never scrolls above the top', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const { hook, scrollTo } = await setup();
    hook.result.current.onLayoutFor('notes')(layoutAt(4));

    hook.result.current.scrollToField('notes');
    jest.advanceTimersByTime(300);

    expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
  });

  it('does nothing on iOS, which already scrolls the field into view', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const { hook, scrollTo } = await setup();
    hook.result.current.onLayoutFor('notes')(layoutAt(900));

    hook.result.current.scrollToField('notes');
    jest.advanceTimersByTime(300);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('does nothing for a field whose position is not known yet', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const { hook, scrollTo } = await setup();

    hook.result.current.scrollToField('notes');
    jest.advanceTimersByTime(300);

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
