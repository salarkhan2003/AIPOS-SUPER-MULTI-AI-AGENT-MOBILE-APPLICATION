import { Icon } from '@/components/Icon';
import { generateEmailDraft, type EmailDraft } from '@/lib/emailDraft';
import { useTheme } from '@/lib/themeContext';
import { storage } from '@/lib/storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DRAFTS_KEY = 'ghost:email_drafts';

interface SavedDraft extends EmailDraft {
  id: string;
  prompt: string;
  ts: number;
}

export default function EmailScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [prompt, setPrompt] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [view, setView] = useState<'compose' | 'history'>('compose');
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    storage.get<SavedDraft[]>(DRAFTS_KEY).then((d) => setDrafts(d ?? []));
  }, []);

  const generate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Description required', 'Describe the email you want to draft.');
      return;
    }
    setLoading(true);
    try {
      const draft = await generateEmailDraft(prompt.trim(), to.trim());
      setTo(draft.to);
      setSubject(draft.subject);
      setBody(draft.body);
      setHasDraft(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const saved: SavedDraft = {
        id: `d-${Date.now()}`,
        prompt: prompt.trim(),
        ts: Date.now(),
        ...draft,
      };
      const updated = [saved, ...drafts].slice(0, 20);
      setDrafts(updated);
      await storage.set(DRAFTS_KEY, updated);
    } catch {
      Alert.alert('Could not draft', 'Check your API key and connection, then try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmSend = () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      Alert.alert('Incomplete draft', 'Fill in To, Subject, and Body before sending.');
      return;
    }
    Alert.alert(
      'Send this email?',
      `To: ${to}\nSubject: ${subject}\n\nGhost will open your email app with this draft. Nothing is sent until you tap Send in Gmail/Outlook.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open email app',
          onPress: async () => {
            const url = `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body.trim())}`;
            const can = await Linking.canOpenURL(url);
            if (can) {
              await Linking.openURL(url);
            } else {
              Alert.alert('No email app', 'Install Gmail or another mail app on your device.');
            }
          },
        },
      ],
    );
  };

  const templates = [
    { label: 'Follow-up', p: 'Follow up on a job application sent last week', color: C.violet },
    { label: 'Apology', p: 'Apologize for missing a meeting politely', color: C.coral },
    { label: 'Thank you', p: 'Thank the interviewer after a job interview', color: C.mint },
    { label: 'Leave', p: 'Request 3 days leave for personal reasons', color: C.orange },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={C.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Email Assistant</Text>
          <Text style={styles.subtitle}>Draft → review → send from your mail app</Text>
        </View>
        <View style={styles.tabRow}>
          <Pressable style={[styles.tabBtn, view === 'compose' && styles.tabBtnActive]} onPress={() => setView('compose')}>
            <Text style={[styles.tabText, view === 'compose' && styles.tabTextActive]}>Compose</Text>
          </Pressable>
          <Pressable style={[styles.tabBtn, view === 'history' && styles.tabBtnActive]} onPress={() => setView('history')}>
            <Text style={[styles.tabText, view === 'history' && styles.tabTextActive]}>History</Text>
          </Pressable>
        </View>
      </View>

      {view === 'compose' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}>
          <Text style={styles.sectionLabel}>QUICK TEMPLATES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginBottom: 16 }}>
            {templates.map((t) => (
              <Pressable
                key={t.label}
                style={[styles.templateChip, { backgroundColor: t.color }]}
                onPress={async () => {
                  setPrompt(t.p);
                  setLoading(true);
                  try {
                    const d = await generateEmailDraft(t.p, to);
                    setTo(d.to);
                    setSubject(d.subject);
                    setBody(d.body);
                    setHasDraft(true);
                  } catch {
                    Alert.alert('Could not draft', 'Try again or check your API key.');
                  } finally {
                    setLoading(false);
                  }
                }}>
                <Text style={styles.templateText}>{t.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>DESCRIBE YOUR EMAIL</Text>
            <TextInput
              style={styles.promptInput}
              placeholder="e.g. Follow up with HR about my interview last Tuesday…"
              placeholderTextColor={C.textLight}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.cardLabel}>RECIPIENT EMAIL (optional)</Text>
            <TextInput
              style={styles.singleInput}
              placeholder="hr@company.com"
              placeholderTextColor={C.textLight}
              value={to}
              onChangeText={setTo}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Pressable style={[styles.genBtn, loading && { opacity: 0.7 }]} onPress={generate} disabled={loading}>
              <Icon name="sparkles" size={16} color="#fff" />
              <Text style={styles.genBtnText}>{loading ? 'Drafting…' : 'Generate draft'}</Text>
            </Pressable>
          </View>

          {hasDraft || body ? (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>Review before sending</Text>
              <Text style={styles.reviewHint}>Edit any field. Ghost never sends without your confirmation.</Text>

              <Text style={styles.fieldLabel}>To</Text>
              <TextInput style={styles.singleInput} value={to} onChangeText={setTo} placeholder="recipient@email.com" placeholderTextColor={C.textLight} keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.fieldLabel}>Subject</Text>
              <TextInput style={styles.singleInput} value={subject} onChangeText={setSubject} placeholder="Subject line" placeholderTextColor={C.textLight} />

              <Text style={styles.fieldLabel}>Body</Text>
              <TextInput
                style={styles.bodyInput}
                value={body}
                onChangeText={setBody}
                multiline
                textAlignVertical="top"
                placeholder="Email body…"
                placeholderTextColor={C.textLight}
              />

              <Pressable style={styles.sendBtn} onPress={confirmSend}>
                <Icon name="mail" size={18} color="#fff" />
                <Text style={styles.sendBtnText}>Review & open in email app</Text>
              </Pressable>
            </View>
          ) : !loading ? (
            <View style={styles.emptyCard}>
              <Icon name="mail" size={36} color={C.textLight} />
              <Text style={styles.emptyTitle}>No draft yet</Text>
              <Text style={styles.emptyBody}>AI will generate To, Subject, and Body for you to edit.</Text>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}>
          {drafts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No drafts yet</Text>
            </View>
          ) : (
            drafts.map((d) => (
              <Pressable
                key={d.id}
                style={styles.historyCard}
                onPress={() => {
                  setPrompt(d.prompt);
                  setTo(d.to);
                  setSubject(d.subject);
                  setBody(d.body);
                  setHasDraft(true);
                  setView('compose');
                }}>
                <Text style={styles.historyPrompt} numberOfLines={1}>{d.subject}</Text>
                <Text style={styles.historyContent} numberOfLines={2}>{d.body}</Text>
                <Text style={styles.historyMeta}>To: {d.to} · {new Date(d.ts).toLocaleDateString('en-IN')}</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', elevation: 2, marginBottom: 8, borderWidth: 1, borderColor: C.border },
    title: { fontSize: 24, fontWeight: '800', color: C.text },
    subtitle: { color: C.textMid, fontSize: 13 },
    tabRow: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12, padding: 3, marginTop: 10, alignSelf: 'flex-start' },
    tabBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10 },
    tabBtnActive: { backgroundColor: C.ink },
    tabText: { fontSize: 13, fontWeight: '600', color: C.textMid },
    tabTextActive: { color: '#fff' },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: C.textLight, letterSpacing: 1.2, marginBottom: 10 },
    templateChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
    templateText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    card: { backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
    cardLabel: { fontSize: 10, fontWeight: '800', color: C.textLight, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
    promptInput: { minHeight: 80, fontSize: 15, color: C.text, lineHeight: 22, marginBottom: 8 },
    singleInput: { backgroundColor: C.bg, borderRadius: 12, padding: 12, fontSize: 15, color: C.text, marginBottom: 10, borderWidth: 1, borderColor: C.border },
    genBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.violet, borderRadius: 14, paddingVertical: 13 },
    genBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    reviewCard: { backgroundColor: C.surface, borderRadius: 20, padding: 16, borderWidth: 2, borderColor: C.violet + '50' },
    reviewTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 4 },
    reviewHint: { fontSize: 12, color: C.textMid, marginBottom: 14, lineHeight: 18 },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: C.textMid, marginBottom: 4, marginTop: 6 },
    bodyInput: { minHeight: 160, backgroundColor: C.bg, borderRadius: 12, padding: 12, fontSize: 15, color: C.text, lineHeight: 22, borderWidth: 1, borderColor: C.border },
    sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.mint, borderRadius: 14, paddingVertical: 14, marginTop: 16 },
    sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    emptyCard: { backgroundColor: C.surface, borderRadius: 20, padding: 32, alignItems: 'center', gap: 10 },
    emptyTitle: { fontSize: 17, fontWeight: '800', color: C.text },
    emptyBody: { color: C.textMid, fontSize: 14, textAlign: 'center' },
    historyCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
    historyPrompt: { color: C.violet, fontWeight: '700', fontSize: 14, marginBottom: 4 },
    historyContent: { color: C.textMid, fontSize: 13, lineHeight: 19 },
    historyMeta: { color: C.textLight, fontSize: 11, marginTop: 6 },
  });
}
