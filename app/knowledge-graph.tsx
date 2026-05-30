import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { formatDisplayText } from '@/lib/displayText';
import { memory } from '@/lib/memory';
import type { MemoryRecord } from '@/types';
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
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const TYPE_META: Record<string, {
  color: string; bg: string; darkBg: string;
  icon: 'brain' | 'activity' | 'sparkles' | 'user' | 'git-branch' | 'file-text' | 'zap' | 'search';
}> = {
  semantic:   { color: L.violet,  bg: 'rgba(91,79,232,0.10)',   darkBg: L.violet,  icon: 'brain' },
  episodic:   { color: L.coral,   bg: 'rgba(232,80,58,0.10)',   darkBg: L.coral,   icon: 'activity' },
  preference: { color: L.orange,  bg: 'rgba(240,122,58,0.10)',  darkBg: L.orange,  icon: 'sparkles' },
  person:     { color: L.mint,    bg: 'rgba(62,207,178,0.10)',  darkBg: L.mint,    icon: 'user' },
  project:    { color: '#3A8EF0', bg: 'rgba(58,142,240,0.10)',  darkBg: '#3A8EF0', icon: 'git-branch' },
  task:       { color: L.yellow,  bg: 'rgba(245,200,66,0.15)',  darkBg: '#D4A800', icon: 'file-text' },
  sms:        { color: '#E040FB', bg: 'rgba(224,64,251,0.10)',  darkBg: '#E040FB', icon: 'search' },
  email:      { color: '#00BCD4', bg: 'rgba(0,188,212,0.10)',   darkBg: '#00BCD4', icon: 'search' },
};

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// 3D bubble cluster
function BubbleCluster({ grouped }: { grouped: Record<string, MemoryRecord[]> }) {
  const entries = Object.entries(grouped).slice(0, 6);
  const total = Object.values(grouped).reduce((s, a) => s + a.length, 0);
  const cx = (width - 32) / 2;

  const positions = [
    { top: 10, left: cx - 60 },
    { top: 0,  left: cx + 10 },
    { top: 40, left: cx + 55 },
    { top: 95, left: cx - 80 },
    { top: 100, left: cx + 20 },
    { top: 60, left: cx + 70 },
  ];
  const sizes = [60, 50, 46, 54, 42, 48];

  return (
    <View style={clusterS.wrap}>
      <View style={clusterS.hub}>
        <Text style={clusterS.hubNum}>{total}</Text>
        <Text style={clusterS.hubLabel}>nodes</Text>
      </View>
      {entries.map(([type, nodes], i) => {
        const meta = TYPE_META[type] ?? { darkBg: L.dark };
        const size = sizes[i] ?? 44;
        const pos = positions[i] ?? { top: 60, left: 60 };
        return (
          <View key={type} style={[clusterS.bubble, {
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: meta.darkBg,
            top: pos.top, left: pos.left - size / 2,
            shadowColor: meta.darkBg,
          }]}>
            <Text style={clusterS.bubbleNum}>{nodes.length}</Text>
            <Text style={clusterS.bubbleType}>{type.slice(0, 3)}</Text>
          </View>
        );
      })}
      <View style={[clusterS.line, { width: 55, top: 78, left: cx - 85, transform: [{ rotate: '28deg' }] }]} />
      <View style={[clusterS.line, { width: 48, top: 58, left: cx - 18, transform: [{ rotate: '-18deg' }] }]} />
      <View style={[clusterS.line, { width: 52, top: 88, left: cx + 22, transform: [{ rotate: '12deg' }] }]} />
    </View>
  );
}

