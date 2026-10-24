import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Input } from '@/components/Input';

describe('<Input />', () => {
  it('always starts text from the left, whatever languages the phone has enabled', async () => {
    await render(<Input label="Email" value="" onChangeText={() => undefined} />);

    const style = StyleSheet.flatten(screen.getByLabelText('Email').props.style);

    expect(style.textAlign).toBe('left');
    expect(style.writingDirection).toBe('ltr');
  });

  it('keeps the left alignment when a screen passes its own style', async () => {
    await render(<Input label="Name" value="" onChangeText={() => undefined} style={{ marginTop: 4 }} />);

    const style = StyleSheet.flatten(screen.getByLabelText('Name').props.style);

    expect(style.textAlign).toBe('left');
    expect(style.writingDirection).toBe('ltr');
    expect(style.marginTop).toBe(4);
  });
});
