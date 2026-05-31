import { useColors } from '@/lib/themeContext';
import { useGhostStore } from '@/store/ghostStore';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const hydrated = useGhostStore((s) => s.hydrated);
  const hasOnboarded = useGhostStore((s) => s.hasOnboarded);
  const C = useColors();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.violet} size="large" />
      </View>
    );
  }

  if (!hasOnboarded) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
