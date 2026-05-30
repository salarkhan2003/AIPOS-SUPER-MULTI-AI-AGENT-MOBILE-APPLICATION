import { Icon } from '@/components/Icon';
import { NeuralLog3DHub } from '@/components/NeuralLog3DHub';
import { NeuralLogCard } from '@/components/NeuralLogCard';
import { formatDisplayText } from '@/lib/displayText';
import { EVENTS, ghostEvents } from '@/lib/events';
import { useTheme } from '@/lib/themeContext';
import { useGhostStore } from '@/store/ghostStore';
import type { AgentRole, ThoughtEvent } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AgentMetaMap = Record<string, {
  color: string;
  bg: string;
  icon: 'brain' | 'zap' | 'memory' | 'search' | 'check' | 'shield' | 'mail' | 'git-branch';
  label: string;
}>;

function useAgentMeta(C: ReturnType<typeof useTheme>['colors']): AgentMetaMap {
  return useMemo(
    () => ({
      planner: { color: C.violet, bg: C.violet, icon: 'brain', label: 'Planner' },
      executor: { color: C.coral, bg: C.coral, icon: 'zap', label: 'Executor' },
      memory: { color: C.mint, bg: C.mint, icon: 'memory', label: 'Memory' },
      research: { color: C.orange, bg: C.orange, icon: 'search', label: 'Research' },
      verifier: { color: C.yellow, bg: C.yellow, icon: 'check', label: 'Verifier' },
      security: { color: C.blue, bg: C.blue, icon: 'shield', label: 'Security' },
      communication: { color: '#E040FB', bg: '#E040FB', icon: 'mail', label: 'Comms' },
      workflow: { color: '#00BCD4', bg: '#00BCD4', icon: 'git-branch', label: 'Workflow' },
    }),
    [C],
  );
}

