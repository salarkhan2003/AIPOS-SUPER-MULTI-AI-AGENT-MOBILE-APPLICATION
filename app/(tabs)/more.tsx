import { Icon, type IconName } from '@/components/Icon';
import { useTheme } from '@/lib/themeContext';
import { Href, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LinkItem = { label: string; href: Href; icon: IconName; color: string; bg: string };

function buildSections(C: ReturnType<typeof useTheme>['colors']): { title: string; items: LinkItem[] }[] {
  return [
    {
      title: 'AI & Agents',
      items: [
        { label: 'AGI Agents', href: '/agents', icon: 'brain', color: '#9D8AFF', bg: '#9D8AFF1A' },
        { label: 'Voice History', href: '/voice-history', icon: 'mic', color: C.violet, bg: C.violet + '1A' },
        { label: 'Daily Briefing', href: '/briefing', icon: 'bell', color: C.orange, bg: C.orange + '1A' },
        { label: 'Neural Log', href: '/command-center', icon: 'network', color: C.violet, bg: C.violet + '1A' },
        { label: 'Execution Monitor', href: '/execution-monitor', icon: 'activity', color: C.coral, bg: C.coral + '1A' },
        { label: 'Workflows', href: '/workflow-builder', icon: 'git-branch', color: C.mint, bg: C.mint + '1A' },
      ],
    },
    {
      title: 'Knowledge',
      items: [
        { label: 'Timeline', href: '/memory-timeline', icon: 'activity', color: C.violet, bg: C.violet + '1A' },
        { label: 'Knowledge Graph', href: '/knowledge-graph', icon: 'brain', color: C.coral, bg: C.coral + '1A' },
        { label: 'Notes', href: '/notes', icon: 'file-text', color: C.orange, bg: C.orange + '1A' },
        { label: 'Search', href: '/search', icon: 'search', color: C.text, bg: C.border },
      ],
    },
    {
      title: 'Productivity',
      items: [
        { label: 'Calendar', href: '/calendar', icon: 'calendar', color: C.blue, bg: C.blue + '1A' },
        { label: 'Email', href: '/email-assistant', icon: 'mail', color: C.violet, bg: C.violet + '1A' },
        { label: 'Browser', href: '/browser', icon: 'globe', color: C.mint, bg: C.mint + '1A' },
      ],
    },
    {
      title: 'Account & Settings',
      items: [
        { label: 'Profile', href: '/profile', icon: 'user', color: C.text, bg: C.border },
        { label: 'Ghost Pro', href: '/subscription', icon: 'sparkles', color: C.yellow, bg: C.yellow + '28' },
        { label: 'Integrations', href: '/integrations', icon: 'network', color: C.violet, bg: C.violet + '1A' },
        { label: 'Permissions', href: '/permissions', icon: 'shield', color: C.coral, bg: C.coral + '1A' },
        { label: 'Settings', href: '/settings', icon: 'settings', color: C.textMid, bg: C.border },
        { label: 'Audit Logs', href: '/activity-logs', icon: 'list', color: C.textMid, bg: C.border },
      ],
    },
  ];
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const sections = useMemo(() => buildSections(C), [C]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
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
                  <Icon name="chevron" size={16} color={C.textLight} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
    title: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: C.textLight, letterSpacing: 1.2, marginBottom: 8 },
    sectionCard: {
      backgroundColor: C.surface,
      borderRadius: C.radius.lg,
      borderWidth: 1,
      borderColor: C.border,
      elevation: 3,
      overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, color: C.text, fontWeight: '600', fontSize: 15 },
  });
}
