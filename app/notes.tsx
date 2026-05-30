import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { memory } from '@/lib/memory';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!note.trim()) return;
    await memory.add(note.trim(), 'semantic');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setNote('');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <Text style={styles.title}>Notes</Text>
        <Pressable style={[styles.saveBtn, { backgroundColor: saved ? L.mint : L.dark }]} onPress={save}>
          <Icon name={saved ? 'check' : 'forward'} size={16} color="#fff" />
          <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save'}</Text>
        </Pressable>
      </View>

      <View style={styles.info}>
        <Icon name="brain" size={14} color={L.violet} />
        <Text style={styles.infoText}>Notes are saved to your memory graph automatically</Text>
      </View>

      <ScrollView contentContainerStyle={{ flex: 1, paddingHorizontal: 16 }}>
        <TextInput
          style={styles.editor}
          multiline
          placeholder="Start writing…"
          placeholderTextColor={L.textLight}
          value={note}
          onChangeText={setNote}
          textAlignVertical="top"
          autoFocus
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: L.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: L.bg, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: L.dark },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: L.radius.pill },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(91,79,232,0.06)', borderBottomWidth: 1, borderBottomColor: L.border },
  infoText: { color: L.violet, fontSize: 12, fontWeight: '600' },
  editor: { flex: 1, fontSize: 17, color: L.dark, lineHeight: 28, paddingTop: 20, minHeight: 400 },
});
