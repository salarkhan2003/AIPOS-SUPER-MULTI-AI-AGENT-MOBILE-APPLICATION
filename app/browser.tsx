import { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import WebView from 'react-native-webview';
import { B } from '@/constants/basic';
import { buildInjectScript, IRCTC_URL, runIrctcLoginFill } from '@/lib/browser';

export default function BrowserScreen() {
  const ref = useRef<WebView>(null);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [log, setLog] = useState('');

  const inject = (js: string) =>
    new Promise<string>((resolve) => {
      ref.current?.injectJavaScript(`${js}; true;`);
      setTimeout(() => resolve(''), 500);
    });

  const onMessage = (e: { nativeEvent: { data: string } }) => {
    setLog((l) => l + '\n' + e.nativeEvent.data.slice(0, 200));
  };

  const fillLogin = async () => {
    const result = await runIrctcLoginFill(
      (js) =>
        new Promise((resolve) => {
          ref.current?.injectJavaScript(`${js}; true;`);
          setTimeout(() => resolve('{"ok":true}'), 800);
        }),
      user,
      pass,
    );
    setLog(`Fill username: ${result.username} password: ${result.password}`);
  };

  return (
    <View style={s.root}>
      <Pressable onPress={() => router.back()}><Text style={s.back}>← Back</Text></Pressable>
      <Text style={s.h1}>Browser Agent (IRCTC)</Text>
      <TextInput style={s.input} placeholder="User ID" placeholderTextColor={B.dim} value={user} onChangeText={setUser} />
      <TextInput style={s.input} placeholder="Password" placeholderTextColor={B.dim} secureTextEntry value={pass} onChangeText={setPass} />
      <Pressable style={s.btn} onPress={fillLogin}><Text style={s.btnTxt}>Fill login fields</Text></Pressable>
      <WebView
        ref={ref}
        source={{ uri: IRCTC_URL }}
        style={s.web}
        injectedJavaScript={buildInjectScript()}
        onMessage={onMessage}
        javaScriptEnabled
      />
      <Text style={s.log} numberOfLines={4}>{log}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg, paddingTop: 48 },
  back: { color: B.accent, marginLeft: B.pad },
  h1: { color: B.text, fontSize: 20, fontWeight: '700', margin: B.pad },
  input: { backgroundColor: B.card, color: B.text, marginHorizontal: B.pad, padding: 10, borderRadius: B.radius, marginBottom: 8 },
  btn: { backgroundColor: B.accent, marginHorizontal: B.pad, padding: 12, borderRadius: B.radius, marginBottom: 8 },
  btnTxt: { color: B.bg, fontWeight: '700', textAlign: 'center' },
  web: { flex: 1, margin: B.pad, borderRadius: B.radius },
  log: { color: B.dim, fontSize: 10, padding: B.pad },
});
