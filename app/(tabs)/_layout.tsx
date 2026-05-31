import { ClayTabBar } from '@/components/clay/ClayTabBar';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <ClayTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="voice" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="memory" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