export default function KnowledgeGraphScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<MemoryRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  const load = () => memory.list(100).then(setItems);
  useEffect(() => { load(); }, []);

  const grouped = items.reduce<Record<string, MemoryRecord[]>>((acc, item) => {
    const key = item.type ?? 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const totalNodes = items.length;
  const totalTypes = Object.keys(grouped).length;
  const displayNodes = selected ? (grouped[selected] ?? []) : items.slice(0, 20);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Knowledge Graph</Text>
          <Text style={styles.subtitle}>{totalNodes} nodes · {totalTypes} types</Text>
        </View>
        <Pressable style={styles.refreshBtn} onPress={load}>
          <Icon name="activity" size={16} color={L.violet} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {totalNodes > 0 && <BubbleCluster grouped={grouped} />}

        {/* Stats bar */}
        <View style={styles.statsBar}>
          {[
            { label: 'Total',    value: totalNodes,                                    color: L.violet },
            { label: 'Types',    value: totalTypes,                                    color: L.coral },
            { label: 'Episodic', value: items.filter(i => i.type === 'episodic').length, color: L.mint },
            { label: 'Semantic', value: items.filter(i => i.type === 'semantic').length, color: L.orange },
          ].map((s) => (
            <View key={s.label} style={[styles.statItem, { borderTopColor: s.color }]}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Type cards */}
        {totalNodes > 0 && (
          <>
            <Text style={styles.sectionLabel}>NODE TYPES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeCardScroll}>
              {Object.entries(grouped).map(([type, nodes]) => {
                const meta = TYPE_META[type] ?? { color: L.dark, darkBg: L.dark, bg: 'rgba(0,0,0,0.06)', icon: 'brain' as const };
                const active = selected === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => { setSelected(active ? null : type); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                    <View style={[typeCardS.shadow, { backgroundColor: meta.darkBg + '30' }]} />
                    <View style={[typeCardS.card, active && { borderColor: meta.color, borderWidth: 2 }]}>
                      <View style={[typeCardS.strip, { backgroundColor: meta.darkBg }]}>
                        <Icon name={meta.icon} size={20} color="#fff" />
                        <Text style={typeCardS.stripCount}>{nodes.length}</Text>
                      </View>
                      <View style={typeCardS.body}>
                        <Text style={[typeCardS.typeName, { color: meta.color }]}>{type.toUpperCase()}</Text>
                        <Text style={typeCardS.typeDesc} numberOfLines={1}>
                          {formatDisplayText(nodes[0]?.text ?? '').slice(0, 28)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Node list */}
        <View style={styles.nodeSection}>
          <View style={styles.nodeSectionHeader}>
            <Text style={styles.sectionLabel}>
              {selected ? `${selected.toUpperCase()} NODES` : 'RECENT NODES'}
            </Text>
            {selected && (
              <Pressable onPress={() => setSelected(null)}>
                <Text style={styles.clearFilter}>Clear</Text>
              </Pressable>
            )}
          </View>

          {totalNodes === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyOrb}>
                <View style={styles.emptyOrbInner}>
                  <Icon name="brain" size={28} color={L.violet} />
                </View>
              </View>
              <Text style={styles.emptyTitle}>Graph is empty</Text>
              <Text style={styles.emptyBody}>Add memories or run commands to populate your knowledge graph.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/memory')}>
                <Text style={styles.emptyBtnText}>Go to Memory</Text>
              </Pressable>
            </View>
          ) : (
            displayNodes.map((node, idx) => {
              const meta = TYPE_META[node.type] ?? { color: L.dark, darkBg: L.dark, bg: 'rgba(0,0,0,0.06)', icon: 'brain' as const };
              const isExpanded = expandedNode === node.id;
              return (
                <Pressable
                  key={node.id}
                  style={[styles.nodeCard, { borderLeftColor: meta.color }]}
                  onPress={() => setExpandedNode(isExpanded ? null : node.id)}>
                  <View style={[styles.nodeDepth, { backgroundColor: meta.color + '20' }]}>
                    <Text style={[styles.nodeDepthNum, { color: meta.color }]}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nodeTop}>
                      <View style={[styles.nodeTypeBadge, { backgroundColor: meta.bg }]}>
                        <Icon name={meta.icon} size={10} color={meta.color} />
                        <Text style={[styles.nodeTypeText, { color: meta.color }]}>{node.type.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.nodeTime}>{timeAgo(node.timestamp)}</Text>
                    </View>
                    <Text style={styles.nodeText} numberOfLines={isExpanded ? undefined : 2}>
                      {formatDisplayText(node.text)}
                    </Text>
                    {isExpanded && node.source && (
                      <Text style={styles.nodeSource}>Source: {node.source}</Text>
                    )}
                  </View>
                </Pressable>
              );
            })
          )}

          {!selected && totalNodes > 20 && (
            <Pressable style={styles.loadMoreBtn} onPress={() => router.push('/memory')}>
              <Text style={styles.loadMoreText}>View all {totalNodes} nodes in Memory</Text>
              <Icon name="forward" size={14} color={L.violet} />
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const clusterS = StyleSheet.create({
  wrap: { height: 180, marginHorizontal: 16, marginBottom: 16, position: 'relative' },
  hub: { position: 'absolute', top: 50, left: (width - 32) / 2 - 32, width: 64, height: 64, borderRadius: 32, backgroundColor: L.dark, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8, zIndex: 10 },
  hubNum: { color: '#fff', fontSize: 18, fontWeight: '800' },
  hubLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9 },
  bubble: { position: 'absolute', alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6, zIndex: 5 },
  bubbleNum: { color: '#fff', fontSize: 13, fontWeight: '800' },
  bubbleType: { color: 'rgba(255,255,255,0.75)', fontSize: 8, fontWeight: '700' },
  line: { position: 'absolute', height: 1.5, backgroundColor: L.border, zIndex: 1 },
});

const typeCardS = StyleSheet.create({
  shadow: { position: 'absolute', bottom: -4, left: 4, right: 4, height: '100%', borderRadius: 18, zIndex: 0 },
  card: { width: 110, backgroundColor: L.surface, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 10, elevation: 5, zIndex: 1, borderWidth: 1, borderColor: L.border },
  strip: { height: 52, alignItems: 'center', justifyContent: 'center', gap: 2 },
  stripCount: { color: '#fff', fontSize: 16, fontWeight: '800' },
  body: { padding: 10 },
  typeName: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 3 },
  typeDesc: { color: L.textLight, fontSize: 10, lineHeight: 14 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { color: L.textMid, fontSize: 12 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(91,79,232,0.10)', alignItems: 'center', justifyContent: 'center' },
  statsBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: L.surface, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14, borderTopWidth: 3 },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: L.textLight, marginTop: 2, fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: L.textLight, letterSpacing: 1.2, paddingHorizontal: 16, marginBottom: 10 },
  typeCardScroll: { paddingHorizontal: 16, gap: 10, paddingBottom: 4, marginBottom: 16 },
  nodeSection: { paddingHorizontal: 16 },
  nodeSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clearFilter: { color: L.violet, fontSize: 13, fontWeight: '700' },
  nodeCard: { flexDirection: 'row', gap: 12, backgroundColor: L.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  nodeDepth: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  nodeDepthNum: { fontSize: 11, fontWeight: '800' },
  nodeTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  nodeTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  nodeTypeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  nodeTime: { fontSize: 10, color: L.textLight, marginLeft: 'auto' },
  nodeText: { color: L.dark, fontSize: 13, lineHeight: 19 },
  nodeSource: { color: L.textLight, fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  loadMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: 'rgba(91,79,232,0.08)', borderRadius: 16, marginTop: 4 },
  loadMoreText: { color: L.violet, fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 40, gap: 12, paddingHorizontal: 32 },
  emptyOrb: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(91,79,232,0.08)', alignItems: 'center', justifyContent: 'center' },
  emptyOrbInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(91,79,232,0.12)', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: L.dark },
  emptyBody: { color: L.textMid, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { backgroundColor: L.violet, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
