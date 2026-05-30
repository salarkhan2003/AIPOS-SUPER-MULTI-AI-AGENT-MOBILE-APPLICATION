import { Icon } from '@/components/Icon';
import { formatDisplayText } from '@/lib/displayText';
import { useTheme } from '@/lib/themeContext';
import { memory } from '@/lib/memory';
import { notifyLocal } from '@/lib/notifications-local';
import type { MemoryRecord } from '@/types';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function typeMeta(C: ReturnType<typeof useTheme>['colors']) {
  return {
    semantic: { color: C.violet, bg: C.violet + '1A', icon: 'brain' as const },
    episodic: { color: C.coral, bg: C.coral + '1A', icon: 'activity' as const },
    preference: { color: C.orange, bg: C.orange + '1A', icon: 'sparkles' as const },
    person: { color: C.mint, bg: C.mint + '1A', icon: 'user' as const },
    project: { color: C.blue, bg: C.blue + '1A', icon: 'git-branch' as const },
    task: { color: C.yellow, bg: C.yellow + '28', icon: 'file-text' as const },
  };
}

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function MemoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const TYPE_META = useMemo(() => typeMeta(C), [C]);
  const [items, setItems] = useState<MemoryRecord[]>([]);
  const [query, setQuery] = useState('');
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [activeType, setActiveType] = useState<string>('all');

  const refresh = async () => {
    const data = query.trim()
      ? await memory.search(query, 30)
      : await memory.list(60);
    setItems(data);
  };

  useEffect(() => { refresh(); }, [query]);

  const add = async () => {
    if (!input.trim()) return;
    setAdding(true);
    await memory.add(input.trim(), 'semantic');
    await notifyLocal('Memory saved', input.trim().slice(0, 60), {}, 'task');
    setInput('');
    await refresh();
    setAdding(false);
  };

  const del = (id: string) => {
    Alert.alert('Delete memory?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await memory.remove(id); refresh(); } },
    ]);
  };

  const types = ['all', ...Array.from(new Set(items.map((i) => i.type)))];
  const filtered = activeType === 'all' ? items : items.filter((i) => i.type === activeType);

  const counts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Memory</Text>
          <Text style={styles.subtitle}>{items.length} records in graph</Text>
        </View>
        <Pressable style={styles.graphBtn} onPress={() => router.push('/knowledge-graph')}>
          <Icon name="brain" size={15} color={C.coral} />
          <Text style={styles.graphText}>Graph</Text>
        </Pressable>
      </View>

      {/* Type stats */}
      {Object.keys(counts).length > 0 && (
        <View style={styles.statsScroll}>
          {Object.entries(counts).map(([type, count]) => {
            const meta = TYPE_META[type as keyof typeof TYPE_META] ?? { color: C.text, bg: C.border, icon: 'brain' as const };
            return (
              <View key={type} style={[styles.statChip, { backgroundColor: meta.bg }]}>
                <Text style={[styles.statChipNum, { color: meta.color }]}>{count}</Text>
                <Text style={[styles.statChipLabel, { color: meta.color }]}>{type}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Search + add */}
      <View style={styles.inputArea}>
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color={C.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search memories…"
            placeholderTextColor={C.textLight}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Icon name="close" size={14} color={C.textLight} />
            </Pressable>
          )}
        </View>
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Add a memory…"
            placeholderTextColor={C.textLight}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={add}
            returnKeyType="done"
          />
          <Pressable
            style={[styles.addBtn, { opacity: adding ? 0.7 : 1 }]}
            onPress={add} disabled={adding}>
            <Icon name="check" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Type filter */}
      {types.length > 1 && (
        <View style={styles.typeFilters}>
          {types.map((t) => (
            <Pressable
              key={t}
              style={[styles.typeChip, activeType === t && styles.typeChipActive]}
              onPress={() => setActiveType(t)}>
              <Text style={[styles.typeChipText, activeType === t && styles.typeChipTextActive]}>
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="brain" size={28} color={C.textLight} />
            </View>
            <Text style={styles.emptyTitle}>
              {query ? `No results for "${query}"` : 'No memories yet'}
            </Text>
            <Text style={styles.emptyBody}>
              {query ? 'Try a different search term.' : 'Add a memory above or run commands to build your graph.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = TYPE_META[item.type as keyof typeof TYPE_META] ?? { color: C.text, bg: C.border, icon: 'brain' as const };
          const text = formatDisplayText(item.text);
          return (
            <Pressable style={styles.card} onLongPress={() => del(item.id)}>
              <View style={[styles.typeIcon, { backgroundColor: meta.bg }]}>
                <Icon name={meta.icon} size={16} color={meta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.typeText, { color: meta.color }]}>{item.type.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.timeText}>{timeAgo(item.timestamp)}</Text>
                </View>
                <Text style={styles.memText} numberOfLines={3}>{text}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  subtitle: { color: C.textMid, fontSize: 13, marginTop: 2 },
  graphBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(232,80,58,0.10)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  graphText: { color: C.coral, fontWeight: '700', fontSize: 13 },
  statsScroll: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statChipNum: { fontSize: 13, fontWeight: '800' },
  statChipLabel: { fontSize: 11, fontWeight: '600' },
  inputArea: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, fontSize: 15, color: C.text },
  addRow: { flexDirection: 'row', gap: 10 },
  addInput: { flex: 1, backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: C.text, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  addBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  typeFilters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  typeChipActive: { backgroundColor: C.ink, borderColor: C.ink },
  typeChipText: { fontSize: 12, fontWeight: '600', color: C.textMid },
  typeChipTextActive: { color: '#fff' },
  card: { flexDirection: 'row', gap: 12, backgroundColor: C.surface, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  typeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  timeText: { fontSize: 10, color: C.textLight, marginLeft: 'auto' },
  memText: { color: C.text, fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', marginTop: 60, gap: 10, paddingHorizontal: 32 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  emptyBody: { color: C.textMid, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  });
}
