import { Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { BasicScreen, Card } from '@/components/Screen';
import { B } from '@/constants/basic';
import { useGhostStore } from '@/store/ghostStore';

export default function ProfileScreen() {
  const user = useGhostStore((s) => s.user);
  const isPro = useGhostStore((s) => s.isPro);
  return (
    <BasicScreen title="Profile">
      <Card><Text style={{ color: B.text }}>{user.name}</Text><Text style={{ color: B.dim }}>{isPro ? 'Ghost Pro' : 'Free'}</Text></Card>
      <Pressable style={s.btn} onPress={() => router.push('/subscription')}><Text style={s.btnTxt}>Upgrade</Text></Pressable>
    </BasicScreen>
  );
}

const s = StyleSheet.create({
  btn: { backgroundColor: B.accent, padding: 14, borderRadius: 12 },
  btnTxt: { color: B.bg, fontWeight: '700', textAlign: 'center' },
});
