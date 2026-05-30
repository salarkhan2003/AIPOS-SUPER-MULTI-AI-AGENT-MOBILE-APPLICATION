import { Icon, type IconName } from '@/components/Icon';
import { L } from '@/constants/light';
import { Href, router } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LinkItem = { label: string; href: Href; icon: IconName; color: string; bg: string };

const sections: { title: string; items: LinkItem[] }[] = [
  {
    title: 'AI & Agents',
    items: [
      { label: 'Daily Briefing', href: '/briefing', icon: 'bell', color: L.orange, bg: 'rgba(240,122,58,0.10)' },
      { label: 'Neural Log', href: '/command-center', icon: 'network', color: L.violet, bg: 'rgba(91,79,232,0.10)' },
      { label: 'Execution Monitor', href: '/execution-monitor', icon: 'activity', color: L.coral, bg: 'rgba(232,80,58,0.10)' },
      { label: 'Workflows', href: '/workflow-builder', icon: 'git-branch', color: L.mint, bg: 'rgba(62,207,178,0.10)' },
    ],
  },
  {
    title: 'Knowledge',
    items: [
      { label: 'Timeline', href: '/memory-timeline', icon: 'activity', color: L.violet, bg: 'rgba(91,79,232,0.10)' },
      { label: 'Knowledge Graph', href: '/knowledge-graph', icon: 'brain', color: L.coral, bg: 'rgba(232,80,58,0.10)' },
      { label: 'Notes', href: '/notes', icon: 'file-text', color: L.orange, bg: 'rgba(240,122,58,0.10)' },
      { label: 'Search', href: '/search', icon: 'search', color: L.dark, bg: 'rgba(0,0,0,0.06)' },
    ],
  },
  {
    title: 'Productivity',
    items: [
      { label: 'Calendar', href: '/calendar', icon: 'calendar', color: L.blue, bg: 'rgba(58,142,240,0.10)' },
      { label: 'Email', href: '/email-assistant', icon: 'mail', color: L.violet, bg: 'rgba(91,79,232,0.10)' },
      { label: 'Browser', href: '/browser', icon: 'globe', color: L.mint, bg: 'rgba(62,207,178,0.10)' },
    ],
  },
  {
    title: 'Account & Settings',
    items: [
      { label: 'Profile', href: '/profile', icon: 'user', color: L.dark, bg: 'rgba(0,0,0,0.06)' },
      { label: 'Ghost Pro', href: '/subscription', icon: 'sparkles', color: L.yellow, bg: 'rgba(245,200,66,0.15)' },
      { label: 'Integrations', href: '/integrations', icon: 'network', color: L.violet, bg: 'rgba(91,79,232,0.10)' },
      { label: 'Permissions', href: '/permissions', icon: 'shield', color: L.coral, bg: 'rgba(232,80,58,0.10)' },
      { label: 'Settings', href: '/settings', icon: 'settings', color: L.textMid, bg: 'rgba(0,0,0,0.06)' },
      { label: 'Audit Logs', href: '/activity-logs', icon: 'list', color: L.textMid, bg: 'rgba(0,0,0,0.06)' },
    ],
  },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <Text style={styles.title}>More</Text>
        </View>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.title.toUpperCase()}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.row,
                    idx < section.items.length - 1 && styles.rowBorder,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => router.push(item.href)}>
                  <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
                    <Icon name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Icon name="chevron" size={16} color={L.textLight} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: L.textLight, letterSpacing: 1.2, marginBottom: 8 },
  sectionCard: {
    backgroundColor: L.surface, borderRadius: L.radius.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: L.border },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, color: L.dark, fontWeight: '600', fontSize: 15 },
});
