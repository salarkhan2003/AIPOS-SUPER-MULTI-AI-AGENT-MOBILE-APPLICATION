import { Icon } from '@/components/Icon';
import { useTheme } from '@/lib/themeContext';
import { router } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsPage() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: C.surface, borderColor: C.border, borderWidth: 1 }]} onPress={() => router.back()} hitSlop={12}>
          <Icon name="back" size={20} color={C.text} />
        </Pressable>
        <Text style={[styles.title, { color: C.text }]}>Terms of Service</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Last Updated: May 2025</Text>
          
          <Text style={[styles.heading, { color: C.text }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.text, { color: C.textMid }]}>
            Welcome to Ghost AGI. By using this app, you agree to these Terms of Service. If you don't agree, please don't use the app.
          </Text>

          <Text style={[styles.heading, { color: C.text }]}>2. Description of Service</Text>
          <Text style={[styles.text, { color: C.textMid }]}>
            Ghost AGI is a personal AI assistant that uses third-party AI models (via Groq, OpenRouter/OpenAI) to help you manage your tasks, calendar, notes, and more.
          </Text>

          <Text style={[styles.heading, { color: C.text }]}>3. User Responsibilities</Text>
          <Text style={[styles.text, { color: C.textMid }]}>
            You are responsible for:
          </Text>
          <Text style={[styles.bullet, { color: C.textMid }]}>• Using the app legally and responsibly</Text>
          <Text style={[styles.bullet, { color: C.textMid }]}>• Keeping your API keys secure</Text>
          <Text style={[styles.bullet, { color: C.textMid }]}>• The content you generate with the AI</Text>
          <Text style={[styles.bullet, { color: C.textMid }]}>• Backing up your data</Text>

          <Text style={[styles.heading, { color: C.text }]}>4. AI Disclaimer</Text>
          <Text style={[styles.text, { color: C.textMid }]}>
            AI-generated content may be inaccurate, incomplete, or inappropriate. Always verify important information before relying on it. We are not responsible for AI outputs.
          </Text>

          <Text style={[styles.heading, { color: C.text }]}>5. Full Mobile Access</Text>
          <Text style={[styles.text, { color: C.textMid }]}>
            If you grant full mobile access, you acknowledge the risks and agree that we are not responsible for any actions the AI takes on your device.
          </Text>

          <Text style={[styles.heading, { color: C.text }]}>6. Limitation of Liability</Text>
          <Text style={[styles.text, { color: C.textMid }]}>
            To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, consequential, or punitive damages.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '900' },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  section: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 20, opacity: 0.7 },
  heading: { fontSize: 16, fontWeight: '800', marginTop: 24, marginBottom: 8 },
  text: { fontSize: 14, lineHeight: 22 },
  bullet: { fontSize: 14, lineHeight: 22, paddingLeft: 8, marginBottom: 4 },
});
