/**
 * Email Assistant — AI draft + saved recipients + direct send
 * Send flow: generate → review → mailto: (pre-fills Gmail/Outlook, user taps Send once)
 * Saved recipients: add/edit/delete, auto-suggest when composing
 */
import { Icon } from '@/components/Icon';
import { generateEmailDraft, type EmailDraft } from '@/lib/emailDraft';
import { emailRecipientsStorage, storage, type SavedEmailRecipient } from '@/lib/storage';
import { useTheme } from '@/lib/themeContext';
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

interface SavedDraft extends EmailDraft { id: string; prompt: string; ts: number; }

type Tab = 'compose' | 'history' | 'contacts';

export default function EmailScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const S = useMemo(() => makeStyles(C), [C]);

  const [tab, setTab]           = useState<Tab>('compose');
  const [prompt, setPrompt]     = useState('');
  const [to, setTo]             = useState('');
  const [subject, setSubject]   = useState('');
  const [body, setBody]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [drafts, setDrafts]     = useState<SavedDraft[]>([]);
  const [recipients, setRecipients] = useState<SavedEmailRecipient[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);

  // Add recipient form
  const [newName, setNewName]   = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    storage.get<SavedDraft[]>(DRAFTS_KEY).then((d) => setDrafts(d ?? []));
    emailRecipientsStorage.list().then(setRecipients);
  }, []);

  const suggestions = useMemo(() => {
    if (!to.trim() || to.includes('@')) return [];
    const q = to.toLowerCase();
    return recipients.filter((r) =>
      r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
    ).slice(0, 4);
  }, [to, recipients]);

  const generate = async () => {
    if (!prompt.trim()) { Alert.alert('Describe the email first'); return; }
    setLoading(true);
    try {
      const draft = await generateEmailDraft(prompt.trim(), to.trim());
      // If to was a name, resolve to saved email
      if (to.trim() && !to.includes('@')) {
        const found = await emailRecipientsStorage.findByNameOrEmail(to.trim());
        if (found) setTo(found.email);
        else setTo(draft.to);
      } else {
        setTo(draft.to);
      }
      setSubject(draft.subject);
      setBody(draft.body);
      setHasDraft(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const saved: SavedDraft = { id: `d-${Date.now()}`, prompt: prompt.trim(), ts: Date.now(), ...draft };
      const updated = [saved, ...drafts].slice(0, 30);
      setDrafts(updated);
      await storage.set(DRAFTS_KEY, updated);
    } catch {
      Alert.alert('Draft failed', 'Check your API key and internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      Alert.alert('Incomplete', 'Fill in To, Subject, and Body.');
      return;
    }
    // mailto: pre-fills Gmail/Outlook — user taps Send once in their app
    const url = `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body.trim())}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      } else {
        Alert.alert('No email app found', 'Install Gmail or Outlook on your device.');
      }
    } catch {
      Alert.alert('Could not open email app');
    }
  };

  const addRecipient = async () => {
    if (!newName.trim() || !newEmail.trim() || !newEmail.includes('@')) {
      Alert.alert('Invalid', 'Enter a valid name and email address.');
      return;
    }
    const entry = await emailRecipientsStorage.add(newName.trim(), newEmail.trim());
    setRecipients((r) => [...r, entry]);
    setNewName(''); setNewEmail('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const removeRecipient = async (id: string) => {
    await emailRecipientsStorage.remove(id);
    setRecipients((r) => r.filter((x) => x.id !== id));
  };

  const TEMPLATES = [
    { label: 'Follow-up', p: 'Follow up on a job application sent last week', color: C.violet },
    { label: 'Apology',   p: 'Apologize for missing a meeting politely',       color: C.coral  },
    { label: 'Thank you', p: 'Thank the interviewer after a job interview',     color: C.mint   },
    { label: 'Leave',     p: 'Request 3 days leave for personal reasons',       color: C.orange },
  ];

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={S.header}>
        <Pressable onPress={() => router.back()} style={S.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={C.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={S.title}>Email Assistant</Text>
          <Text style={S.subtitle}>AI draft · saved contacts · direct send</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={S.tabRow}>
        {(['compose', 'history', 'contacts'] as Tab[]).map((t) => (
          <Pressable key={t} style={[S.tabBtn, tab === t && { backgroundColor: C.violet }]} onPress={() => setTab(t)}>
            <Text style={[S.tabText, tab === t && { color: '#fff' }]}>
              {t === 'compose' ? 'Compose' : t === 'history' ? 'History' : 'Contacts'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── COMPOSE ── */}
      {tab === 'compose' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scrollPad} keyboardShouldPersistTaps="handled">
          {/* Templates */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginBottom: 16 }}>
            {TEMPLATES.map((t) => (
              <Pressable key={t.label} style={[S.chip, { backgroundColor: t.color }]}
                onPress={async () => {
                  setPrompt(t.p); setLoading(true);
                  try {
                    const d = await generateEmailDraft(t.p, to);
                    setTo(d.to); setSubject(d.subject); setBody(d.body); setHasDraft(true);
                  } catch { Alert.alert('Draft failed'); }
                  finally { setLoading(false); }
                }}>
                <Text style={S.chipText}>{t.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Compose card */}
          <View style={[S.card, { borderColor: C.border }]}>
            <Text style={S.fieldLabel}>DESCRIBE YOUR EMAIL</Text>
            <TextInput style={[S.promptInput, { color: C.text, borderColor: C.border }]}
              placeholder="e.g. Follow up with HR about my interview last Tuesday…"
              placeholderTextColor={C.textLight} value={prompt} onChangeText={setPrompt}
              multiline textAlignVertical="top" />

            <Text style={S.fieldLabel}>TO (name or email)</Text>
            <View>
              <TextInput
                style={[S.input, { color: C.text, borderColor: C.border }]}
                placeholder="hr@company.com or contact name"
                placeholderTextColor={C.textLight}
                value={to}
                onChangeText={(v) => { setTo(v); setShowSuggest(true); }}
                onBlur={() => setTimeout(() => setShowSuggest(false), 200)}
                keyboardType="email-address" autoCapitalize="none" />
              {showSuggest && suggestions.length > 0 && (
                <View style={[S.suggestBox, { backgroundColor: C.surface, borderColor: C.border }]}>
                  {suggestions.map((r) => (
                    <Pressable key={r.id} style={S.suggestRow} onPress={() => { setTo(r.email); setShowSuggest(false); }}>
                      <Text style={[S.suggestName, { color: C.text }]}>{r.name}</Text>
                      <Text style={[S.suggestEmail, { color: C.textMid }]}>{r.email}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Pressable style={[S.genBtn, loading && { opacity: 0.65 }]} onPress={generate} disabled={loading}>
              <Icon name="sparkles" size={16} color="#fff" />
              <Text style={S.genBtnText}>{loading ? 'Drafting…' : 'Generate draft'}</Text>
            </Pressable>
          </View>

          {/* Review card */}
          {(hasDraft || body.length > 0) && (
            <View style={[S.reviewCard, { borderColor: C.violet + '55' }]}>
              <Text style={[S.reviewTitle, { color: C.text }]}>Review & Send</Text>
              <Text style={[S.reviewHint, { color: C.textMid }]}>Edit any field. Tap Send to open your email app with everything pre-filled.</Text>

              <Text style={S.fieldLabel}>TO</Text>
              <TextInput style={[S.input, { color: C.text, borderColor: C.border }]} value={to} onChangeText={setTo} placeholder="recipient@email.com" placeholderTextColor={C.textLight} keyboardType="email-address" autoCapitalize="none" />

              <Text style={S.fieldLabel}>SUBJECT</Text>
              <TextInput style={[S.input, { color: C.text, borderColor: C.border }]} value={subject} onChangeText={setSubject} placeholder="Subject" placeholderTextColor={C.textLight} />

              <Text style={S.fieldLabel}>BODY</Text>
              <TextInput style={[S.bodyInput, { color: C.text, borderColor: C.border }]} value={body} onChangeText={setBody} multiline textAlignVertical="top" placeholder="Email body…" placeholderTextColor={C.textLight} />

              <Pressable style={S.sendBtn} onPress={sendEmail}>
                <Icon name="mail" size={18} color="#fff" />
                <Text style={S.sendBtnText}>Send Email</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── HISTORY ── */}
      {tab === 'history' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scrollPad}>
          {drafts.length === 0 ? (
            <View style={S.empty}><Icon name="mail" size={36} color={C.textLight} /><Text style={[S.emptyTitle, { color: C.text }]}>No drafts yet</Text></View>
          ) : drafts.map((d) => (
            <Pressable key={d.id} style={[S.histCard, { backgroundColor: C.surface, borderColor: C.border }]}
              onPress={() => { setPrompt(d.prompt); setTo(d.to); setSubject(d.subject); setBody(d.body); setHasDraft(true); setTab('compose'); }}>
              <Text style={[S.histSubject, { color: C.violet }]} numberOfLines={1}>{d.subject}</Text>
              <Text style={[S.histBody, { color: C.textMid }]} numberOfLines={2}>{d.body}</Text>
              <Text style={[S.histMeta, { color: C.textLight }]}>To: {d.to} · {new Date(d.ts).toLocaleDateString('en-IN')}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* ── CONTACTS ── */}
      {tab === 'contacts' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scrollPad} keyboardShouldPersistTaps="handled">
          {/* Add new */}
          <View style={[S.card, { borderColor: C.border }]}>
            <Text style={S.fieldLabel}>ADD RECIPIENT</Text>
            <TextInput style={[S.input, { color: C.text, borderColor: C.border }]} placeholder="Name" placeholderTextColor={C.textLight} value={newName} onChangeText={setNewName} />
            <TextInput style={[S.input, { color: C.text, borderColor: C.border }]} placeholder="email@example.com" placeholderTextColor={C.textLight} value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" />
            <Pressable style={S.addBtn} onPress={addRecipient}>
              <Icon name="check" size={16} color="#fff" />
              <Text style={S.addBtnText}>Save Recipient</Text>
            </Pressable>
          </View>

          {/* Saved list */}
          {recipients.length === 0 ? (
            <View style={S.empty}><Text style={[S.emptyTitle, { color: C.text }]}>No saved recipients</Text><Text style={[S.emptyBody, { color: C.textMid }]}>Add emails above to auto-suggest when composing</Text></View>
          ) : recipients.map((r) => (
            <View key={r.id} style={[S.contactRow, { backgroundColor: C.surface, borderColor: C.border }]}>
              <View style={[S.contactAvatar, { backgroundColor: C.violet + '22' }]}>
                <Text style={[S.contactInitial, { color: C.violet }]}>{r.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.contactName, { color: C.text }]}>{r.name}</Text>
                <Text style={[S.contactEmail, { color: C.textMid }]}>{r.email}</Text>
              </View>
              <Pressable onPress={() => { setTo(r.email); setTab('compose'); }} style={[S.useBtn, { backgroundColor: C.violet + '18' }]}>
                <Text style={[S.useBtnText, { color: C.violet }]}>Use</Text>
              </Pressable>
              <Pressable onPress={() => Alert.alert('Remove?', r.name, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => removeRecipient(r.id) }])} style={S.delBtn}>
                <Icon name="close" size={14} color={C.textLight} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    title: { fontSize: 22, fontWeight: '800', color: C.text },
    subtitle: { color: C.textMid, fontSize: 12 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    tabText: { fontSize: 13, fontWeight: '700', color: C.textMid },
    scrollPad: { paddingHorizontal: 16, paddingBottom: 80 },
    chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
    chipText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    card: { backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1 },
    fieldLabel: { fontSize: 10, fontWeight: '800', color: C.textLight, letterSpacing: 1, marginBottom: 6, marginTop: 4 },
    promptInput: { minHeight: 72, fontSize: 15, lineHeight: 22, marginBottom: 8, borderWidth: 1, borderRadius: 12, padding: 10 },
    input: { backgroundColor: C.bg, borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 10, borderWidth: 1 },
    suggestBox: { position: 'absolute', top: 48, left: 0, right: 0, borderRadius: 12, borderWidth: 1, zIndex: 99, elevation: 10 },
    suggestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    suggestName: { fontWeight: '700', fontSize: 14 },
    suggestEmail: { fontSize: 12 },
    genBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.violet, borderRadius: 14, paddingVertical: 13 },
    genBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    reviewCard: { backgroundColor: C.surface, borderRadius: 20, padding: 16, borderWidth: 2, marginBottom: 14 },
    reviewTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
    reviewHint: { fontSize: 12, marginBottom: 14, lineHeight: 18 },
    bodyInput: { minHeight: 150, backgroundColor: C.bg, borderRadius: 12, padding: 12, fontSize: 15, lineHeight: 22, borderWidth: 1, marginBottom: 10 },
    sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#6EE7A0', borderRadius: 14, paddingVertical: 14, marginTop: 6 },
    sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyTitle: { fontSize: 17, fontWeight: '800' },
    emptyBody: { fontSize: 14, textAlign: 'center' },
    histCard: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1 },
    histSubject: { fontWeight: '700', fontSize: 14, marginBottom: 4 },
    histBody: { fontSize: 13, lineHeight: 19 },
    histMeta: { fontSize: 11, marginTop: 6 },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.mint, borderRadius: 14, paddingVertical: 12, marginTop: 4 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1 },
    contactAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    contactInitial: { fontSize: 16, fontWeight: '800' },
    contactName: { fontSize: 14, fontWeight: '700' },
    contactEmail: { fontSize: 12, marginTop: 2 },
    useBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    useBtnText: { fontSize: 12, fontWeight: '700' },
    delBtn: { padding: 6 },
  });
}
