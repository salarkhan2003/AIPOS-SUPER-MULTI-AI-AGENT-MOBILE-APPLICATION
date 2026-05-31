import { Icon } from '@/components/Icon';
import { formatDisplayText } from '@/lib/displayText';
import { fetchPredictions, runGhost } from '@/lib/orchestrator';
import { goalsStorage, type SavedGoal } from '@/lib/storage';
import { useTheme } from '@/lib/themeContext';
import { speak } from '@/lib/voice';
import { useGhostStore } from '@/store/ghostStore';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const GAP = 12;
const HALF = (width - 32 - GAP) / 2;

// ─── AI Orb — pure glowing identity orb, no mic icon ─────────────────────────
function AIOrb({ isActive }: { isActive: boolean }) {
  const breathe = useRef(new Animated.Value(0)).current;
  const glow    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const b = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 3000, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 3000, useNativeDriver: true }),
    ]));
    const g = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ]));
    b.start(); g.start();
    return () => { b.stop(); g.stop(); };
  }, [breathe, glow]);

  const orbScale    = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, isActive ? 1.14 : 1.05] });
  const ringOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.2, isActive ? 0.9 : 0.55] });
  const innerOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  return (
    <View style={orbS.container}>
      {/* Outer glow rings — no mic, pure orb */}
      <Animated.View style={[orbS.ring3, { opacity: ringOpacity }]} />
      <Animated.View style={[orbS.ring2, { opacity: ringOpacity }]} />
      <Animated.View style={[orbS.ring1, { opacity: ringOpacity }]} />
      <Animated.View style={[orbS.orb, { transform: [{ scale: orbScale }] }]}>
        <Animated.View style={[orbS.inner, {
          backgroundColor: isActive ? '#FF8A7A' : '#6B4EFF',
          opacity: innerOpacity,
        }]}>
          {/* Ghost symbol */}
          <Icon name="zap" size={22} color="#fff" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}
const orbS = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 8, height: 120 },
  ring3: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderColor: '#6B4EFF', top: -15 },
  ring2: { position: 'absolute', width: 124, height: 124, borderRadius: 62, borderWidth: 1, borderColor: '#9D8AFF', top: -2 },
  ring1: { position: 'absolute', width: 104, height: 104, borderRadius: 52, borderWidth: 2, borderColor: '#9D8AFF', top: 8 },
  orb: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(107,78,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 12, shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20,
  },
  inner: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
});

// ─── Ghost Recommendation Card ────────────────────────────────────────────────
function GhostRecommendCard({ title, subtitle, progress, onPress }: {
  title: string; subtitle: string; progress?: number; onPress: () => void;
}) {
  const { colors: C } = useTheme();
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={({ pressed }) => [recS.card, { backgroundColor: C.violet + 'EE', opacity: pressed ? 0.9 : 1 }]}>
      <View style={recS.topRow}>
        <View style={recS.badge}>
          <Icon name="zap" size={12} color="#fff" />
          <Text style={recS.badgeText}>Ghost Recommends</Text>
        </View>
        <Icon name="arrow-up-right" size={16} color="rgba(255,255,255,0.6)" />
      </View>
      <Text style={recS.title} numberOfLines={2}>{title}</Text>
      <Text style={recS.subtitle} numberOfLines={1}>{subtitle}</Text>
      {progress !== undefined && (
        <View style={recS.progressRow}>
          <View style={recS.progressBg}>
            <View style={[recS.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={recS.progressPct}>{progress}%</Text>
        </View>
      )}
    </Pressable>
  );
}
const recS = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, marginBottom: GAP, elevation: 6, shadowColor: '#6B4EFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  title: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  progressBg: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: '#fff', borderRadius: 3 },
  progressPct: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', minWidth: 32 },
});

