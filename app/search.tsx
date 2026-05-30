import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { listAuditLogs } from '@/lib/audit';
import { formatDisplayText } from '@/lib/displayText';
import { memory } from '@/lib/memory';
import { notesStorage } from '@/lib/storage';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    FlatList,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ResultItem = { id: string; type: 'memory' | 'note' | 'task'; title: string; body: string; color: string };

const TYPE_COLOR = { memory: L.violet, note: L.orange, task: L.coral };
const TYPE_ICON = { memory: 'brain' as const, note: 'file-text' as const, task: 'zap' as const };

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const doSearch = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [mems, notes, logs] = await Promise.all([
        memory.search(q, 10),
        notesStorage.list(),
        listAuditLogs(50),
      ]);

      const memResults: ResultItem[] = mems.map((m) => ({
        id: m.id, type: 'memory', color: L.violet,
        title: m.type.charAt(0).toUpperCase() + m.type.slice(1) + ' memory',
        body: formatDisplayText(m.text).slice(0, 120),
      }));

      const noteResults: ResultItem[] = notes
        .filter((n) => n.title.toLowerCase().includes(q.toLowerCase()) || n.body.toLowerCase().includes(q.toLowerCase()))
        .map((n) => ({ id: n.id, type: 'note', color: L.orange, title: n.title, body: n.body.slice(0, 100) }));

      const taskResults: ResultItem[] = logs
        .filter((l) => l.action.includes(q.toLowerCase()) || formatDisplayText(l.result ?? '').toLowerCase().includes(q.toLowerCase()))
        .slice(0, 5)
        .map((l) => ({ id: l.id, type: 'task', color: L.coral, title: l.action.replace(/_/g, ' '), body: formatDisplayText(l.result ?? '').slice(0, 100) }));

      setResults([...memResults, ...noteResults, ...taskResults]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color={L.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search memories, notes, tasks…"
            placeholderTextColor={L.textLight}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={doSearch}
            returnKeyType="search"
            autoFocus
          />
          {q.length > 0 && (
            <Pressable onPress={() => { setQ(''); setResults([]); setSearched(false); }}>
              <Icon name="close" size={16} color={L.textLight} />
            </Pressable>
          )}
        </View>
        <Pressable style={[styles.goBtn, { opacity: loading ? 0.7 : 1 }]} onPress={doSearch} disabled={loading}>
          <Text style={styles.goBtnText}>{loading ? '…' : 'Go'}</Text>
        </Pressable>
      </View>

      {/* Type legend */}
      {results.length > 0 && (
        <View style={styles.legend}>
          {(['memory', 'note', 'task'] as const).map((t) => {
            const count = results.filter((r) => r.type === t).length;
            if (!count) return null;
            return (
              <View key={t} style={[styles.legendChip, { backgroundColor: TYPE_COLOR[t] + '18' }]}>
                <Icon name={TYPE_ICON[t]} size={12} color={TYPE_COLOR[t]} />
                <Text style={[styles.legendText, { color: TYPE_COLOR[t] }]}>{count} {t}s</Text>
              </View>
            );
          })}
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            {searched ? (
              <>
                <Icon name="search" size={32} color={L.textLight} />
                <Text style={styles.emptyTitle}>No results for "{q}"</Text>
                <Text style={styles.emptyBody}>Try different keywords or add more memories.</Text>
              </>
            ) : (
              <>
                <View style={styles.emptyHero}>
                  <Icon name="search" size={32} color={L.textLight} />
                </View>
                <Text style={styles.emptyTitle}>Search everything</Text>
                <Text style={styles.emptyBody}>Memories, notes, and task history — all in one place.</Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => {
              if (item.type === 'note') router.push('/notes');
              else if (item.type === 'task') router.push('/tasks');
              else router.push('/memory');
            }}>
            <View style={[styles.typeIcon, { backgroundColor: item.color + '18' }]}>
              <Icon name={TYPE_ICON[item.type]} size={16} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.cardTop}>
                <View style={[styles.typeBadge, { backgroundColor: item.color + '18' }]}>
                  <Text style={[styles.typeText, { color: item.color }]}>{item.type.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.body ? <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text> : null}
            </View>
            <Icon name="chevron" size={16} color={L.textLight} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: L.dark },
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: L.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, color: L.dark },
  goBtn: { backgroundColor: L.dark, borderRadius: 16, paddingHorizontal: 20, justifyContent: 'center' },
  goBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  legend: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  legendChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  legendText: { fontSize: 11, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: L.surface, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  typeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTop: { marginBottom: 4 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  cardTitle: { color: L.dark, fontWeight: '700', fontSize: 14, textTransform: 'capitalize' },
  cardBody: { color: L.textMid, fontSize: 12, marginTop: 3, lineHeight: 17 },
  empty: { alignItems: 'center', marginTop: 80, gap: 10, paddingHorizontal: 32 },
  emptyHero: { width: 64, height: 64, borderRadius: 32, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: L.dark },
  emptyBody: { color: L.textMid, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
