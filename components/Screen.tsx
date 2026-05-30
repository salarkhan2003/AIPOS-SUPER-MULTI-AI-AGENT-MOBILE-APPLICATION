import { View, Text, Pressable, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { B } from '@/constants/basic';

export function BasicScreen({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <ScrollView style={s.root} contentContainerStyle={s.pad}>
      <Pressable onPress={() => router.back()}><Text style={s.back}>← Back</Text></Pressable>
      <Text style={s.h1}>{title}</Text>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg },
  pad: { padding: B.pad, paddingTop: 48, paddingBottom: 80 },
  back: { color: B.accent, marginBottom: 8 },
  h1: { color: B.text, fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: { backgroundColor: B.card, padding: B.pad, borderRadius: B.radius, marginBottom: 8 },
});
