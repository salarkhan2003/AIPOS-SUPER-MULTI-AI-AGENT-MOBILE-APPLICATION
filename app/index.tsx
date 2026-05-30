import { getInitialRoute } from '@/lib/auth';
import { useColors } from '@/lib/themeContext';
import { useGhostStore } from '@/store/ghostStore';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const hydrated = useGhostStore((s) => s.hydrated);
  const C = useColors();
  const [route, setRoute] = useState<string | null>(null);

  useEffect(() => {
    getInitialRoute().then(setRoute);
  }, []);

  if (!hydrated || !route) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.violet} size="large" />
      </View>
    );
  }

  return <Redirect href={route as '/(tabs)'} />;
}
