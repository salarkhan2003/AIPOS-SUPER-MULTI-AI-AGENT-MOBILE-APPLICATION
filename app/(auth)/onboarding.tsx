import { ClayButton } from '@/components/clay';
import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { completeOnboarding } from '@/lib/auth';
import { useGhostStore } from '@/store/ghostStore';
import { router } from 'expo-router';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const features = [
  { icon: 'network' as const, color: L.violet, bg: 'rgba(91,79,232,0.10)', text: '8 specialized agents orchestrate real work' },
  { icon: 'shield' as const, color: L.coral, bg: 'rgba(232,80,58,0.10)', text: 'Permission-based execution you control' },
  { icon: 'bell' as const, color: L.orange, bg: 'rgba(240,122,58,0.10)', text: 'Local notifications and smart watchdogs' },
  { icon: 'brain' as const, color: L.mint, bg: 'rgba(62,207,178,0.10)', text: 'Persistent memory across all sessions' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const setOnboarded = useGhostStore((s) => s.setOnboarded);

  const finish = async () => {
    await completeOnboarding();
    setOnboarded(true);
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar barStyle="dark-content" />

      {/* Top accent strip */}
      <View style={styles.strip}>
        <View style={[styles.pill, { backgroundColor: L.violet }]} />
        <View style={[styles.pill, { backgroundColor: L.coral, width: 40 }]} />
        <View style={[styles.pill, { backgroundColor: L.yellow, width: 24 }]} />
      </View>

      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <Icon name="brain" size={40} color="#fff" />
        </View>
        <Text style={styles.logo}>GHOST</Text>
        <Text style={styles.sub}>Your multi-agent AI command center</Text>
      </View>

      <View style={styles.features}>
        {features.map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
              <Icon name={f.icon} size={20} color={f.color} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.bottom}>
        <ClayButton label="Get started" onPress={finish} />
        <Text style={styles.legal}>By continuing you agree to our Terms of Service</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg, paddingHorizontal: 24 },
  strip: { flexDirection: 'row', gap: 8, paddingTop: 16, paddingBottom: 8 },
  pill: { height: 6, width: 56, borderRadius: 3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: L.dark,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  logo: { fontSize: 44, fontWeight: '800', color: L.dark, letterSpacing: 8 },
  sub: { color: L.textMid, textAlign: 'center', marginTop: 12, fontSize: 15, lineHeight: 22 },
  features: { gap: 12, marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  featureText: { color: L.text, flex: 1, fontSize: 15, fontWeight: '500', lineHeight: 20 },
  bottom: {},
  legal: { color: L.textLight, textAlign: 'center', fontSize: 12, marginTop: 4 },
});
