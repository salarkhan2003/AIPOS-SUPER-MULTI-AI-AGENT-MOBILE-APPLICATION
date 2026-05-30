import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import * as appmesh from '@/lib/appmesh';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const [a11y, setA11y] = useState(false);
  const [notif, setNotif] = useState(false);

  const refresh = async () => {
    setA11y(await appmesh.isAccessibilityEnabled());
    const p = await Notifications.getPermissionsAsync();
    setNotif(p.granted);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Icon name="back" size={20} color={L.dark} />
          </Pressable>
          <Text style={styles.title}>Permissions</Text>
        </View>

        {/* Accessibility */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(91,79,232,0.10)' }]}>
              <Icon name="shield" size={20} color={L.violet} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Accessibility (App Mesh)</Text>
              <Text style={styles.cardSub}>Required for ui_tap / WhatsApp typing</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: a11y ? 'rgba(62,207,178,0.12)' : 'rgba(232,80,58,0.10)' }]}>
              <Text style={[styles.statusText, { color: a11y ? L.mint : L.coral }]}>
                {a11y ? 'ON' : 'OFF'}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.actionBtn}
            onPress={async () => { await appmesh.openAccessibilitySettings(); refresh(); }}>
            <Text style={styles.actionBtnText}>Open Accessibility Settings</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={async () => { await appmesh.uiTap('whatsapp', 'Search'); refresh(); }}>
            <Text style={[styles.actionBtnText, { color: L.violet }]}>Test: tap WhatsApp Search</Text>
          </Pressable>
        </View>

        {/* Notifications */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(240,122,58,0.10)' }]}>
              <Icon name="bell" size={20} color={L.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Notifications</Text>
              <Text style={styles.cardSub}>Required for watchdog alerts</Text>
            </View>
            <Switch
              value={notif}
              onValueChange={async () => {
                await Notifications.requestPermissionsAsync();
                refresh();
              }}
              trackColor={{ false: L.border, true: L.mint }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Icon name="sparkles" size={16} color={L.violet} />
          <Text style={styles.infoText}>
            Ghost only uses these permissions to execute tasks you explicitly request. No background data collection.
          </Text>
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
  card: { marginHorizontal: 16, backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: L.dark, fontWeight: '700', fontSize: 15 },
  cardSub: { color: L.textMid, fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: L.radius.pill },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  actionBtn: { backgroundColor: L.dark, borderRadius: L.radius.md, padding: 13, alignItems: 'center', marginBottom: 8 },
  actionBtnSecondary: { backgroundColor: 'rgba(91,79,232,0.08)', marginBottom: 0 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, backgroundColor: 'rgba(91,79,232,0.06)', borderRadius: L.radius.lg, padding: 14 },
  infoText: { color: L.violet, fontSize: 13, flex: 1, lineHeight: 18 },
});
