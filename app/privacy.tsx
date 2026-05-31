import { Icon } from '@/components/Icon';
import { useTheme } from '@/lib/themeContext';
import { router } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivacyPage() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: C.surface, borderColor: C.border, borderWidth: 1 }]} onPress={() => router.back()} hitSlop={12}>
          <Icon name="back" size={20} color={C.text} />
        </Pressable>
        <Text style={[styles.title, { color: C.text }]}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <View style={[styles.section]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Last Updated: May 2025</Text>
          
          <Text style={[styles.heading, { color: C.text }]}>1. Information We Collect</Text>
          <Text style={[styles.text, { color: C.textMid }]}>
            We store your data locally on your device only using AsyncStorage. We do not send your personal data to any servers except:
            {'\n'}- AI API providers (Groq, OpenRouter/OpenAI) for processing your requests
            {'\n'}- Expo for push notifications (if enabled)
          </Text>

          <Text style={[styles.heading, { color: C.text }]}>2. How We Use Your Data</Text>
          <Text style={[styles.text, { color: C.textMid }]}>
            Your data is used solely to provide the AI assistant functionality. We do not sell or share your data with third parties except as required by law or to provide the service.
          </Text>

          <Text style={[styles.heading, { color: C.text }]}>3. Data Security</Text>
          <Text style={[styles.text, { color: C.textMid }]}>
            Your data is stored locally on your device. You can encrypt your device for additional security. We take reasonable measures but cannot guarantee absolute security.
          </Text>

          <Text style={[styles.heading, { color: C.text }]}>4. Your Rights</Text>
          <Text style={[styles.text, { color: C.textMid }]}>
            You can delete all your data by clearing the app storage or uninstalling the app.
          </Text>

          <Text style={[styles.heading, { color: C.text }]}>5. Third-Party Services</Text>
          <Text style={[styles.text, { color: C.textMid }]}>
            This app uses:
            {'\n'}- Groq (AI processing)
            {'\n'}- OpenRouter/OpenAI (AI fallback)
            {'\n'}- Expo (build and notifications)
            {'\n\n'}Please review their privacy policies as well.
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
  text: { fontSize: 14, lineHeight: 22 }
});
