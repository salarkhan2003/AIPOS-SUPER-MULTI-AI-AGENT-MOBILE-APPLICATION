import { Tabs } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { B } from '@/constants/basic';

function TabBar({ state, navigation }: { state: { index: number; routes: { key: string; name: string }[] }; navigation: { navigate: (n: string) => void } }) {
  const labels: Record<string, string> = { index: 'Home', voice: 'Voice', tasks: 'Tasks', memory: 'Memory', more: 'More' };
  return (
    <View style={tab.bar}>
      {state.routes.map((route, i) => (
        <Pressable key={route.key} onPress={() => navigation.navigate(route.name)} style={tab.item}>
          <Text style={[tab.txt, state.index === i && tab.active]}>{labels[route.name] ?? route.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(p) => <TabBar state={p.state} navigation={p.navigation} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="voice" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="memory" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}

const tab = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: B.card, paddingBottom: 24, paddingTop: 8 },
  item: { flex: 1, alignItems: 'center' },
  txt: { color: B.dim, fontSize: 11, fontWeight: '600' },
  active: { color: B.accent },
});
