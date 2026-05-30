import { Icon, type IconName } from '@/components/Icon';
import { L } from '@/constants/light';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const tabs: { name: string; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'voice', label: 'Voice', icon: 'mic' },
  { name: 'tasks', label: 'Tasks', icon: 'tasks' },
  { name: 'memory', label: 'Memory', icon: 'memory' },
  { name: 'more', label: 'More', icon: 'more' },
];

export function ClayTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const tab = tabs.find((t) => t.name === route.name) ?? tabs[0];
          const active = state.index === index;
          return (
            <Pressable
              key={route.key}
              style={styles.tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(route.name);
              }}>
              <View style={[styles.iconWrap, active && styles.iconActive]}>
                <Icon name={tab.icon} size={22} color={active ? L.violet : L.textLight} />
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: L.surface,
    borderRadius: L.radius.lg,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  iconWrap: { padding: 8, borderRadius: 20 },
  iconActive: { backgroundColor: 'rgba(91,79,232,0.10)' },
  label: { fontSize: 10, fontWeight: '600', color: L.textLight },
  labelActive: { color: L.violet },
});
