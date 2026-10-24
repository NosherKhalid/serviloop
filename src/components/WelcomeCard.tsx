import { Pressable, StyleSheet, Text, View } from 'react-native';

// iOS: this type is like the `let` parameters of a SwiftUI View struct.
// It only exists at compile time; React does not check it at runtime.
type WelcomeCardProps = {
  title: string;
  subtitle: string;
  count: number;
  onIncrement: () => void;
};

// iOS: a component is just a function that returns UI (JSX), like a SwiftUI `body`.
// React calls this function again every time the props change.
export function WelcomeCard({ title, subtitle, count, onIncrement }: WelcomeCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* iOS: `onPress` is a closure passed from the parent, like a Button action.
          The card owns no state; the parent does (data flows down, events flow up). */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add one to the counter"
        onPress={onIncrement}
        style={styles.button}>
        <Text style={styles.buttonText}>Tapped {count} times</Text>
      </Pressable>
    </View>
  );
}

// Temporary hardcoded values: they move into src/theme in the next slice.
const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  subtitle: {
    fontSize: 16,
    color: '#3730A3',
  },
  button: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
