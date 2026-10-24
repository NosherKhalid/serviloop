import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useBusiness } from '@/providers/BusinessProvider';
import { radius, spacing, typography, useTheme } from '@/theme';

import { useOnboarding } from '../hooks/useOnboarding';

export function OnboardingScreen() {
  const { state, continueAfterDemo } = useBusiness();

  if (state.status === 'demoLoaded') {
    const { business, summary } = state;
    return (
      <DemoLoadedPanel
        businessName={business.name}
        message={`Loaded ${summary.customers} customers, ${summary.technicians} technicians and ${summary.jobs} jobs.`}
        onContinue={continueAfterDemo}
      />
    );
  }
  return <SetupForm />;
}

function SetupForm() {
  const colors = useTheme();
  const { name, nameError, formError, runningAction, setName, submitName, startWithDemoData } = useOnboarding();
  const isBusy = runningAction !== null;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Text style={[styles.title, { color: colors.text }]}>Set up your business</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        Serviloop keeps your customers, technicians and jobs together. Start with your own business name, or look around with sample data first.
      </Text>

      <Input
        label="Business name"
        value={name}
        onChangeText={setName}
        error={nameError}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={submitName}
        editable={!isBusy}
      />
      <Button title="Create my business" onPress={submitName} loading={runningAction === 'create'} disabled={isBusy && runningAction !== 'create'} />

      <Text style={[styles.divider, { color: colors.textMuted }]}>or</Text>

      <View style={[styles.demoCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.demoTitle, { color: colors.text }]}>Explore with demo data</Text>
        <Text style={{ color: colors.textMuted }}>
          Creates a fictional plumbing company with sample customers, technicians and jobs, so you can see how everything fits together.
        </Text>
        <Button
          title="Start with demo data"
          variant="secondary"
          onPress={startWithDemoData}
          loading={runningAction === 'demo'}
          disabled={isBusy && runningAction !== 'demo'}
        />
      </View>

      {formError !== null ? (
        <Text accessibilityRole="alert" style={[styles.body, { color: colors.danger }]}>
          {formError}
        </Text>
      ) : null}
    </ScrollView>
  );
}

function DemoLoadedPanel({ businessName, message, onContinue }: { businessName: string; message: string; onContinue: () => void }) {
  const colors = useTheme();

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>{"You're all set"}</Text>
      <View style={[styles.demoCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.demoTitle, { color: colors.text }]}>{businessName}</Text>
        <Text accessibilityRole="summary" style={{ color: colors.text }}>
          {message}
        </Text>
      </View>
      <Button title="Continue" onPress={onContinue} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    ...typography.title,
  },
  body: {
    ...typography.body,
  },
  divider: {
    ...typography.body,
    textAlign: 'center',
  },
  demoCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  demoTitle: {
    ...typography.heading,
  },
});
