import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { notifyLocal } from '@/lib/notifications-local';
import { notesStorage, type SavedNote } from '@/lib/storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

const NOTE_COLORS = [
  '#FFFFFF', L.yellow, L.coral, L.violet, L.mint, L.orange, '#3A8EF0',
];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editing, setEditing] = useState<SavedNote | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [color, setColor] = useState('#FFFFFF');
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef<TextInput>(null);

  const load = async () => setNotes(await notesStorage.list());

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setTitle('');
    setBody('');
    setColor('#FFFFFF');
    setView('edit');
  };

  const openEdit = (note: SavedNote) => {
    setEditing(note);
    setTitle(note.title);
    setBody(note.body);
    setColor(note.color);
    setView('edit');
  };

  const save = async () => {
    if (!body.trim() && !title.trim()) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const noteTitle = title.trim() || body.trim().split('\n')[0].slice(0, 40);
      if (editing) {
        await notesStorage.update(editing.id, { title: noteTitle, body: body.trim(), color });
      } else {
        await notesStorage.save({ title: noteTitle, body: body.trim(), color });
        await notifyLocal('Note saved', noteTitle, { type: 'task' }, 'task');
      }
      await load();
      setView('list');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = (id: string) => {
    Alert.alert('Delete note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await notesStorage.remove(id);
          load();
        },
      },
    ]);
  };

  // ── Edit view ──────────────────────────────────────────────
  if (view === 'edit') {
    const isDark = color !== '#FFFFFF' && color !== L.yellow;
    const textColor = isDark ? '#fff' : L.dark;
    const subColor = isDark ? 'rgba(255,255,255,0.65)' : L.textMid;
    return (
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.editHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : L.border }]}>
          <Pressable onPress={() => setView('list')} style={styles.backBtn} hitSlop={12}>
            <Icon name="back" size={20} color={textColor} />
          </Pressable>
          <Text style={[styles.editHeaderTitle, { color: textColor }]}>
            {editing ? 'Edit note' : 'New note'}
          </Text>
          <Pressable
            style={[styles.saveBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : L.dark, opacity: saving ? 0.7 : 1 }]}
            onPress={save} disabled={saving}>
            <Icon name="check" size={16} color={isDark ? '#fff' : '#fff'} />
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </View>

        {/* Color picker */}
        <View style={styles.colorRow}>
          {NOTE_COLORS.map((c) => (
            <Pressable
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <TextInput
          style={[styles.titleInput, { color: textColor }]}
          placeholder="Title (optional)"
          placeholderTextColor={subColor}
          value={title}
          onChangeText={setTitle}
          returnKeyType="next"
          onSubmitEditing={() => bodyRef.current?.focus()}
        />
        <TextInput
          ref={bodyRef}
          style={[styles.bodyInput, { color: textColor }]}
          placeholder="Write your note…"
          placeholderTextColor={subColor}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
          autoFocus={!editing}
        />
      </View>
    );
  }

  // ── List view ──────────────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <View>
          <Text style={styles.title}>Notes</Text>
          <Text style={styles.subtitle}>{notes.length} saved</Text>
        </View>
        <Pressable style={styles.newBtn} onPress={openNew}>
          <Icon name="forward" size={18} color="#fff" />
          <Text style={styles.newBtnText}>New</Text>
        </Pressable>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="file-text" size={40} color={L.textLight} />
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptyBody}>Tap "New" to write your first note</Text>
            <Pressable style={styles.emptyBtn} onPress={openNew}>
              <Text style={styles.emptyBtnText}>Create note</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => {
          const isDark = item.color !== '#FFFFFF' && item.color !== L.yellow;
          return (
            <Pressable
              style={[styles.noteCard, { backgroundColor: item.color, marginLeft: index % 2 === 1 ? 8 : 0 }]}
              onPress={() => openEdit(item)}
              onLongPress={() => deleteNote(item.id)}>
              <Text style={[styles.noteTitle, { color: isDark ? '#fff' : L.dark }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.noteBody, { color: isDark ? 'rgba(255,255,255,0.75)' : L.textMid }]} numberOfLines={4}>
                {item.body}
              </Text>
              <Text style={[styles.noteTime, { color: isDark ? 'rgba(255,255,255,0.5)' : L.textLight }]}>
                {timeAgo(item.updatedAt)}
              </Text>
            </Pressable>
          );
        }}
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
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: L.dark, paddingHorizontal: 14, paddingVertical: 8, borderRadius: L.radius.pill },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  grid: { paddingHorizontal: 16, paddingBottom: 40 },
  noteCard: { flex: 1, borderRadius: 20, padding: 16, marginBottom: 10, minHeight: 140, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.10, shadowRadius: 10, elevation: 4 },
  noteTitle: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  noteBody: { fontSize: 13, lineHeight: 19, flex: 1 },
  noteTime: { fontSize: 10, fontWeight: '600', marginTop: 10 },
  empty: { alignItems: 'center', marginTop: 80, gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: L.dark },
  emptyBody: { color: L.textMid, fontSize: 14, textAlign: 'center' },
  emptyBtn: { backgroundColor: L.dark, paddingHorizontal: 24, paddingVertical: 12, borderRadius: L.radius.pill, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  // Edit view
  editHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1 },
  editHeaderTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: L.radius.pill },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  colorRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: 'rgba(0,0,0,0.3)', transform: [{ scale: 1.2 }] },
  titleInput: { fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingVertical: 8 },
  bodyInput: { flex: 1, fontSize: 16, lineHeight: 26, paddingHorizontal: 16, paddingTop: 8 },
});
