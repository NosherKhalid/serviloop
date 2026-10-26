import { useRef } from 'react';
import { Platform, type LayoutChangeEvent, type ScrollView } from 'react-native';

import { spacing } from '@/theme';

// Android shrinks the window when the keyboard opens but does NOT scroll the focused field into view, so on a tall
// screen the field being typed in can sit behind the keyboard (found in the M6 device pass, D-045). iOS does it for
// us (`automaticallyAdjustKeyboardInsets`), so this does nothing there.
//
// Usage: give the ScrollView `ref={scrollRef}`, wrap each field's section in a View with
// `onLayout={onLayoutFor('name')}`, and call `scrollToField('name')` from the field's `onFocus`.
export function useScrollToField() {
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef(new Map<string, number>());

  function onLayoutFor(name: string) {
    return (event: LayoutChangeEvent) => {
      offsets.current.set(name, event.nativeEvent.layout.y);
    };
  }

  // `extraOffset` is for a field that sits inside the measured section rather than at its top.
  function scrollToField(name: string, extraOffset = 0) {
    const sectionTop = offsets.current.get(name);
    if (Platform.OS !== 'android' || sectionTop === undefined) {
      return;
    }
    // Wait for the keyboard to finish resizing the window; scrolling earlier lands in the wrong place.
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, sectionTop + extraOffset - spacing.lg), animated: true });
    }, 250);
  }

  return { scrollRef, onLayoutFor, scrollToField };
}
