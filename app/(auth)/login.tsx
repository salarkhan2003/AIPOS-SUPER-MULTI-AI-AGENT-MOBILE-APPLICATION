import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { B } from '@/constants/basic';

export default function LoginScreen() {
  return (
    <View style={s.root}>
      <Text style={s.h1}>Sign in</Text>
      <Pressable style={s.btn} onPress={() => router.replace('/(tabs)')}>
        <Text style={s.btnTxt}>Enter Ghost OS</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg, justifyContent: 'center', padding: B.pad },
  h1: { color: B.text, fontSize: 28, marginBottom: 24 },
  btn: { backgroundColor: B.accent, padding: 16, borderRadius: B.radius },
  btnTxt: { color: B.bg, fontWeight: '700', textAlign: 'center' },
});
