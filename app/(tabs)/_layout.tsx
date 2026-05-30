import { Tabs } from 'expo-router';
import { ClayTabBar } from '@/components/clay/ClayTabBar';

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <ClayTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="voice" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="memory" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
