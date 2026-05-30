import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { watchdogs } from '@/lib/watchdogs';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Watchdog = Awaited<ReturnType<typeof watchdogs.list>>[number];

export default function WorkflowsScreen() {
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<Watchdog[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => { watchdogs.list().then(setList); }, []);

  const addTrainWatchdog = async () => {
    setAdding(true);
    try {
      await watchdogs.register('irctc_delay', { train: '12712' }, 'notify + suggest_cab');
      setList(await watchdogs.list());
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <View>
          <Text style={styles.title}>Workflows</Text>
          <Text style={styles.subtitle}>{list.length} watchdogs active</Text>
        </View>
      </View>

      {/* Add preset */}
      <Pressable
        style={({ pressed }) => [styles.addCard, { opacity: pressed ? 0.85 : 1 }]}
        onPress={addTrainWatchdog}
        disabled={adding}>
        <View style={styles.addIcon}>
          <Icon name="zap" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.addTitle}>Add train 12712 delay watchdog</Text>
          <Text style={styles.addSub}>Notifies + suggests cab on delay</Text>
        </View>
        <Icon name="forward" size={18} color={L.violet} />
      </Pressable>

      <FlatList
        data={list}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="git-branch" size={36} color={L.textLight} />
            <Text style={styles.emptyText}>No watchdogs yet.{'\n'}Add one above to get started.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.triggerBadge}>
                <Text style={styles.triggerText}>{item.trigger}</Text>
              </View>
              <Text style={styles.action}>{item.action}</Text>
            </View>
            <View style={styles.activeDot} />
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
  title: { fontSize: 24, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { color: L.textMid, fontSize: 13 },
  addCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginBottom: 16, backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  addIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: L.violet, alignItems: 'center', justifyContent: 'center' },
  addTitle: { color: L.dark, fontWeight: '700', fontSize: 15 },
  addSub: { color: L.textMid, fontSize: 12, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardLeft: { flex: 1 },
  triggerBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(91,79,232,0.10)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 },
  triggerText: { color: L.violet, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  action: { color: L.dark, fontSize: 14, fontWeight: '500' },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: L.mint },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: L.textLight, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
