import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router, Href } from 'expo-router';
import { B } from '@/constants/basic';

const links: { label: string; href: Href }[] = [
  { label: 'Daily Briefing', href: '/briefing' },
  { label: 'Neural Log', href: '/command-center' },
  { label: 'Timeline', href: '/memory-timeline' },
  { label: 'Knowledge Graph', href: '/knowledge-graph' },
  { label: 'Execution Monitor', href: '/execution-monitor' },
  { label: 'Workflows', href: '/workflow-builder' },
  { label: 'Browser (IRCTC)', href: '/browser' },
  { label: 'Email', href: '/email-assistant' },
  { label: 'Notes', href: '/notes' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Permissions', href: '/permissions' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Ghost Pro', href: '/subscription' },
  { label: 'Settings', href: '/settings' },
  { label: 'Audit Logs', href: '/activity-logs' },
  { label: 'Search', href: '/search' },
  { label: 'Profile', href: '/profile' },
];

export default function MoreScreen() {
  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={s.h1}>More</Text>
      {links.map((l) => (
        <Pressable key={l.label} style={s.card} onPress={() => router.push(l.href)}>
          <Text style={s.txt}>{l.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg, padding: B.pad, paddingTop: 56 },
  h1: { color: B.text, fontSize: 24, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: B.card, padding: 14, borderRadius: B.radius, marginBottom: 8 },
  txt: { color: B.text, fontWeight: '600' },
});
