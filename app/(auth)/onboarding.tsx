import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { B } from '@/constants/basic';

export default function OnboardingScreen() {
  return (
    <View style={s.root}>
      <Text style={s.logo}>GHOST</Text>
      <Text style={s.sub}>AI Personal Operating System</Text>
      <Pressable style={s.btn} onPress={() => router.replace('/(auth)/login')}>
        <Text style={s.btnTxt}>Continue</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg, justifyContent: 'center', padding: B.pad },
  logo: { color: B.text, fontSize: 40, fontWeight: '800', textAlign: 'center' },
  sub: { color: B.dim, textAlign: 'center', marginVertical: 24 },
  btn: { backgroundColor: B.accent, padding: 16, borderRadius: B.radius },
  btnTxt: { color: B.bg, fontWeight: '700', textAlign: 'center' },
});