export default function CommandCenterScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const AGENT_META = useAgentMeta(C);
  const styles = useMemo(() => makeStyles(C), [C]);

  const thoughts = useGhostStore((s) => s.thoughts);
  const addThought = useGhostStore((s) => s.addThought);
  const [filter, setFilter] = useState<AgentRole | 'all'>('all');

  useEffect(() => {
    return ghostEvents.on(EVENTS.THOUGHT, (t) => addThought(t as ThoughtEvent));
  }, [addThought]);

  const filtered = filter === 'all' ? thoughts : thoughts.filter((t) => t.agent === filter);
  const agentsPresent = [...new Set(thoughts.map((t) => t.agent))] as AgentRole[];

  const agentCounts = thoughts.reduce<Record<string, number>>((acc, t) => {
    acc[t.agent] = (acc[t.agent] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.bgLayer} pointerEvents="none">
        <LinearGradient
          colors={[C.violet + (isDark ? '35' : '25'), 'transparent']}
          style={[styles.bgOrb, styles.bgOrb1]}
        />
        <LinearGradient
          colors={[C.mint + (isDark ? '30' : '20'), 'transparent']}
          style={[styles.bgOrb, styles.bgOrb2]}
        />
        <LinearGradient
          colors={[C.coral + (isDark ? '28' : '18'), 'transparent']}
          style={[styles.bgOrb, styles.bgOrb3]}
        />
      </View>

      <View style={styles.contentLayer}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Icon name="back" size={20} color={C.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.title} numberOfLines={1}>Neural Log</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {thoughts.length} thoughts · {agentsPresent.length} agents
            </Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <NeuralLog3DHub
          C={C}
          isDark={isDark}
          thoughtCount={thoughts.length}
          agentCount={agentsPresent.length}
        />

        {Object.keys(agentCounts).length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}>
            {Object.entries(agentCounts).map(([agent, count]) => {
              const meta = AGENT_META[agent] ?? { color: C.violet, bg: C.violet, icon: 'zap' as const, label: agent };
              return (
                <View
                  key={agent}
                  style={[styles.agentChip, { backgroundColor: meta.bg + '22', borderColor: meta.color + '45' }]}>
                  <View style={[styles.agentChipDot, { backgroundColor: meta.bg }]}>
                    <Icon name={meta.icon} size={11} color="#fff" />
                  </View>
                  <Text style={[styles.agentChipLabel, { color: meta.color }]}>{meta.label}</Text>
                  <Text style={[styles.agentChipCount, { color: meta.color }]}>{count}</Text>
                </View>
              );
            })}
          </ScrollView>
        ) : null}

        {agentsPresent.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}>
            <Pressable
              style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
              onPress={() => {
                setFilter('all');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}>
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
            </Pressable>
            {agentsPresent.map((agent) => {
              const meta = AGENT_META[agent];
              const active = filter === agent;
              return (
                <Pressable
                  key={agent}
                  style={[
                    styles.filterPill,
                    active && { backgroundColor: meta?.color ?? C.ink, borderColor: meta?.color ?? C.ink },
                  ]}
                  onPress={() => {
                    setFilter(agent);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}>
                  <Text style={[styles.filterText, active && { color: '#fff' }]}>
                    {AGENT_META[agent]?.label ?? agent}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <FlatList
          style={styles.list}
          data={filtered}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          ListHeaderComponent={
            filtered.length > 0 ? (
              <Text style={[styles.streamLabel, { color: C.textLight }]}>AGENT STREAM</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <LinearGradient colors={[C.violet + '30', C.violet + '08']} style={styles.emptyOrb}>
                <View style={styles.emptyOrbInner}>
                  <Icon name="network" size={28} color={C.violet} />
                </View>
              </LinearGradient>
              <Text style={styles.emptyTitle}>Neural log is quiet</Text>
              <Text style={styles.emptyBody}>
                Run a command from Home or Voice to see agent thoughts here in real time.
              </Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.back()}>
                <Text style={styles.emptyBtnText}>Go to Home</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item, index }) => {
            const meta = AGENT_META[item.agent] ?? { ...AGENT_META.planner, label: item.agent };
            return (
              <NeuralLogCard
                item={item}
                index={index}
                meta={meta}
                message={formatDisplayText(item.message)}
                C={C}
                isDark={isDark}
              />
            );
          }}
        />
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    bgLayer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
    bgOrb: { position: 'absolute', borderRadius: 999, width: 240, height: 240 },
    bgOrb1: { top: -60, right: -80 },
    bgOrb2: { top: 140, left: -90, width: 200, height: 200 },
    bgOrb3: { bottom: 60, right: -40, width: 160, height: 160 },
    contentLayer: { flex: 1, zIndex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,
      gap: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.surface,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      borderWidth: 1,
      borderColor: C.border,
    },
    headerCenter: { flex: 1, minWidth: 0 },
    title: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
    subtitle: { color: C.textMid, fontSize: 12, marginTop: 2 },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: C.mint + '28',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.mint + '40',
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.mint },
    liveText: { color: C.mint, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
    chipsScroll: { maxHeight: 48, marginBottom: 6 },
    chipsContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center', paddingVertical: 4 },
    agentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    agentChipDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    agentChipLabel: { fontSize: 11, fontWeight: '700' },
    agentChipCount: { fontSize: 12, fontWeight: '800' },
    filterScroll: { maxHeight: 44, marginBottom: 8 },
    filterContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center', paddingVertical: 4 },
    filterPill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
    },
    filterPillActive: { backgroundColor: C.ink, borderColor: C.ink },
    filterText: { fontSize: 12, fontWeight: '700', color: C.textMid },
    filterTextActive: { color: '#fff' },
    list: { flex: 1 },
    listContent: { paddingHorizontal: 14, paddingBottom: 48, flexGrow: 1 },
    streamLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.4,
      marginBottom: 10,
      marginLeft: 4,
    },
    empty: { alignItems: 'center', marginTop: 48, gap: 12, paddingHorizontal: 32 },
    emptyOrb: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyOrbInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: C.surface,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: C.text },
    emptyBody: { color: C.textMid, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    emptyBtn: { backgroundColor: C.violet, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 4 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  });
}
