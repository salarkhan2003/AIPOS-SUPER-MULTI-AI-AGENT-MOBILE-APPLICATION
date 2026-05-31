import { Icon, type IconName } from '@/components/Icon';
import { useColors } from '@/lib/themeContext';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'index',  label: 'Home',   icon: 'home'   },
  { name: 'tasks',  label: 'Tasks',  icon: 'tasks'  },
  { name: 'memory', label: 'Memory', icon: 'memory' },
  { name: 'more',   label: 'More',   icon: 'more'   },
];

// ── Floating animated mic button ─────────────────────────────────────────────
function FloatingMicButton() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringScale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/voice');
      }}
      style={micS.wrap}>
      <Animated.View
        style={[micS.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}
      />
      <View style={micS.btn}>
        <Icon name="mic" size={22} color="#fff" />
      </View>
    </Pressable>
  );
}

const micS = StyleSheet.create({
  wrap: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
  },
  ring: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#9D8AFF',
  },
  btn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6B4EFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
  },
});

// ── Tab bar ───────────────────────────────────────────────────────────────────
export function ClayTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const S = useMemo(() => makeStyles(C), [C]);

  const leftTabs  = TABS.slice(0, 2);  // Home, Tasks
  const rightTabs = TABS.slice(2, 4);  // Memory, More

  function TabBtn({ tab }: { tab: typeof TABS[number] }) {
    const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
    const route = state.routes[routeIndex];
    if (!route) return null;
    const active = state.index === routeIndex;

    const onPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!active && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable key={route.key} style={S.tab} onPress={onPress}>
        <View style={[S.iconWrap, active && { backgroundColor: C.violet + '22' }]}>
          <Icon name={tab.icon} size={22} color={active ? C.violet : C.textLight} />
        </View>
        <Text style={[S.label, active && { color: C.violet }]}>{tab.label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[S.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={S.bar}>
        {leftTabs.map((t) => <TabBtn key={t.name} tab={t} />)}
        <FloatingMicButton />
        {rightTabs.map((t) => <TabBtn key={t.name} tab={t} />)}
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    outer: { position: 'absolute', left: 12, right: 12, bottom: 0 },
    bar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: C.surface,
      borderRadius: C.radius.lg,
      paddingVertical: 10,
      paddingHorizontal: 4,
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
