import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Clay } from '@/constants/clay';
import { getInitialRoute } from '@/lib/auth';
import { useGhostStore } from '@/store/ghostStore';

export default function Index() {
  const hydrated = useGhostStore((s) => s.hydrated);
  const [route, setRoute] = useState<string | null>(null);

  useEffect(() => {
    getInitialRoute().then(setRoute);
  }, []);

  if (!hydrated || !route) {
    return (
      <View style={{ flex: 1, backgroundColor: Clay.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Clay.accent} size="large" />
      </View>
    );
  }

  return <Redirect href={route as '/(tabs)'} />;
}
