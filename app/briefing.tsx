import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { router } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const sections = [
  { icon: 'bell' as const, color: L.orange, bg: 'rgba(240,122,58,0.10)', title: 'Reminders', body: 'No reminders scheduled. Add watchdogs from Workflows.' },
  { icon: 'brain' as const, color: L.violet, bg: 'rgba(91,79,232,0.10)', title: 'Memory Highlights', body: 'Generated from Planner + Memory on schedule. Wire a cron job to populate this daily.' },
  { icon: 'activity' as const, color: L.coral, bg: 'rgba(232,80,58,0.10)', title: 'Yesterday\'s Activity', body: 'No activity recorded yet. Run commands from Home or Voice to build your history.' },
  { icon: 'zap' as const, color: L.mint, bg: 'rgba(62,207,178,0.10)', title: 'Upcoming Tasks', body: 'Connect Calendar API to surface upcoming events here.' },
];

export default function BriefingScreen() {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Icon name="back" size={20} color={L.dark} />
          </Pressable>
          <View>
            <Text style={styles.title}>Daily Briefing</Text>
            <Text style={styles.subtitle}>{dateStr}</Text>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>GOOD MORNING</Text>
          <Text style={styles.heroText}>Here's what's on your radar today.</Text>
        </View>

        {sections.map((s) => (
          <View key={s.title} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: s.bg }]}>
                <Icon name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={styles.cardTitle}>{s.title}</Text>
            </View>
            <Text style={styles.cardBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { color: L.textMid, fontSize: 13 },
  hero: { marginHorizontal: 16, backgroundColor: L.dark, borderRadius: L.radius.lg, padding: 24, marginBottom: 16 },
  heroLabel: { color: L.yellow, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  heroText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 28 },
  card: { marginHorizontal: 16, backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: L.dark },
  cardBody: { color: L.textMid, fontSize: 14, lineHeight: 20 },
});
