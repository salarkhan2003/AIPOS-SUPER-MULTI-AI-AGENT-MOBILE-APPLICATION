import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { buildInjectScript, IRCTC_URL, runIrctcLoginFill } from '@/lib/browser';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

export default function BrowserScreen() {
  const insets = useSafeAreaInsets();
  const ref = useRef<WebView>(null);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [log, setLog] = useState('');
  const [filling, setFilling] = useState(false);

  const fillLogin = async () => {
    setFilling(true);
    try {
      const result = await runIrctcLoginFill(
        (js) => new Promise((resolve) => {
          ref.current?.injectJavaScript(`${js}; true;`);
          setTimeout(() => resolve('{"ok":true}'), 800);
        }),
        user,
        pass,
      );
      setLog(`✓ Filled — user: ${result.username}  pass: ${result.password}`);
    } catch (e) {
      setLog(`Error: ${String(e)}`);
    } finally {
      setFilling(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <View style={styles.urlBar}>
          <Icon name="globe" size={14} color={L.textLight} />
          <Text style={styles.urlText} numberOfLines={1}>{IRCTC_URL}</Text>
        </View>
      </View>

      {/* Credentials row */}
      <View style={styles.credRow}>
        <TextInput
          style={styles.credInput}
          placeholder="User ID"
          placeholderTextColor={L.textLight}
          value={user}
          onChangeText={setUser}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.credInput}
          placeholder="Password"
          placeholderTextColor={L.textLight}
          secureTextEntry
          value={pass}
          onChangeText={setPass}
        />
        <Pressable
          style={[styles.fillBtn, { opacity: filling ? 0.7 : 1 }]}
          onPress={fillLogin}
          disabled={filling}>
          <Text style={styles.fillBtnText}>{filling ? '…' : 'Fill'}</Text>
        </Pressable>
      </View>

      {log ? (
        <View style={styles.logBar}>
          <Text style={styles.logText} numberOfLines={1}>{log}</Text>
        </View>
      ) : null}

      {/* WebView */}
      <WebView
        ref={ref}
        source={{ uri: IRCTC_URL }}
        style={styles.web}
        injectedJavaScript={buildInjectScript()}
        onMessage={(e) => setLog((l) => l + '\n' + e.nativeEvent.data.slice(0, 200))}
        javaScriptEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: L.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center' },
  urlBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: L.surface, borderRadius: L.radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  urlText: { color: L.textMid, fontSize: 13, flex: 1 },
  credRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: L.border },
  credInput: { flex: 1, backgroundColor: L.surface, color: L.dark, paddingHorizontal: 12, paddingVertical: 8, borderRadius: L.radius.md, fontSize: 14, borderWidth: 1, borderColor: L.border },
  fillBtn: { backgroundColor: L.violet, paddingHorizontal: 16, borderRadius: L.radius.md, justifyContent: 'center' },
  fillBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  logBar: { backgroundColor: 'rgba(62,207,178,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: L.border },
  logText: { color: L.mint, fontSize: 12, fontWeight: '600' },
  web: { flex: 1 },
});
