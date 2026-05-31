import { Icon } from '@/components/Icon';
import { getSession, updateUserProfile } from '@/lib/auth';
import {
    cancelAllLocal,
    initLocalNotifications,
    notifyUser,
    scheduleDailyBriefing,
} from '@/lib/notifications-local';
import { resetAppData } from '@/lib/resetApp';
import { contactsStorage, prefsStorage, type SavedContact, type UserPrefs } from '@/lib/storage';
import { useTheme } from '@/lib/themeContext';
import { useGhostStore } from '@/store/ghostStore';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark, theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<UserPrefs>({
    notificationsEnabled: true,
    encryptMemory: true,
    autoRunWatchdogs: false,
    dailyBriefingHour: 7,
    theme: 'light',
    whatsappNumber: '',
    backgroundVoiceAgentEnabled: false,
    fullMobileAccessEnabled: false,
    allowedApps: [],
  });
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [notifTitle, setNotifTitle] = useState('Hello from Ghost');
  const [notifBody, setNotifBody] = useState('This is your custom notification message.');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const setAuth = useGhostStore((s) => s.setAuth);
  const resetStore = useGhostStore((s) => s.resetStore);
  const setOnboarded = useGhostStore((s) => s.setOnboarded);

  const GENDERS = ['', 'Male', 'Female', 'Non-binary', 'Prefer not to say'];

  useEffect(() => {
    prefsStorage.get().then((p) => {
      setPrefs(p);
      setWaNumber(p.whatsappNumber ?? '');
    });
    contactsStorage.list().then(setContacts);
    getSession().then((s) => {
      setDisplayName(s.name ?? '');
      setGender(s.gender ?? '');
    });
  }, []);

  const update = async (patch: Partial<UserPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await prefsStorage.set(patch);
    if ('notificationsEnabled' in patch) {
      if (patch.notificationsEnabled) {
        await initLocalNotifications();
        await scheduleDailyBriefing(next.dailyBriefingHour, 30);
      } else {
        await cancelAllLocal();
      }
    }
    if ('theme' in patch && patch.theme) {
      await setTheme(patch.theme);
    }
  };

  const saveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Name required', 'Enter a display name.');
      return;
    }
    try {
      await updateUserProfile({ name: displayName.trim(), gender: gender || undefined });
      setAuth({ isGuest: true, isAuthenticated: false, name: displayName.trim() });
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save profile');
    }
  };

  const confirmResetApp = () => {
    Alert.alert(
      'Reset Ghost AI?',
      'This permanently deletes all memories, tasks, contacts, calendar events, and settings. You will return to the welcome screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset everything',
          style: 'destructive',
          onPress: async () => {
            await resetAppData();
            resetStore();
            setOnboarded(false);
            router.replace('/(auth)/onboarding');
          },
        },
      ],
    );
  };

  const saveWhatsApp = async () => {
    await update({ whatsappNumber: waNumber.trim() });
    Alert.alert('Saved', 'Your WhatsApp number is saved. Voice commands can now send messages.');
  };

  const addContact = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Missing info', 'Enter both a name and phone number.');
      return;
    }
    const c = await contactsStorage.add(newName, newPhone);
    setContacts((prev) => [...prev, c]);
    setNewName('');
    setNewPhone('');
  };

  const testNotif = async () => {
    const ok = await initLocalNotifications();
    if (!ok) {
      Alert.alert('Permission needed', 'Open Settings → Apps → Ghost AI → Notifications → Allow.');
      return;
    }
    await notifyUser('Ghost AI test', 'Notifications are working on your device.');
    Alert.alert('Test sent', 'Check your notification shade now.');
  };

  const sendCustomNotif = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      Alert.alert('Title and body required', 'Enter both fields to send a notification.');
      return;
    }
    const ok = await initLocalNotifications();
    if (!ok) {
      Alert.alert('Permission needed', 'Allow notifications first (see instructions below).');
      return;
    }
    await notifyUser(notifTitle.trim(), notifBody.trim());
    Alert.alert('Sent', 'Your notification was delivered.');
  };

  const infoRows = [
    { label: 'App version', value: '1.0.0' },
    { label: 'Locale', value: 'India (en-IN)' },
    { label: 'Timezone', value: 'IST (UTC+5:30)' },
    { label: 'AI model', value: 'Groq / LLaMA 3.3' },
    { label: 'Storage', value: 'SQLite + AsyncStorage' },
  ];

  const styles = makeStyles(C);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Icon name="back" size={20} color={C.dark} />
          </Pressable>
          <Text style={styles.title}>Settings</Text>
        </View>

        <Text style={styles.sectionLabel}>YOUR PROFILE</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Display name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your nickname"
            placeholderTextColor={C.textLight}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Gender (optional)</Text>
          <View style={styles.genderRow}>
            {GENDERS.filter(Boolean).map((g) => (
              <Pressable
                key={g}
                style={[styles.genderPill, gender === g && styles.genderPillActive]}
                onPress={() => setGender(g)}>
                <Text style={[styles.genderPillText, gender === g && styles.genderPillTextActive]}>{g}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={[styles.saveBtn, { marginTop: 4 }]} onPress={saveProfile}>
            <Text style={styles.saveBtnText}>Save profile</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: C.violet + '22' }]}>
              <Icon name="sparkles" size={16} color={C.violet} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Theme</Text>
              <Text style={styles.rowSub}>Colorful accents in light and dark</Text>
            </View>
          </View>
          <View style={styles.themeRow}>
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <Pressable
                key={mode}
                style={[styles.themePill, theme === mode && styles.themePillActive]}
                onPress={() => update({ theme: mode })}>
                <Text style={[styles.themePillText, theme === mode && styles.themePillTextActive]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          {[
            { key: 'notificationsEnabled' as const, label: 'Notifications', sub: 'Alerts, briefings, watchdogs', color: C.violet, icon: 'bell' as const },
            { key: 'backgroundVoiceAgentEnabled' as const, label: 'Background voice agent', sub: 'AI greets you when app opens', color: C.yellow, icon: 'mic' as const },
            { key: 'fullMobileAccessEnabled' as const, label: 'Full mobile access', sub: 'AI can open apps, send messages, etc.', color: C.coral, icon: 'shield' as const },
            { key: 'encryptMemory' as const, label: 'Encrypted memory', sub: 'AES-256 local encryption', color: C.mint, icon: 'shield' as const },
            { key: 'autoRunWatchdogs' as const, label: 'Auto-run watchdogs', sub: 'Execute triggers automatically', color: C.coral, icon: 'zap' as const },
          ].map((item, idx, arr) => (
            <View key={item.key} style={[styles.row, idx < arr.length - 1 && styles.rowBorder]}>
              <View style={[styles.rowIcon, { backgroundColor: item.color + '22' }]}>
                <Icon name={item.icon} size={16} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowSub}>{item.sub}</Text>
              </View>
              <Switch
                value={prefs[item.key] as boolean}
                onValueChange={(v) => update({ [item.key]: v })}
                trackColor={{ false: C.border, true: item.color }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>LEGAL</Text>
        <View style={styles.card}>
          <Pressable style={[styles.row, styles.rowBorder]} onPress={() => router.push('/terms')}>
            <View style={[styles.rowIcon, { backgroundColor: C.violet + '22' }]}>
              <Icon name="file-text" size={16} color={C.violet} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Terms of Service</Text>
              <Text style={styles.rowSub}>Read our terms</Text>
            </View>
            <Icon name="chevron" size={16} color={C.textLight} />
          </Pressable>
          <Pressable style={styles.row} onPress={() => router.push('/privacy')}>
            <View style={[styles.rowIcon, { backgroundColor: C.mint + '22' }]}>
              <Icon name="shield" size={16} color={C.mint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Privacy Policy</Text>
              <Text style={styles.rowSub}>Read our privacy policy</Text>
            </View>
            <Icon name="chevron" size={16} color={C.textLight} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>MESSAGING · WHATSAPP</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Your WhatsApp number</Text>
          <Text style={styles.fieldHint}>Used when you say “send via WhatsApp” from Home or Voice</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 98765 43210"
            placeholderTextColor={C.textLight}
            value={waNumber}
            onChangeText={setWaNumber}
            keyboardType="phone-pad"
          />
          <Pressable style={styles.saveBtn} onPress={saveWhatsApp}>
            <Text style={styles.saveBtnText}>Save WhatsApp number</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { marginTop: 0 }]}>
          <Text style={styles.fieldLabel}>Saved contacts</Text>
          <Text style={styles.fieldHint}>Say “text Mom I'm on my way” — Ghost opens WhatsApp to that contact</Text>
          {contacts.map((c) => (
            <View key={c.id} style={styles.contactRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{c.name}</Text>
                <Text style={styles.rowSub}>{c.phone}</Text>
              </View>
              <Pressable
                onPress={async () => {
                  await contactsStorage.remove(c.id);
                  setContacts((prev) => prev.filter((x) => x.id !== c.id));
                }}>
                <Icon name="close" size={16} color={C.coral} />
              </Pressable>
            </View>
          ))}
          <View style={styles.addContactRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Name (e.g. Mom)"
              placeholderTextColor={C.textLight}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Phone"
              placeholderTextColor={C.textLight}
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
            />
          </View>
          <Pressable style={styles.saveBtn} onPress={addContact}>
            <Text style={styles.saveBtnText}>Add contact</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>DAILY BRIEFING</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: C.yellow + '28' }]}>
              <Icon name="bell" size={16} color={C.yellow} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Briefing time</Text>
              <Text style={styles.rowSub}>Daily notification at {prefs.dailyBriefingHour}:30 AM</Text>
            </View>
            <View style={styles.timeRow}>
              <Pressable style={styles.timeBtn} onPress={() => update({ dailyBriefingHour: Math.max(5, prefs.dailyBriefingHour - 1) })}>
                <Text style={styles.timeBtnText}>−</Text>
              </Pressable>
              <Text style={styles.timeVal}>{prefs.dailyBriefingHour}:30</Text>
              <Pressable style={styles.timeBtn} onPress={() => update({ dailyBriefingHour: Math.min(12, prefs.dailyBriefingHour + 1) })}>
                <Text style={styles.timeBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <Text style={styles.fieldHint}>
            On Android 13+: allow notifications when prompted. For APK installs, also enable notifications in system Settings → Apps → Ghost AI.
          </Text>
          <Text style={styles.fieldLabel}>Notification title</Text>
          <TextInput
            style={styles.input}
            value={notifTitle}
            onChangeText={setNotifTitle}
            placeholder="Title"
            placeholderTextColor={C.textLight}
          />
          <Text style={styles.fieldLabel}>Notification message</Text>
          <TextInput
            style={[styles.input, { minHeight: 72 }]}
            value={notifBody}
            onChangeText={setNotifBody}
            placeholder="Your message here…"
            placeholderTextColor={C.textLight}
            multiline
          />
          <Pressable style={styles.saveBtn} onPress={sendCustomNotif}>
            <Text style={styles.saveBtnText}>Send notification</Text>
          </Pressable>
          <Pressable style={[styles.testRow, { marginTop: 8 }]} onPress={testNotif}>
            <Text style={[styles.rowSub, { flex: 1 }]}>Quick test (default message)</Text>
            <Icon name="forward" size={16} color={C.textLight} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          {infoRows.map((r, idx) => (
            <View key={r.label} style={[styles.row, idx < infoRows.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>DANGER ZONE</Text>
        <View style={[styles.dangerCard, { borderColor: C.coral + '55', backgroundColor: C.coral + '12' }]}>
          <View style={styles.dangerHeader}>
            <View style={[styles.dangerIconWrap, { backgroundColor: C.coral + '28' }]}>
              <Icon name="close" size={20} color={C.coral} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dangerTitle, { color: C.coral }]}>Reset app</Text>
              <Text style={styles.dangerSub}>
                Erase all data and return to the welcome screen. This cannot be undone.
              </Text>
            </View>
          </View>
          <Pressable style={[styles.resetBtn, { backgroundColor: C.coral }]} onPress={confirmResetApp}>
            <Text style={styles.resetBtnText}>Reset Ghost AI</Text>
          </Pressable>
          <Pressable
            style={styles.dangerRow}
            onPress={() => Alert.alert('Cancel all notifications?', 'This will remove all scheduled alerts.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: cancelAllLocal },
            ])}>
            <Text style={[styles.dangerText, { color: C.textMid }]}>Cancel scheduled notifications only</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    title: { fontSize: 24, fontWeight: '800', color: C.text },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: C.textLight, letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 16 },
    card: { marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 20, marginBottom: 20, elevation: 3, overflow: 'hidden', padding: 14 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 14, marginBottom: 14 },
    rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { color: C.text, fontWeight: '700', fontSize: 15 },
    rowSub: { color: C.textMid, fontSize: 12, marginTop: 1 },
    rowValue: { color: C.textMid, fontSize: 14 },
    themeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    themePill: { flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    themePillActive: { backgroundColor: C.violet, borderColor: C.violet },
    themePillText: { fontWeight: '700', color: C.textMid, fontSize: 13 },
    themePillTextActive: { color: '#fff' },
    fieldLabel: { color: C.text, fontWeight: '700', fontSize: 15, marginBottom: 4 },
    fieldHint: { color: C.textMid, fontSize: 12, marginBottom: 10, lineHeight: 17 },
    input: { backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: C.border },
    saveBtn: { backgroundColor: C.violet, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    addContactRow: { flexDirection: 'row', gap: 8 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
    timeBtnText: { fontSize: 18, fontWeight: '700', color: C.text },
    timeVal: { fontSize: 15, fontWeight: '800', color: C.text, minWidth: 40, textAlign: 'center' },
    testRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    genderPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
    genderPillActive: { backgroundColor: C.violet, borderColor: C.violet },
    genderPillText: { fontSize: 12, fontWeight: '600', color: C.textMid },
    genderPillTextActive: { color: '#fff' },
    dangerCard: { marginHorizontal: 16, borderRadius: 20, marginBottom: 24, padding: 16, borderWidth: 1.5 },
    dangerHeader: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    dangerIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    dangerTitle: { fontWeight: '800', fontSize: 17 },
    dangerSub: { color: C.textMid, fontSize: 12, marginTop: 4, lineHeight: 17 },
    resetBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
    resetBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    dangerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
    dangerText: { fontWeight: '600', fontSize: 13 },
  });
}
