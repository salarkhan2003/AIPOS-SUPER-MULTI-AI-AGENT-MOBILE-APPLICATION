import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { B } from '@/constants/basic';
import { purchaseGhostPro } from '@/lib/entitlements';
import { useGhostStore } from '@/store/ghostStore';

export default function SubscriptionScreen() {
  const setPro = useGhostStore((s) => s.setPro);
  const isPro = useGhostStore((s) => s.isPro);

  return (
    <View style={s.root}>
      <Pressable onPress={() => router.back()}><Text style={s.back}>← Back</Text></Pressable>
      <Text style={s.h1}>Ghost Pro</Text>
      <Text style={s.price}>₹199 / month</Text>
      <Text style={s.feat}>• Unlimited watchdogs{'\n'}• App Mesh (Accessibility){'\n'}• Priority agents</Text>
      <Pressable
        style={s.btn}
        onPress={async () => {
          const r = await purchaseGhostPro();
          if (r.success) setPro(true);
        }}>
        <Text style={s.btnTxt}>{isPro ? 'Active' : 'Subscribe via Razorpay'}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg, padding: B.pad, paddingTop: 48 },
  back: { color: B.accent },
  h1: { color: B.text, fontSize: 28, fontWeight: '800', marginTop: 16 },
  price: { color: B.accent, fontSize: 32, fontWeight: '800', marginVertical: 16 },
  feat: { color: B.dim, lineHeight: 24, marginBottom: 24 },
  btn: { backgroundColor: B.accent, padding: 16, borderRadius: B.radius },
  btnTxt: { color: B.bg, fontWeight: '700', textAlign: 'center' },
});
