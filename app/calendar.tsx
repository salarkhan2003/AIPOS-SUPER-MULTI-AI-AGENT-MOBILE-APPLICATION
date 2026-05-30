import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { router } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const today = new Date().getDay(); // 0=Sun
const todayIdx = today === 0 ? 6 : today - 1;

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const monthStr = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Icon name="back" size={20} color={L.dark} />
          </Pressable>
          <View>
            <Text style={styles.title}>Calendar</Text>
            <Text style={styles.subtitle}>{monthStr}</Text>
          </View>
        </View>

        {/* Week strip */}
        <View style={styles.weekStrip}>
          {DAYS.map((d, i) => (
            <View key={d} style={[styles.dayCol, i === todayIdx && styles.dayColActive]}>
              <Text style={[styles.dayLabel, i === todayIdx && styles.dayLabelActive]}>{d}</Text>
              <Text style={[styles.dayNum, i === todayIdx && styles.dayNumActive]}>
                {new Date(now.getFullYear(), now.getMonth(), now.getDate() - todayIdx + i).getDate()}
              </Text>
            </View>
          ))}
        </View>

        {/* Empty state */}
        <View style={styles.emptyCard}>
          <Icon name="calendar" size={36} color={L.textLight} />
          <Text style={styles.emptyTitle}>No events today</Text>
          <Text style={styles.emptyBody}>Connect Calendar API to surface events and create watchdog reminders.</Text>
        </View>

        {/* Upcoming placeholder */}
        <Text style={styles.sectionLabel}>UPCOMING</Text>
        {['Connect Google Calendar', 'Set up event reminders', 'Wire watchdog triggers'].map((item) => (
          <View key={item} style={styles.placeholderRow}>
            <View style={styles.placeholderDot} />
            <Text style={styles.placeholderText}>{item}</Text>
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
  weekStrip: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  dayCol: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: L.radius.md },
  dayColActive: { backgroundColor: L.violet },
  dayLabel: { fontSize: 10, fontWeight: '700', color: L.textLight, marginBottom: 4 },
  dayLabelActive: { color: 'rgba(255,255,255,0.7)' },
  dayNum: { fontSize: 15, fontWeight: '700', color: L.dark },
  dayNumActive: { color: '#fff' },
  emptyCard: { marginHorizontal: 16, backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 32, alignItems: 'center', gap: 10, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: L.dark },
  emptyBody: { color: L.textMid, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: L.textLight, letterSpacing: 1.2, marginBottom: 10, paddingHorizontal: 16 },
  placeholderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, backgroundColor: L.surface, borderRadius: L.radius.md, padding: 14, marginBottom: 8 },
  placeholderDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: L.border },
  placeholderText: { color: L.textMid, fontSize: 14 },
});
