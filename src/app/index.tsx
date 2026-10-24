import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { WelcomeCard } from '@/components/WelcomeCard';

// iOS: a route file's default export is the screen, like the root view of a NavigationStack destination.
export default function HomeScreen() {
  // iOS: like `@State private var count = 0`. `count` is the current value; `setCount` asks
  // React to re-run this function with a new value. Difference: never mutate `count` directly.
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <WelcomeCard
        title="Welcome to Serviloop"
        subtitle="Customers, jobs and AI summaries for small service businesses."
        count={count}
        onIncrement={() => setCount(count + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});
