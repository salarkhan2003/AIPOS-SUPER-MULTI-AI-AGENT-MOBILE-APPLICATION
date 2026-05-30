import { Clay } from '@/constants/clay';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Brain,
  Calendar,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  GitBranch,
  Globe,
  Grid2x2 as GridIcon,
  Layers,
  List,
  Mail,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Navigation,
  Network,
  Search,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  User,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

export const Icons = {
  home: GridIcon,
  voice: Mic,
  tasks: List,
  memory: Layers,
  more: MoreHorizontal,
  back: ArrowLeft,
  forward: ArrowRight,
  chevron: ChevronRight,
  search: Search,
  brain: Brain,
  network: Network,
  bell: Bell,
  mail: Mail,
  calendar: Calendar,
  globe: Globe,
  shield: Shield,
  settings: Settings,
  user: User,
  card: CreditCard,
  zap: Zap,
  activity: Activity,
  book: BookOpen,
  sparkles: Sparkles,
  check: Check,
  close: X,
  list: List,
  'arrow-up-right': ArrowUpRight,
  mic: Mic,
  'message-circle': MessageCircle,
  navigation: Navigation,
  terminal: Terminal,
  'file-text': FileText,
  'git-branch': GitBranch,
} as const;

export type IconName = keyof typeof Icons;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle;
};

export function Icon({ name, size = 22, color = Clay.text, strokeWidth = 2, style }: Props) {
  const Lucide: LucideIcon = Icons[name];
  const props = { size, strokeWidth, color } as React.ComponentProps<LucideIcon>;
  return (
    <View style={style}>
      <Lucide {...props} />
    </View>
  );
}

export function BackButton({ onPress, label = 'Back' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable onPress={onPress} style={back.row} hitSlop={12}>
      <Icon name="back" size={20} color={Clay.accent} />
      {label ? <Text style={back.label}>{label}</Text> : null}
    </Pressable>
  );
}

export function BulletRow({ text, icon = 'check' as IconName }: { text: string; icon?: IconName }) {
  return (
    <View style={back.bulletRow}>
      <Icon name={icon} size={16} color={Clay.accent} strokeWidth={2.5} />
      <Text style={back.bulletText}>{text}</Text>
    </View>
  );
}

const back = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: { color: Clay.accent, fontSize: 15, fontWeight: '600' },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  bulletText: { color: Clay.textDim, fontSize: 14, flex: 1 },
});
