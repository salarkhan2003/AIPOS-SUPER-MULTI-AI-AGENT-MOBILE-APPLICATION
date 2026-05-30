import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

const tabs: { name: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'index', label: 'Home', icon: 'grid' },
  { name: 'voice', label: 'Voice', icon: 'mic' },
  { name: 'tasks', label: 'Tasks', icon: 'checkbox' },
  { name: 'memory', label: 'Memory', icon: 'layers' },
  { name: 'more', label: 'More', icon: 'ellipsis-horizontal' },
];

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

export function ClayTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <LinearGradient
        colors={['rgba(26,15,46,0.95)', 'rgba(18,8,31,0.98)']}
        style={styles.bar}>
        {state.routes.map((route, index) => {
          const tab = tabs.find((t) => t.name === route.name) ?? tabs[0];
          const focused = state.index === index;
          const isVoice = route.name === 'voice';

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tab}>
              {isVoice && focused ? (
                <LinearGradient colors={['#9D8AFF', '#6B4EFF']} style={styles.voiceOrb}>
                  <Ionicons name="mic" size={26} color="#FFF" />
                </LinearGradient>
              ) : (
                <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                  <Ionicons
                    name={tab.icon}
                    size={22}
                    color={focused ? theme.colors.violetSoft : theme.colors.text.muted}
                  />
                </View>
              )}
              <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: theme.radius.xl,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(157,138,255,0.2)',
    ...theme.shadows.clayOuter,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: 'rgba(157,138,255,0.15)' },
  voiceOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    ...theme.shadows.glow,
  },
  label: { fontSize: 10, fontWeight: '600', color: theme.colors.text.muted },
  labelActive: { color: theme.colors.violetSoft },
});
