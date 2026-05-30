import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { memory } from '@/lib/memory';
import type { MemoryRecord } from '@/types';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<MemoryRecord[]>([]);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!q.trim()) return;
    const results = await memory.search(q);
    setHits(results);
    setSearched(true);
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

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color={L.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search memories, tasks, notes…"
            placeholderTextColor={L.textLight}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={doSearch}
            returnKeyType="search"
            autoFocus
          />
          {q.length > 0 && (
            <Pressable onPress={() => { setQ(''); setHits([]); setSearched(false); }}>
              <Icon name="close" size={16} color={L.textLight} />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.searchBtn} onPress={doSearch}>
          <Text style={styles.searchBtnText}>Go</Text>
        </Pressable>
      </View>

      <FlatList
        data={hits}
        keyExtractor={(h) => h.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            {searched ? (
              <>
                <Icon name="search" size={32} color={L.textLight} />
                <Text style={styles.emptyText}>No results for "{q}"</Text>
              </>
            ) : (
              <>
                <Icon name="brain" size={32} color={L.textLight} />
                <Text style={styles.emptyText}>Search across your memory graph</Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{item.type?.toUpperCase()}</Text>
            </View>
            <Text style={styles.cardText}>{item.text}</Text>
          </View>
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
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: L.surface, borderRadius: L.radius.lg, paddingHorizontal: 14, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, color: L.dark },
  searchBtn: { backgroundColor: L.dark, borderRadius: L.radius.md, paddingHorizontal: 18, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(91,79,232,0.10)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  typeText: { color: L.violet, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  cardText: { color: L.dark, fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { color: L.textLight, fontSize: 14, textAlign: 'center' },
});
