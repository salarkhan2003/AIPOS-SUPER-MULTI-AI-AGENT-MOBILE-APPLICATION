import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Switch } from 'react-native';
import { router } from 'expo-router';
import { B } from '@/constants/basic';
import * as appmesh from '@/lib/appmesh';
import * as Notifications from 'expo-notifications';

export default function PermissionsScreen() {
  const [a11y, setA11y] = useState(false);
  const [notif, setNotif] = useState(false);

  const refresh = async () => {
    setA11y(await appmesh.isAccessibilityEnabled());
    const p = await Notifications.getPermissionsAsync();
    setNotif(p.granted);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <View style={s.root}>
      <Pressable onPress={() => router.back()}><Text style={s.back}>← Back</Text></Pressable>
      <Text style={s.h1}>Permissions</Text>

      <View style={s.card}>
        <Text style={s.label}>Accessibility (App Mesh)</Text>
        <Text style={s.sub}>Required for ui_tap / WhatsApp typing</Text>
        <Text style={s.val}>{a11y ? 'ENABLED' : 'DISABLED'}</Text>
        <Pressable style={s.btn} onPress={async () => { await appmesh.openAccessibilitySettings(); refresh(); }}>
          <Text style={s.btnTxt}>Open Accessibility Settings</Text>
        </Pressable>
        <Pressable style={[s.btn, { marginTop: 8 }]} onPress={async () => {
          await appmesh.uiTap('whatsapp', 'Search');
          refresh();
        }}>
          <Text style={s.btnTxt}>Test: tap WhatsApp Search</Text>
        </Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.label}>Notifications (Watchdogs)</Text>
        <Switch value={notif} onValueChange={async () => {
          await Notifications.requestPermissionsAsync();
          refresh();
        }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg, padding: B.pad, paddingTop: 48 },
  back: { color: B.accent },
  h1: { color: B.text, fontSize: 24, fontWeight: '700', marginVertical: 12 },
  card: { backgroundColor: B.card, padding: B.pad, borderRadius: B.radius, marginBottom: 12 },
  label: { color: B.text, fontWeight: '600' },
  sub: { color: B.dim, fontSize: 12, marginTop: 4 },
  val: { color: B.accent, marginVertical: 8, fontWeight: '700' },
  btn: { backgroundColor: B.accent, padding: 12, borderRadius: B.radius },
  btnTxt: { color: B.bg, fontWeight: '700', textAlign: 'center' },
});
