import { Icon, type IconName } from '@/components/Icon';
import { useColors } from '@/lib/themeContext';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
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
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

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
              <View style={[styles.iconWrap, active && { backgroundColor: C.violet + '22' }]}>
                <Icon name={tab.icon} size={22} color={active ? C.violet : C.textLight} />
              </View>
              <Text style={[styles.label, active && { color: C.violet }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    outer: { position: 'absolute', left: 12, right: 12, bottom: 0 },
    bar: {
      flexDirection: 'row',
      backgroundColor: C.surface,
      borderRadius: C.radius.lg,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: C.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 12,
    },
    tab: { flex: 1, alignItems: 'center', gap: 4 },
    iconWrap: { padding: 8, borderRadius: 20 },
    label: { fontSize: 10, fontWeight: '600', color: C.textLight },
  });
}
