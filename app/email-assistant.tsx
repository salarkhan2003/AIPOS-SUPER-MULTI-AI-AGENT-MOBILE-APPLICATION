import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { runGhost } from '@/lib/orchestrator';
import { useGhostStore } from '@/store/ghostStore';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EmailScreen() {
  const insets = useSafeAreaInsets();
  const addThought = useGhostStore((s) => s.addThought);
  const [prompt, setPrompt] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const { finalMessage, thoughts } = await runGhost(`Draft an email: ${prompt}`);
      thoughts.forEach((t) => addThought(t));
      setDraft(finalMessage);
    } catch {
      setDraft('Failed to generate. Check your connection.');
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
        <View>
          <Text style={styles.title}>Email Assistant</Text>
          <Text style={styles.subtitle}>Drafts via Communication agent</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}>
        {/* Prompt */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>WHAT TO WRITE</Text>
          <TextInput
            style={styles.promptInput}
            placeholder="e.g. Follow up on the project proposal sent last week…"
            placeholderTextColor={L.textLight}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            textAlignVertical="top"
          />
          <Pressable
            style={[styles.genBtn, { opacity: loading ? 0.7 : 1 }]}
            onPress={generate}
            disabled={loading}>
            <Icon name="sparkles" size={16} color="#fff" />
            <Text style={styles.genBtnText}>{loading ? 'Drafting…' : 'Generate draft'}</Text>
          </Pressable>
        </View>

        {/* Draft output */}
        {draft ? (
          <View style={styles.draftCard}>
            <View style={styles.draftHeader}>
              <Icon name="mail" size={16} color={L.violet} />
              <Text style={styles.draftLabel}>DRAFT</Text>
            </View>
            <Text style={styles.draftText}>{draft}</Text>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Icon name="mail" size={36} color={L.textLight} />
            <Text style={styles.emptyTitle}>No draft yet</Text>
            <Text style={styles.emptyBody}>Describe what you want to write and Ghost will draft it for you.</Text>
          </View>
        )}
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
  card: { backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardLabel: { fontSize: 11, fontWeight: '800', color: L.textLight, letterSpacing: 1, marginBottom: 10 },
  promptInput: { minHeight: 80, fontSize: 15, color: L.dark, lineHeight: 22, marginBottom: 14 },
  genBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: L.violet, borderRadius: L.radius.md, paddingVertical: 13 },
  genBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  draftCard: { backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  draftHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  draftLabel: { fontSize: 11, fontWeight: '800', color: L.violet, letterSpacing: 1 },
  draftText: { color: L.dark, fontSize: 15, lineHeight: 24 },
  emptyCard: { backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 32, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: L.dark },
  emptyBody: { color: L.textMid, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
