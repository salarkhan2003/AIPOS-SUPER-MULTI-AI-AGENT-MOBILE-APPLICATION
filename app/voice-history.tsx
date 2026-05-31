/**
 * Voice History — session list view
 * Each open/close of the voice screen = one session
 * Tap a session to see its full conversation
 */
import { Icon } from '@/components/Icon';
import { voiceSessionStorage, type VoiceEntry, type VoiceSession } from '@/lib/storage';
import { useTheme } from '@/lib/themeContext';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function dateLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function durationLabel(start: number, end: number) {
  if (!end || end <= start) return 'Active';
  const secs = Math.round((end - start) / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.round(secs / 60)}m`;
}

// ── Session detail modal ──────────────────────────────────────────────────────
function SessionModal({
  session,
  onClose,
}: {
  session: VoiceSession;
  onClose: () => void;
}) {
  const { colors: C, isDark } = useTheme();
  const [entries, setEntries] = useState<VoiceEntry[]>([]);

  useEffect(() => {
    voiceSessionStorage.getEntries(session.id).then(setEntries);
  }, [session.id]);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[mS.root, { backgroundColor: isDark ? '#12081F' : '#F5F2FF' }]}>
        <View style={mS.header}>
          <Pressable
            style={[mS.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)' }]}
            onPress={onClose}>
            <Icon name="close" size={18} color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[mS.title, { color: isDark ? '#fff' : '#1A0F2E' }]}>
              {dateLabel(session.startedAt)} · {timeLabel(session.startedAt)}
            </Text>
            <Text style={[mS.sub, { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }]}>
              {session.messageCount} messages · {durationLabel(session.startedAt, session.endedAt)}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={mS.scroll} showsVerticalScrollIndicator={false}>
          {entries.length === 0 ? (
            <View style={mS.empty}>
              <Text style={[mS.emptyText, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
                No messages in this session
              </Text>
            </View>
          ) : (
            entries.map((entry) => (
              <View
                key={entry.id}
                style={[
                  mS.bubble,
                  entry.speaker === 'you'
                    ? {
                        alignSelf: 'flex-end' as const,
                        backgroundColor: isDark ? 'rgba(107,78,255,0.35)' : 'rgba(107,78,255,0.12)',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(157,138,255,0.3)' : 'rgba(107,78,255,0.25)',
                      }
                    : {
                        alignSelf: 'flex-start' as const,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                      },
                ]}>
                <Text style={[mS.speaker, {
                  color: entry.speaker === 'you'
                    ? (isDark ? 'rgba(255,255,255,0.45)' : '#6B4EFF')
                    : '#9D8AFF',
                }]}>
                  {entry.speaker === 'you' ? 'You' : 'Ghost AGI'}
                </Text>
                <Text style={[mS.text, { color: isDark ? '#fff' : '#1A0F2E' }]}>
                  {entry.text}
                </Text>
                <Text style={[mS.time, { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }]}>
                  {timeLabel(entry.timestamp)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const mS = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
  bubble: { borderRadius: 18, padding: 13, marginBottom: 10, maxWidth: '85%' },
  speaker: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 5 },
  text: { fontSize: 15, lineHeight: 22 },
  time: { fontSize: 10, marginTop: 5, textAlign: 'right' },
});

// ── Sessions list ─────────────────────────────────────────────────────────────
export default function VoiceHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [selected, setSelected] = useState<VoiceSession | null>(null);

  useEffect(() => {
    voiceSessionStorage.list().then(setSessions);
  }, []);

  const deleteSession = (id: string) => {
    Alert.alert('Delete this conversation?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await voiceSessionStorage.clearSession(id);
          setSessions((s) => s.filter((x) => x.id !== id));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const deleteAll = () => {
    Alert.alert('Delete all conversations?', 'This will clear all voice history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All', style: 'destructive',
        onPress: async () => {
          for (const s of sessions) {
            await voiceSessionStorage.clearSession(s.id);
          }
          setSessions([]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  return (
    <View style={[S.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={S.header}>
        <Pressable style={[S.backBtn, { backgroundColor: C.surface, borderColor: C.border }]} onPress={() => router.back()} hitSlop={12}>
          <Icon name="back" size={20} color={C.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[S.title, { color: C.text }]}>Voice History</Text>
          <Text style={[S.subtitle, { color: C.textMid }]}>{sessions.length} conversations</Text>
        </View>
        {sessions.length > 0 && (
          <Pressable style={[S.deleteAllBtn, { backgroundColor: '#FF8A7A22' }]} onPress={deleteAll}>
            <Icon name="alert" size={14} color="#FF8A7A" />
            <Text style={[S.deleteAllBtnText, { color: '#FF8A7A' }]}>Delete All</Text>
          </Pressable>
        )}
        <Pressable style={[S.newBtn, { backgroundColor: C.violet }]} onPress={() => router.push('/voice')}>
          <Icon name="mic" size={14} color="#fff" />
          <Text style={S.newBtnText}>New</Text>
        </Pressable>
      </View>

      {sessions.length === 0 ? (
        <View style={S.empty}>
          <View style={[S.emptyOrb, { backgroundColor: C.surface }]}>
            <Icon name="mic" size={32} color={C.textLight} />
          </View>
          <Text style={[S.emptyTitle, { color: C.text }]}>No conversations yet</Text>
          <Text style={[S.emptySub, { color: C.textMid }]}>Each voice session is saved here separately</Text>
          <Pressable style={[S.goBtn, { backgroundColor: C.violet }]} onPress={() => router.push('/voice')}>
            <Icon name="mic" size={16} color="#fff" />
            <Text style={S.goBtnText}>Start talking</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 40 }]}>
          {sessions.map((session) => (
            <View
              key={session.id}
              style={[S.sessionCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Pressable
                style={S.sessionContent}
                onPress={() => setSelected(session)}>
                <View style={[S.sessionIcon, { backgroundColor: C.violet + '22' }]}>
                  <Icon name="mic" size={18} color={C.violet} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.sessionPreview, { color: C.text }]} numberOfLines={1}>
                    {session.preview || 'Voice conversation'}
                  </Text>
                  <Text style={[S.sessionMeta, { color: C.textMid }]}>
                    {dateLabel(session.startedAt)} · {timeLabel(session.startedAt)} · {session.messageCount} msgs · {durationLabel(session.startedAt, session.endedAt)}
                  </Text>
                </View>
                <Icon name="chevron" size={16} color={C.textLight} />
              </Pressable>
              <Pressable style={S.deleteBtn} onPress={() => deleteSession(session.id)} hitSlop={8}>
                <Icon name="alert" size={18} color="#FF8A7A" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {selected && (
        <SessionModal session={selected} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  newBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  deleteAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  deleteAllBtnText: { fontSize: 12, fontWeight: '700' },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  sessionCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1 },
  sessionContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sessionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sessionPreview: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  sessionMeta: { fontSize: 11 },
  deleteBtn: { padding: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyOrb: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  goBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  goBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
