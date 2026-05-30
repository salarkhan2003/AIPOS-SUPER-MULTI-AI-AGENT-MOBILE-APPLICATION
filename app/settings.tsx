import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [encryptMemory, setEncryptMemory] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoRun, setAutoRun] = useState(false);

  const rows: { label: string; value: string }[] = [
    { label: 'Locale', value: 'India' },
    { label: 'Timezone', value: 'IST (UTC+5:30)' },
    { label: 'Language', value: 'English' },
    { label: 'App version', value: '1.0.0' },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Icon name="back" size={20} color={L.dark} />
          </Pressable>
          <Text style={styles.title}>Settings</Text>
        </View>

        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          {[
            { label: 'Encrypted memory', value: encryptMemory, set: setEncryptMemory, color: L.violet },
            { label: 'Notifications', value: notifications, set: setNotifications, color: L.mint },
            { label: 'Auto-run watchdogs', value: autoRun, set: setAutoRun, color: L.coral },
          ].map((item, idx, arr) => (
            <View key={item.label} style={[styles.row, idx < arr.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Switch
                value={item.value}
                onValueChange={item.set}
                trackColor={{ false: L.border, true: item.color }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          {rows.map((r, idx) => (
            <View key={r.label} style={[styles.row, idx < rows.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: L.dark },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: L.textLight, letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 16 },
  card: { marginHorizontal: 16, backgroundColor: L.surface, borderRadius: L.radius.lg, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: L.border },
  rowLabel: { color: L.dark, fontWeight: '600', fontSize: 15 },
  rowValue: { color: L.textMid, fontSize: 14 },
});