// ─── Today's Briefing Card ────────────────────────────────────────────────────
function TodayBriefingCard({ tasks, meetings, deadline }: { tasks: number; meetings: number; deadline: number }) {
  const { colors: C } = useTheme();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/briefing'); }}
      style={({ pressed }) => [bfS.card, { backgroundColor: C.surface, borderColor: C.border, opacity: pressed ? 0.9 : 1 }]}>
      <View style={bfS.topRow}>
        <Text style={[bfS.date, { color: C.textMid }]}>{today}</Text>
        <View style={[bfS.dot, { backgroundColor: '#6EE7A0' }]} />
      </View>
      <Text style={[bfS.title, { color: C.text }]}>Today</Text>
      <View style={bfS.pills}>
        <View style={[bfS.pill, { backgroundColor: '#9D8AFF28' }]}>
          <Icon name="check" size={12} color="#9D8AFF" />
          <Text style={[bfS.pillText, { color: '#9D8AFF' }]}>{tasks} Tasks</Text>
        </View>
        <View style={[bfS.pill, { backgroundColor: '#5CE1E628' }]}>
          <Icon name="calendar" size={12} color="#5CE1E6" />
          <Text style={[bfS.pillText, { color: '#5CE1E6' }]}>{meetings} Meetings</Text>
        </View>
        <View style={[bfS.pill, { backgroundColor: '#FF8A7A28' }]}>
          <Icon name="bell" size={12} color="#FF8A7A" />
          <Text style={[bfS.pillText, { color: '#FF8A7A' }]}>{deadline} Deadline</Text>
        </View>
      </View>
    </Pressable>
  );
}
const bfS = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, marginBottom: GAP, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  date: { fontSize: 12, fontWeight: '600' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 12 },
  pills: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  pillText: { fontSize: 12, fontWeight: '700' },
});

// ─── Active Agents — compact bento card ──────────────────────────────────────
const AGENT_DEFS = [
  { name: 'Groq',    role: 'Primary',  color: '#9D8AFF' },
  { name: 'OpenAI',  role: 'Fallback', color: '#5CE1E6' },
] as const;

function ActiveAgentsWidget() {
  const { colors: C } = useTheme();
  // dot animations — native driver OK (opacity + scale only)
  const p0 = useRef(new Animated.Value(0)).current;
  const p1 = useRef(new Animated.Value(0)).current;
  // bar animation — JS driver required (width is not native-animatable)
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const mkDot = (p: Animated.Value, delay: number) => Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(p, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(p, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]));
    const mkBar = () => Animated.loop(Animated.sequence([
      Animated.timing(bar, { toValue: 1, duration: 1400, useNativeDriver: false }),
      Animated.timing(bar, { toValue: 0, duration: 1400, useNativeDriver: false }),
    ]));
    const a0 = mkDot(p0, 0);
    const a1 = mkDot(p1, 400);
    const ab = mkBar();
    a0.start(); a1.start(); ab.start();
    return () => { a0.stop(); a1.stop(); ab.stop(); };
  }, [p0, p1, bar]);

  const dotAnims = [p0, p1];

  return (
    <Pressable
      style={[aaS.card, { backgroundColor: C.surface, borderColor: C.border }]}
      onPress={() => router.push('/agents')}>
      <View style={aaS.topRow}>
        <Text style={[aaS.title, { color: C.text }]}>Agents</Text>
        <View style={[aaS.livePill, { backgroundColor: '#6EE7A022' }]}>
          <View style={aaS.liveDot} />
          <Text style={aaS.liveText}>2 running</Text>
        </View>
      </View>

      {AGENT_DEFS.map((a, i) => {
        const scale   = dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
        const opacity = dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });
        return (
          <View key={a.name} style={aaS.agentRow}>
            <View style={aaS.dotWrap}>
              <Animated.View style={[aaS.dotRing, { borderColor: a.color, transform: [{ scale }], opacity }]} />
              <View style={[aaS.dot, { backgroundColor: a.color }]} />
            </View>
            <Text style={[aaS.agentName, { color: C.text }]}>{a.name}</Text>
            <Text style={[aaS.agentRole, { color: C.textMid }]}>{a.role}</Text>
            <View style={[aaS.badge, { backgroundColor: a.color + '20' }]}>
              <Text style={[aaS.badgeText, { color: a.color }]}>Active</Text>
            </View>
          </View>
        );
      })}

      {/* Activity bar — JS driver, width interpolation */}
      <View style={[aaS.barBg, { backgroundColor: C.border }]}>
        <Animated.View style={[aaS.barFill, {
          backgroundColor: '#9D8AFF',
          width: bar.interpolate({ inputRange: [0, 1], outputRange: ['42%', '74%'] }),
        }]} />
      </View>
    </Pressable>
  );
}

