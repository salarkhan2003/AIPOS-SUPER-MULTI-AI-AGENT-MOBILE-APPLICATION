import { Icon } from '@/components/Icon';
import { fetchPredictions, runGhost } from '@/lib/orchestrator';
import { speak } from '@/lib/voice';
import { useGhostStore } from '@/store/ghostStore';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const HALF = (width - 32 - CARD_GAP) / 2;

// Light-mode palette matching the screenshot aesthetic
const L = {
  bg: '#F0EDE8',
  surface: '#FFFFFF',
  dark: '#1A1A1A',
  yellow: '#F5C842',
  coral: '#E8503A',
  violet: '#5B4FE8',
  mint: '#3ECFB2',
  cream: '#FAF7F0',
  orange: '#F07A3A',
  text: '#1A1A1A',
  textMid: '#555555',
  textLight: '#999999',
  border: 'rgba(0,0,0,0.08)',
};

function Widget({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: object;
  onPress?: () => void;
}) {
  const inner = (
    <View style={[styles.widget, style]}>{children}</View>
  );
  if (!onPress) return inner;
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      {inner}
    </Pressable>
  );
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const predictions = useGhostStore((s) => s.predictions);
  const user = useGhostStore((s) => s.user);
  const setPredictions = useGhostStore((s) => s.setPredictions);
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions().then(setPredictions);
  }, [setPredictions]);

  const run = async (text: string) => {
    setLoading(true);
    setActiveTask(text);
    try {
      const { finalMessage, thoughts } = await runGhost(text);
      thoughts.forEach((t) => useGhostStore.getState().addThought(t));
      speak(finalMessage);
    } catch {
      speak('Something went wrong.');
    } finally {
      setLoading(false);
      setActiveTask(null);
    }
  };

  const firstName = user.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetSmall}>{greeting},</Text>
            <Text style={styles.greetName}>Hi, {firstName}!</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/search')}>
              <Icon name="search" size={20} color={L.dark} />
            </Pressable>
            <Pressable style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => router.push('/profile')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* ── AI Alert Banner ── */}
        {predictions[0] && (
          <Widget
            style={{ backgroundColor: L.dark, marginBottom: CARD_GAP }}
            onPress={() => run(predictions[0].action ?? predictions[0].title)}>
            <View style={styles.alertRow}>
              <View style={[styles.alertDot, { backgroundColor: L.yellow }]} />
              <Text style={styles.alertLabel} numberOfLines={1}>
                {predictions[0].title.toUpperCase()}
              </Text>
              <View style={styles.alertArrow}>
                <Icon name="arrow-up-right" size={14} color={L.dark} />
              </View>
            </View>
            <Text style={styles.alertSub} numberOfLines={2}>
              {predictions[0].subtitle}
            </Text>
            {loading && activeTask === (predictions[0].action ?? predictions[0].title) && (
              <View style={styles.runningPill}>
                <Text style={styles.runningText}>● Running…</Text>
              </View>
            )}
          </Widget>
        )}

        {/* ── Two-column widgets row 1 ── */}
        <View style={styles.row}>
          {/* Credits widget */}
          <Widget
            style={[styles.halfCard, { backgroundColor: L.violet, marginRight: CARD_GAP }]}
            onPress={() => router.push('/subscription')}>
            <Text style={styles.widgetLabelLight}>CREDITS</Text>
            <Text style={styles.widgetBigLight}>
              {user.creditsTotal - user.creditsUsed}
            </Text>
            <Text style={styles.widgetSubLight}>of {user.creditsTotal} left</Text>
            <View style={styles.creditBar}>
              <View
                style={[
                  styles.creditFill,
                  {
                    width: `${Math.max(4, ((user.creditsTotal - user.creditsUsed) / user.creditsTotal) * 100)}%`,
                  },
                ]}
              />
            </View>
          </Widget>

          {/* Tasks widget */}
          <Widget
            style={[styles.halfCard, { backgroundColor: L.yellow }]}
            onPress={() => router.push('/tasks')}>
            <Text style={styles.widgetLabelDark}>TASKS</Text>
            <Text style={styles.widgetBigDark}>Active</Text>
            <View style={{ marginTop: 8 }}>
              <Tag label="Planner" color={L.dark} bg="rgba(0,0,0,0.12)" />
              <Tag label="Executor" color={L.dark} bg="rgba(0,0,0,0.12)" />
            </View>
          </Widget>
        </View>

        {/* ── Memory / Knowledge wide card ── */}
        <Widget
          style={{ backgroundColor: L.coral, marginBottom: CARD_GAP }}
          onPress={() => router.push('/memory')}>
          <View style={styles.wideCardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.widgetLabelLight}>MEMORY</Text>
              <Text style={styles.wideCardTitle}>Knowledge{'\n'}Graph</Text>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 6 }}>
                <Tag label="Semantic" color="#fff" bg="rgba(255,255,255,0.25)" />
                <Tag label="Episodic" color="#fff" bg="rgba(255,255,255,0.25)" />
              </View>
            </View>
            <Pressable
              style={styles.wideArrow}
              onPress={() => router.push('/knowledge-graph')}>
              <Icon name="arrow-up-right" size={16} color={L.coral} />
            </Pressable>
          </View>
        </Widget>

        {/* ── Two-column row 2 ── */}
        <View style={styles.row}>
          {/* Voice widget */}
          <Widget
            style={[styles.halfCard, { backgroundColor: L.mint, marginRight: CARD_GAP }]}
            onPress={() => router.push('/voice')}>
            <Text style={styles.widgetLabelDark}>VOICE</Text>
            <View style={styles.voiceOrb}>
              <Icon name="mic" size={28} color={L.mint} />
            </View>
            <Text style={[styles.widgetSubDark, { marginTop: 8 }]}>Tap to speak</Text>
          </Widget>

          {/* Briefing widget */}
          <Widget
            style={[styles.halfCard, { backgroundColor: L.cream, borderWidth: 1, borderColor: L.border }]}
            onPress={() => router.push('/briefing')}>
            <Text style={[styles.widgetLabelDark, { color: L.textMid }]}>BRIEFING</Text>
            <Text style={[styles.widgetBigDark, { fontSize: 18, lineHeight: 24 }]}>
              Daily{'\n'}Digest
            </Text>
            <View style={{ marginTop: 8 }}>
              <Tag label="Ready" color={L.violet} bg="rgba(91,79,232,0.12)" />
            </View>
          </Widget>
        </View>

        {/* ── Predictions list ── */}
        {predictions.slice(1).map((p) => (
          <Widget
            key={p.id}
            style={{ backgroundColor: L.surface, borderWidth: 1, borderColor: L.border, marginBottom: CARD_GAP }}
            onPress={() => run(p.action ?? p.title)}>
            <View style={styles.predRow}>
              <View style={styles.predDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.predTitle}>{p.title}</Text>
                <Text style={styles.predSub} numberOfLines={2}>{p.subtitle}</Text>
              </View>
              <View style={styles.predArrow}>
                <Icon name="arrow-up-right" size={14} color={L.dark} />
              </View>
            </View>
          </Widget>
        ))}

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.quickBtn, { backgroundColor: L.dark, flex: 1, marginRight: CARD_GAP / 2 }]}
            onPress={() => run("text Mom I'm reaching in 10min")}>
            <Icon name="message-circle" size={18} color="#fff" />
            <Text style={styles.quickBtnText}>Text Mom</Text>
          </Pressable>
          <Pressable
            style={[styles.quickBtn, { backgroundColor: L.orange, flex: 1, marginLeft: CARD_GAP / 2 }]}
            onPress={() => run('book cab to station')}>
            <Icon name="navigation" size={18} color="#fff" />
            <Text style={styles.quickBtnText}>Book Cab</Text>
          </Pressable>
        </View>

        {/* ── Nav shortcuts ── */}
        <View style={styles.shortcutGrid}>
          {[
            { label: 'Command', icon: 'terminal', route: '/command-center', bg: L.violet },
            { label: 'Calendar', icon: 'calendar', route: '/calendar', bg: L.coral },
            { label: 'Notes', icon: 'file-text', route: '/notes', bg: L.mint },
            { label: 'Workflows', icon: 'git-branch', route: '/workflow-builder', bg: L.yellow },
          ].map((item) => (
            <Pressable
              key={item.route}
              style={[styles.shortcut, { backgroundColor: item.bg }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(item.route as any);
              }}>
              <Icon name={item.icon as any} size={22} color={item.bg === L.yellow ? L.dark : '#fff'} />
              <Text style={[styles.shortcutLabel, { color: item.bg === L.yellow ? L.dark : '#fff' }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetSmall: { fontSize: 13, color: L.textMid, fontWeight: '500' },
  greetName: { fontSize: 26, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: L.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: L.violet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Widget base
  widget: {
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Alert banner
  alertRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  alertDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  alertLabel: { flex: 1, color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  alertArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: L.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 },
  runningPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  runningText: { color: L.yellow, fontSize: 12, fontWeight: '600' },

  // Row layout
  row: { flexDirection: 'row', marginBottom: CARD_GAP },
  halfCard: {
    width: HALF,
    borderRadius: 24,
    padding: 18,
    marginRight: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Widget typography
  widgetLabelLight: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  widgetLabelDark: { color: 'rgba(0,0,0,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  widgetBigLight: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  widgetBigDark: { color: L.dark, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  widgetSubLight: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  widgetSubDark: { color: 'rgba(0,0,0,0.5)', fontSize: 12 },

  // Credit bar
  creditBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  creditFill: { height: 4, backgroundColor: '#fff', borderRadius: 2 },

  // Half card gap
  halfGap: { width: CARD_GAP },

  // Wide card
  wideCardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  wideCardTitle: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 4 },
  wideArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },

  // Voice orb
  voiceOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: L.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  // Tag
  tag: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  tagText: { fontSize: 11, fontWeight: '700' },

  // Predictions
  predRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  predDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: L.violet },
  predTitle: { color: L.dark, fontWeight: '700', fontSize: 15 },
  predSub: { color: L.textMid, fontSize: 13, marginTop: 2 },
  predArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: L.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: L.textLight,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 4,
  },

  // Quick buttons
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: CARD_GAP,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  quickBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Shortcut grid
  shortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  shortcut: {
    width: HALF,
    borderRadius: 20,
    padding: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  shortcutLabel: { fontSize: 14, fontWeight: '700' },
});