const aaS = StyleSheet.create({
  card: { borderRadius: 18, padding: 14, marginBottom: GAP, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 14, fontWeight: '800' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6EE7A0' },
  liveText: { fontSize: 10, fontWeight: '700', color: '#6EE7A0' },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dotWrap: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  dotRing: { position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  agentName: { fontSize: 12, fontWeight: '700', minWidth: 72 },
  agentRole: { flex: 1, fontSize: 11, color: '#888' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  barBg: { height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  barFill: { height: 3, borderRadius: 2 },
});

// ─── Agent Activity Feed ──────────────────────────────────────────────────────
function ActivityFeedWidget() {
  const { colors: C } = useTheme();
  const thoughts = useGhostStore((s) => s.thoughts);
  const feed = useMemo(() => {
    if (thoughts.length > 0) {
      return thoughts.slice(0, 4).map((t) => ({
        id: t.id,
        time: new Date(t.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        label: t.message.slice(0, 48),
        color: '#9D8AFF',
      }));
    }
    return [
      { id: '1', time: '10:15 AM', label: 'WhatsApp sent',     color: '#6EE7A0' },
      { id: '2', time: '10:10 AM', label: 'Reminder created',  color: '#FFC857' },
      { id: '3', time: '10:00 AM', label: 'Workflow executed', color: '#9D8AFF' },
    ];
  }, [thoughts]);
  return (
    <View style={[fdS.card, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={fdS.header}>
        <Text style={[fdS.title, { color: C.text }]}>Agent Activity</Text>
        <Pressable onPress={() => router.push('/activity-logs')}>
          <Text style={[fdS.link, { color: C.violet }]}>All logs</Text>
        </Pressable>
      </View>
      {feed.map((item) => (
        <View key={item.id} style={fdS.row}>
          <View style={[fdS.dot, { backgroundColor: item.color }]} />
          <Text style={[fdS.time, { color: C.textLight }]}>{item.time}</Text>
          <Text style={[fdS.label, { color: C.text }]} numberOfLines={1}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
const fdS = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, marginBottom: GAP, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '800' },
  link: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  time: { fontSize: 11, fontWeight: '600', minWidth: 60 },
  label: { flex: 1, fontSize: 13, fontWeight: '500' },
});

// ─── Memory Snapshot + Active Goals (two-col row) ─────────────────────────────
function MemorySnapshotWidget() {
  const { colors: C } = useTheme();
  const thoughts = useGhostStore((s) => s.thoughts);
  const memories = Math.max(thoughts.length, 184);
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/memory'); }}
      style={({ pressed }) => [msS.card, { backgroundColor: C.surface, borderColor: C.border, opacity: pressed ? 0.9 : 1 }]}>
      <Text style={[msS.title, { color: C.text }]}>Memory</Text>
      <View style={msS.row}>
        <View style={[msS.stat, { backgroundColor: '#9D8AFF22' }]}>
          <Text style={[msS.num, { color: '#9D8AFF' }]}>12</Text>
          <Text style={[msS.lbl, { color: C.textMid }]}>Projects</Text>
        </View>
        <View style={[msS.stat, { backgroundColor: '#FFC85722' }]}>
          <Text style={[msS.num, { color: '#FFC857' }]}>{memories}</Text>
          <Text style={[msS.lbl, { color: C.textMid }]}>Memories</Text>
        </View>
      </View>
    </Pressable>
  );
}
const msS = StyleSheet.create({
  card: { width: HALF, borderRadius: 20, padding: 16, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 },
  title: { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  row: { gap: 8 },
  stat: { alignItems: 'center', paddingVertical: 8, borderRadius: 12, marginBottom: 4 },
  num: { fontSize: 20, fontWeight: '900' },
  lbl: { fontSize: 9, fontWeight: '700', marginTop: 2 },
});

const GOAL_COLORS = ['#9D8AFF', '#5CE1E6', '#FFC857', '#FF8A7A', '#6EE7A0', '#FF7EB6'];

function ActiveGoalsWidget() {
  const { colors: C } = useTheme();
  const [goals, setGoals] = useState<SavedGoal[]>([]);
  const [editing, setEditing] = useState<SavedGoal | null>(null);
  const [adding, setAdding] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editPct, setEditPct] = useState('');

  useEffect(() => { goalsStorage.list().then(setGoals); }, []);

  const openEdit = (g: SavedGoal) => {
    setEditing(g); setEditLabel(g.label); setEditPct(String(g.pct));
  };

  const saveEdit = async () => {
    if (!editing) return;
    const pct = Math.min(100, Math.max(0, parseInt(editPct, 10) || 0));
    await goalsStorage.update(editing.id, { label: editLabel.trim() || editing.label, pct });
    setGoals(await goalsStorage.list());
    setEditing(null);
  };

  const addGoal = async () => {
    if (!editLabel.trim()) return;
    const pct = Math.min(100, Math.max(0, parseInt(editPct, 10) || 0));
    const color = GOAL_COLORS[goals.length % GOAL_COLORS.length];
    await goalsStorage.add(editLabel.trim(), pct, color);
    setGoals(await goalsStorage.list());
    setAdding(false); setEditLabel(''); setEditPct('');
  };

  const deleteGoal = (id: string) => {
    Alert.alert('Delete goal?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await goalsStorage.remove(id);
        setGoals((g) => g.filter((x) => x.id !== id));
      }},
    ]);
  };

  return (
    <View style={[glS.card, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={glS.header}>
        <Text style={[glS.title, { color: C.text }]}>Goals</Text>
        <Pressable onPress={() => { setAdding(true); setEditLabel(''); setEditPct('0'); }}>
          <Text style={[glS.link, { color: C.violet }]}>+ Add</Text>
        </Pressable>
      </View>
      {goals.map((g) => (
        <Pressable key={g.id} style={glS.row} onPress={() => openEdit(g)}
          onLongPress={() => deleteGoal(g.id)}>
          <Text style={[glS.label, { color: C.text }]} numberOfLines={1}>{g.label}</Text>
          <View style={[glS.barBg, { backgroundColor: C.border }]}>
            <View style={[glS.barFill, { width: `${g.pct}%` as any, backgroundColor: g.color }]} />
          </View>
          <Text style={[glS.pct, { color: g.color }]}>{g.pct}%</Text>
        </Pressable>
      ))}

      <Modal visible={!!(editing || adding)} transparent animationType="fade"
        onRequestClose={() => { setEditing(null); setAdding(false); }}>
        <Pressable style={glS.overlay} onPress={() => { setEditing(null); setAdding(false); }}>
          <Pressable style={[glS.modal, { backgroundColor: C.surface, borderColor: C.border }]} onPress={() => {}}>
            <Text style={[glS.modalTitle, { color: C.text }]}>{adding ? 'Add Goal' : 'Edit Goal'}</Text>
            <TextInput style={[glS.modalInput, { color: C.text, borderColor: C.border }]}
              value={editLabel} onChangeText={setEditLabel}
              placeholder="Goal name" placeholderTextColor={C.textLight} />
            <TextInput style={[glS.modalInput, { color: C.text, borderColor: C.border }]}
              value={editPct} onChangeText={setEditPct}
              placeholder="Progress 0–100" placeholderTextColor={C.textLight}
              keyboardType="numeric" />
            <View style={glS.modalBtns}>
              <Pressable style={[glS.modalBtn, { backgroundColor: C.border }]}
                onPress={() => { setEditing(null); setAdding(false); }}>
                <Text style={[glS.modalBtnText, { color: C.textMid }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[glS.modalBtn, { backgroundColor: C.violet }]}
                onPress={adding ? addGoal : saveEdit}>
                <Text style={[glS.modalBtnText, { color: '#fff' }]}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const glS = StyleSheet.create({
  card: { flex: 1, borderRadius: 20, padding: 16, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 14, fontWeight: '800' },
  link: { fontSize: 12, fontWeight: '700' },
  row: { marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  barBg: { height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 2 },
  barFill: { height: 5, borderRadius: 3 },
  pct: { fontSize: 10, fontWeight: '800', textAlign: 'right' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  modal: { width: 300, borderRadius: 20, padding: 20, borderWidth: 1, gap: 12 },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  modalBtnText: { fontWeight: '700', fontSize: 14 },
});

// ─── Workflow Status ──────────────────────────────────────────────────────────
const WORKFLOWS = [
  { label: 'Morning Briefing', status: 'Active',    color: '#6EE7A0' },
  { label: 'Email Summary',    status: 'Scheduled', color: '#FFC857' },
] as const;

function WorkflowStatusWidget() {
  const { colors: C } = useTheme();
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/workflow-builder'); }}
      style={({ pressed }) => [wfS.card, { backgroundColor: C.surface, borderColor: C.border, opacity: pressed ? 0.9 : 1 }]}>
      <Text style={[wfS.title, { color: C.text }]}>Workflows</Text>
      {WORKFLOWS.map((w) => (
        <View key={w.label} style={wfS.row}>
          <View style={[wfS.dot, { backgroundColor: w.color }]} />
          <Text style={[wfS.label, { color: C.text }]}>{w.label}</Text>
          <View style={[wfS.badge, { backgroundColor: w.color + '28' }]}>
            <Text style={[wfS.badgeText, { color: w.color }]}>{w.status}</Text>
          </View>
        </View>
      ))}
    </Pressable>
  );
}
const wfS = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, marginBottom: GAP, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { flex: 1, fontSize: 14, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const S = useMemo(() => makeStyles(C), [C]);

  const predictions    = useGhostStore((s) => s.predictions);
  const user           = useGhostStore((s) => s.user);
  const setPredictions = useGhostStore((s) => s.setPredictions);
  const [loading, setLoading]       = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions().then(setPredictions);
    // Refresh recommendations every hour
    const interval = setInterval(() => fetchPredictions().then(setPredictions), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [setPredictions]);

  const run = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true); setActiveTask(text);
    try {
      const { finalMessage, thoughts } = await runGhost(text);
      thoughts.forEach((t) => useGhostStore.getState().addThought(t));
      speak(formatDisplayText(finalMessage));
    } catch (err) {
      speak(err instanceof Error ? err.message : 'Something went wrong.');
    } finally { setLoading(false); setActiveTask(null); }
  };

  const firstName = (() => { const n = user.name?.trim(); return n && n !== 'Guest' ? n.split(' ')[0] : 'there'; })();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const rec = predictions[0] ?? {
    title: 'Continue Railway Robot Proposal',
    subtitle: '67% Complete — tap to resume',
    action: 'continue railway robot proposal',
  };

  void activeTask;

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 110 }]}>

        {/* ── Header ── */}
        <View style={S.header}>
          <View>
            <Text style={S.greetSmall}>{greeting},</Text>
            <Text style={S.greetName}>Hi, {firstName}!</Text>
          </View>
          <View style={S.headerRight}>
            <Pressable style={S.iconBtn} onPress={() => router.push('/search')}>
              <Icon name="search" size={20} color={C.text} />
            </Pressable>
            <Pressable style={[S.iconBtn, { marginLeft: 8 }]} onPress={() => router.push('/profile')}>
              <View style={S.avatar}>
                <Text style={S.avatarText}>{firstName[0]?.toUpperCase()}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* ── Ghost Recommendation ── */}
        <GhostRecommendCard
          title={rec.title}
          subtitle={rec.subtitle ?? ''}
          progress={predictions[0] ? undefined : 67}
          onPress={() => run(rec.action ?? rec.title)}
        />

        {/* ── Today's Briefing ── */}
        <TodayBriefingCard tasks={3} meetings={2} deadline={1} />

        {/* ── AI Alert Banner (predictions[0]) ── */}
        {predictions[0] && (
          <Pressable
            style={[S.widget, { backgroundColor: C.ink, marginBottom: GAP }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); run(predictions[0].action ?? predictions[0].title); }}>
            <View style={S.alertRow}>
              <View style={[S.alertDot, { backgroundColor: C.yellow }]} />
              <Text style={S.alertLabel} numberOfLines={1}>{predictions[0].title.toUpperCase()}</Text>
              <View style={S.alertArrow}><Icon name="arrow-up-right" size={14} color={C.dark} /></View>
            </View>
            <Text style={S.alertSub} numberOfLines={2}>{predictions[0].subtitle}</Text>
          </Pressable>
        )}

        {/* ── Bento row 1: Credits + Tasks ── */}
        <View style={S.row}>
          <Pressable style={[S.half, { backgroundColor: C.violet, marginRight: GAP }]} onPress={() => router.push('/subscription')}>
            <Text style={S.labelLight}>CREDITS</Text>
            <Text style={S.bigLight}>{user.creditsTotal - user.creditsUsed}</Text>
            <Text style={S.subLight}>of {user.creditsTotal} left</Text>
            <View style={S.creditBar}>
              <View style={[S.creditFill, { width: `${Math.max(4, ((user.creditsTotal - user.creditsUsed) / user.creditsTotal) * 100)}%` }]} />
            </View>
          </Pressable>
          <Pressable style={[S.half, { backgroundColor: C.yellow }]} onPress={() => router.push('/tasks')}>
            <Text style={S.labelDark}>TASKS</Text>
            <Text style={[S.bigDark, { fontSize: 28 }]}>Active</Text>
            <View style={{ marginTop: 8 }}>
              <View style={[S.tag, { backgroundColor: 'rgba(0,0,0,0.12)' }]}><Text style={[S.tagText, { color: C.dark }]}>Planner</Text></View>
              <View style={[S.tag, { backgroundColor: 'rgba(0,0,0,0.12)' }]}><Text style={[S.tagText, { color: C.dark }]}>Executor</Text></View>
            </View>
          </Pressable>
        </View>

        {/* ── Active Agents ── */}
        <ActiveAgentsWidget />

        {/* ── Bento: Memory wide card ── */}
        <Pressable style={[S.widget, { backgroundColor: C.coral, marginBottom: GAP }]} onPress={() => router.push('/memory')}>
          <View style={S.wideRow}>
            <View style={{ flex: 1 }}>
              <Text style={S.labelLight}>MEMORY</Text>
              <Text style={S.wideTitle}>Knowledge{'\n'}Graph</Text>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 6 }}>
                <View style={[S.tag, { backgroundColor: 'rgba(255,255,255,0.25)' }]}><Text style={[S.tagText, { color: '#fff' }]}>Semantic</Text></View>
                <View style={[S.tag, { backgroundColor: 'rgba(255,255,255,0.25)' }]}><Text style={[S.tagText, { color: '#fff' }]}>Episodic</Text></View>
              </View>
            </View>
            <Pressable style={S.wideArrow} onPress={() => router.push('/knowledge-graph')}>
              <Icon name="arrow-up-right" size={16} color={C.coral} />
            </Pressable>
          </View>
        </Pressable>

        {/* ── Bento row 2: Voice + Briefing ── */}
        <View style={S.row}>
          <Pressable style={[S.half, { backgroundColor: C.mint, marginRight: GAP }]} onPress={() => router.push('/voice')}>
            <Text style={S.labelDark}>VOICE</Text>
            <View style={S.voiceOrb}><Icon name="mic" size={28} color={C.mint} /></View>
            <Text style={[S.subDark, { marginTop: 8 }]}>Tap to speak</Text>
          </Pressable>
          <Pressable style={[S.half, { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border }]} onPress={() => router.push('/briefing')}>
            <Text style={[S.labelDark, { color: C.textMid }]}>BRIEFING</Text>
            <Text style={[S.bigDark, { fontSize: 18, lineHeight: 24 }]}>Daily{'\n'}Digest</Text>
            <View style={{ marginTop: 8 }}>
              <View style={[S.tag, { backgroundColor: C.violet + '1E' }]}><Text style={[S.tagText, { color: C.violet }]}>Ready</Text></View>
            </View>
          </Pressable>
        </View>

        {/* ── Quick Actions ── */}
        <Text style={S.sectionLabel}>QUICK ACTIONS</Text>
        <View style={[S.row, { marginBottom: GAP }]}>
          <Pressable style={[S.quickBtn, { backgroundColor: C.ink, flex: 1, marginRight: GAP / 2 }]} onPress={() => run("text Mom I'm reaching in 10min")}>
            <Icon name="message-circle" size={18} color="#fff" />
            <Text style={S.quickBtnText}>Text Mom</Text>
          </Pressable>
          <Pressable style={[S.quickBtn, { backgroundColor: C.orange, flex: 1, marginLeft: GAP / 2 }]} onPress={() => run('book cab to station')}>
            <Icon name="navigation" size={18} color="#fff" />
            <Text style={S.quickBtnText}>Book Cab</Text>
          </Pressable>
        </View>

        {/* ── Agent Activity Feed ── */}
        <ActivityFeedWidget />

        {/* ── Memory Snapshot + Goals (two-col) ── */}
        <View style={[S.row, { alignItems: 'flex-start', marginBottom: GAP }]}>
          <MemorySnapshotWidget />
          <View style={{ width: GAP }} />
          <ActiveGoalsWidget />
        </View>

        {/* ── Workflow Status ── */}
        <WorkflowStatusWidget />

        {/* ── Predictions list ── */}
        {predictions.slice(1).map((p) => (
          <Pressable
            key={p.id}
            style={[S.widget, { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, marginBottom: GAP }]}
            onPress={() => run(p.action ?? p.title)}>
            <View style={S.predRow}>
              <View style={[S.predDot, { backgroundColor: C.violet }]} />
              <View style={{ flex: 1 }}>
                <Text style={[S.predTitle, { color: C.text }]}>{p.title}</Text>
                <Text style={[S.predSub, { color: C.textMid }]} numberOfLines={2}>{p.subtitle}</Text>
              </View>
              <View style={[S.predArrow, { backgroundColor: C.bg }]}>
                <Icon name="arrow-up-right" size={14} color={C.dark} />
              </View>
            </View>
          </Pressable>
        ))}

        {/* ── Nav shortcuts ── */}
        <Text style={S.sectionLabel}>MORE</Text>
        <View style={S.shortcutGrid}>
          {([
            { label: 'Command',   icon: 'terminal',   route: '/command-center',   bg: C.violet },
            { label: 'Calendar',  icon: 'calendar',   route: '/calendar',         bg: C.coral  },
            { label: 'Notes',     icon: 'file-text',  route: '/notes',            bg: C.mint   },
            { label: 'Workflows', icon: 'git-branch', route: '/workflow-builder', bg: C.yellow },
          ] as const).map((item) => (
            <Pressable
              key={item.route}
              style={[S.shortcut, { backgroundColor: item.bg }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(item.route as any); }}>
              <Icon name={item.icon as any} size={22} color={item.bg === C.yellow ? C.dark : '#fff'} />
              <Text style={[S.shortcutLabel, { color: item.bg === C.yellow ? C.dark : '#fff' }]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    scroll: { paddingHorizontal: 16, paddingTop: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    greetSmall: { fontSize: 13, color: C.textMid, fontWeight: '500' },
    greetName: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.violet, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    // widget base
    widget: { borderRadius: 24, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    // alert banner
    alertRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    alertDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    alertLabel: { flex: 1, color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
    alertArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.yellow, justifyContent: 'center', alignItems: 'center' },
    alertSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 },
    // row layout
    row: { flexDirection: 'row', marginBottom: GAP },
    half: { width: HALF, borderRadius: 24, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    // typography
    labelLight: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
    labelDark: { color: 'rgba(0,0,0,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
    bigLight: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -1 },
    bigDark: { color: C.dark, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    subLight: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
    subDark: { color: 'rgba(0,0,0,0.5)', fontSize: 12 },
    // credit bar
    creditBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 12, overflow: 'hidden' },
    creditFill: { height: 4, backgroundColor: '#fff', borderRadius: 2 },
    // tag
    tag: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
    tagText: { fontSize: 11, fontWeight: '700' },
    // wide card
    wideRow: { flexDirection: 'row', alignItems: 'flex-start' },
    wideTitle: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 4 },
    wideArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
    // voice orb
    voiceOrb: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.ink, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    // quick buttons
    quickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
    quickBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    // predictions
    predRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    predDot: { width: 10, height: 10, borderRadius: 5 },
    predTitle: { fontWeight: '700', fontSize: 15 },
    predSub: { fontSize: 13, marginTop: 2 },
    predArrow: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    // section label
    sectionLabel: { fontSize: 11, fontWeight: '800', color: C.textLight, letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },
    // shortcut grid
    shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    shortcut: { width: HALF, borderRadius: 20, padding: 18, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
    shortcutLabel: { fontSize: 14, fontWeight: '700' },
  });
}
