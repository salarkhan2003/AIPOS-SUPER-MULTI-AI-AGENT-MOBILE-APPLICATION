import { Icon } from '@/components/Icon';
import {
  Category,
  Priority,
  SavedDeadline,
  SavedMeeting,
  SavedTask,
  deadlinesStorage,
  meetingsStorage,
  tasksStorage,
} from '@/lib/storage';
import { useTheme } from '@/lib/themeContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const GAP = 12;
const HALF = (width - 32 - GAP) / 2;

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterTab = 'All' | 'Tasks' | 'Meetings' | 'Deadlines';
type ItemType = 'task' | 'meeting' | 'deadline';
type AddType = ItemType;

interface UnifiedItem {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  category: Category;
  createdAt: number;
  type: ItemType;
  completed?: boolean;
  typeColor: string;
  typeBg: string;
  timeLabel: string;
  raw: SavedTask | SavedMeeting | SavedDeadline;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const TYPE_META: Record<ItemType, { label: string; color: string; bg: string; icon: 'check-square' | 'calendar' | 'alert' }> = {
  task:     { label: 'Task',     color: '#9D8AFF', bg: 'rgba(157,138,255,0.15)', icon: 'check-square' },
  meeting:  { label: 'Meeting',  color: '#5CE1E6', bg: 'rgba(92,225,230,0.15)',  icon: 'calendar'     },
  deadline: { label: 'Deadline', color: '#FF8A7A', bg: 'rgba(255,138,122,0.15)', icon: 'alert'        },
};

const PRIORITY_COLOR: Record<Priority, string> = {
  low:    '#6EE7A0',
  medium: '#FFC857',
  high:   '#FF8A7A',
  urgent: '#FF4D6A',
};

const PRIORITY_BG: Record<Priority, string> = {
  low:    'rgba(110,231,160,0.15)',
  medium: 'rgba(255,200,87,0.15)',
  high:   'rgba(255,138,122,0.15)',
  urgent: 'rgba(255,77,106,0.15)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(date: Date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(date: Date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function toISO(date: Date) {
  return date.toISOString().split('T')[0];
}

function getTimeLabel(raw: SavedTask | SavedMeeting | SavedDeadline, type: ItemType): string {
  if (type === 'task') {
    const t = raw as SavedTask;
    if (!t.dueDate) return 'No due date';
    return `Due ${fmt(new Date(t.dueDate))}`;
  }
  if (type === 'meeting') {
    const m = raw as SavedMeeting;
    return `${fmt(new Date(m.date))} · ${m.time}`;
  }
  const d = raw as SavedDeadline;
  return `Deadline ${fmt(new Date(d.dueDate))}`;
}

function toUnified(raw: SavedTask | SavedMeeting | SavedDeadline, type: ItemType): UnifiedItem {
  const meta = TYPE_META[type];
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    priority: raw.priority,
    category: raw.category,
    createdAt: raw.createdAt,
    type,
    completed: type === 'task' ? (raw as SavedTask).completed : undefined,
    typeColor: meta.color,
    typeBg: meta.bg,
    timeLabel: getTimeLabel(raw, type),
    raw,
  };
}

// ── Date/Time Picker Row ──────────────────────────────────────────────────────

interface PickerRowProps {
  label: string;
  date: Date;
  mode: 'date' | 'time';
  onChange: (d: Date) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function PickerRow({ label, date, mode, onChange, colors: C }: PickerRowProps) {
  const [show, setShow] = useState(false);

  const display = mode === 'date' ? fmt(date) : fmtTime(date);

  const onPick = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setShow(false);
    if (selected) onChange(selected);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: C.textMid, marginBottom: 6, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Text>
      <Pressable
        onPress={() => setShow(true)}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
          borderWidth: 1.5, borderColor: C.border,
        }}>
        <Icon name={mode === 'date' ? 'calendar' : 'clock'} size={16} color={C.violet} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>{display}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={date}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPick}
        />
      )}
    </View>
  );
}

// ── Add Modal ─────────────────────────────────────────────────────────────────

interface AddModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function AddModal({ visible, onClose, onSaved, colors: C }: AddModalProps) {
  const [addType, setAddType] = useState<AddType>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('work');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const S = useMemo(() => modalStyles(C), [C]);

  const reset = () => {
    setTitle(''); setDescription(''); setPriority('medium');
    setCategory('work'); setDate(new Date()); setTime(new Date()); setLocation('');
  };

  const save = async () => {
    if (!title.trim()) { Alert.alert('Title required'); return; }
    setSaving(true);
    try {
      const dateStr = toISO(date);
      const timeStr = fmtTime(time);
      if (addType === 'task') {
        await tasksStorage.add({ title: title.trim(), description, priority, category, dueDate: dateStr, repeat: 'none' });
      } else if (addType === 'meeting') {
        await meetingsStorage.add({ title: title.trim(), description, priority, category, date: dateStr, time: timeStr, location: location || undefined, repeat: 'none' });
      } else {
        await deadlinesStorage.add({ title: title.trim(), description, priority, category, dueDate: dateStr, repeat: 'none' });
      }
      reset(); onSaved(); onClose();
    } finally { setSaving(false); }
  };

  const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
  const categories: Category[] = ['work', 'personal', 'health', 'finance', 'education', 'other'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={S.backdrop} onPress={onClose} />
        <View style={S.sheet}>
          <View style={S.handle} />

          {/* Type tabs */}
          <View style={S.typeRow}>
            {(['task', 'meeting', 'deadline'] as AddType[]).map((t) => {
              const meta = TYPE_META[t];
              const active = addType === t;
              return (
                <Pressable
                  key={t}
                  style={[S.typeBtn, active && { backgroundColor: meta.bg, borderColor: meta.color }]}
                  onPress={() => setAddType(t)}>
                  <Icon name={meta.icon} size={14} color={active ? meta.color : C.textMid} />
                  <Text style={[S.typeBtnText, active && { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Title */}
            <Text style={S.fieldLabel}>TITLE</Text>
            <TextInput
              style={S.input}
              value={title}
              onChangeText={setTitle}
              placeholder="What needs to be done?"
              placeholderTextColor={C.textLight}
            />

            {/* Description */}
            <Text style={S.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              style={[S.input, { height: 72, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Details…"
              placeholderTextColor={C.textLight}
              multiline
            />

            {/* Date picker */}
            <PickerRow
              label={addType === 'meeting' ? 'Date' : 'Due Date'}
              date={date}
              mode="date"
              onChange={setDate}
              colors={C}
            />

            {/* Time picker — meetings only */}
            {addType === 'meeting' && (
              <>
                <PickerRow label="Time" date={time} mode="time" onChange={setTime} colors={C} />
                <Text style={S.fieldLabel}>LOCATION (OPTIONAL)</Text>
                <TextInput
                  style={S.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Office, Zoom…"
                  placeholderTextColor={C.textLight}
                />
              </>
            )}

            {/* Priority */}
            <Text style={S.fieldLabel}>PRIORITY</Text>
            <View style={S.chipRow}>
              {priorities.map((p) => (
                <Pressable
                  key={p}
                  style={[S.chip, priority === p && { backgroundColor: PRIORITY_BG[p], borderColor: PRIORITY_COLOR[p] }]}
                  onPress={() => setPriority(p)}>
                  <View style={[S.dot, { backgroundColor: PRIORITY_COLOR[p] }]} />
                  <Text style={[S.chipText, priority === p && { color: PRIORITY_COLOR[p], fontWeight: '700' }]}>{p}</Text>
                </Pressable>
              ))}
            </View>

            {/* Category */}
            <Text style={S.fieldLabel}>CATEGORY</Text>
            <View style={S.chipRow}>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  style={[S.chip, category === cat && { backgroundColor: 'rgba(157,138,255,0.15)', borderColor: '#9D8AFF' }]}
                  onPress={() => setCategory(cat)}>
                  <Text style={[S.chipText, category === cat && { color: '#9D8AFF', fontWeight: '700' }]}>{cat}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={[S.saveBtn, { opacity: saving ? 0.7 : 1 }]} onPress={save} disabled={saving}>
              <Text style={S.saveBtnText}>{saving ? 'Saving…' : `Add ${TYPE_META[addType].label}`}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function modalStyles(C: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: {
      backgroundColor: C.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32,
      padding: 20, maxHeight: '88%',
      borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border,
    },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 18 },
    typeRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
    typeBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 9, borderRadius: 14, backgroundColor: C.surface,
      borderWidth: 1.5, borderColor: C.border,
    },
    typeBtnText: { fontSize: 12, fontWeight: '700', color: C.textMid },
    fieldLabel: { fontSize: 10, fontWeight: '800', color: C.textMid, marginBottom: 7, letterSpacing: 1 },
    input: {
      backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
      fontSize: 14, color: C.text, borderWidth: 1.5, borderColor: C.border, marginBottom: 14,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
      backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    chipText: { fontSize: 12, fontWeight: '500', color: C.textMid },
    saveBtn: {
      borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 4, marginBottom: 28,
      backgroundColor: '#6B4EFF',
      shadowColor: '#6B4EFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
    },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  });
}

// ── Item Card ─────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: UnifiedItem;
  onToggle?: () => void;
  onDelete: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function ItemCard({ item, onToggle, onDelete, colors: C }: ItemCardProps) {
  const meta = TYPE_META[item.type];

  const confirmDelete = () =>
    Alert.alert('Delete?', `Remove "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);

  return (
    <Pressable
      style={[
        cS.card,
        { backgroundColor: C.surface, borderColor: C.border },
        item.completed && { opacity: 0.55 },
      ]}
      onLongPress={confirmDelete}>

      {/* Left accent bar */}
      <View style={[cS.accent, { backgroundColor: meta.color }]} />

      <View style={cS.body}>
        {/* Top row: type pill + priority pill */}
        <View style={cS.topRow}>
          <View style={[cS.pill, { backgroundColor: meta.bg }]}>
            <Icon name={meta.icon} size={10} color={meta.color} />
            <Text style={[cS.pillText, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
          </View>
          <View style={[cS.pill, { backgroundColor: PRIORITY_BG[item.priority] }]}>
            <View style={[cS.dot, { backgroundColor: PRIORITY_COLOR[item.priority] }]} />
            <Text style={[cS.pillText, { color: PRIORITY_COLOR[item.priority] }]}>{item.priority}</Text>
          </View>
          <Text style={[cS.cat, { color: C.textLight }]}>{item.category}</Text>
        </View>

        {/* Title */}
        <Text style={[cS.title, { color: C.text }, item.completed && cS.titleDone]} numberOfLines={1}>
          {item.title}
        </Text>

        {/* Time */}
        <View style={cS.timeRow}>
          <Icon name="clock" size={11} color={C.textLight} />
          <Text style={[cS.timeText, { color: C.textLight }]}>{item.timeLabel}</Text>
        </View>
      </View>

      {/* Checkbox for tasks */}
      {item.type === 'task' && onToggle && (
        <Pressable
          style={[cS.checkbox, { borderColor: item.completed ? meta.color : C.border },
            item.completed && { backgroundColor: meta.color }]}
          onPress={onToggle}
          hitSlop={8}>
          {item.completed && <Icon name="check" size={11} color="#fff" />}
        </Pressable>
      )}
    </Pressable>
  );
}

const cS = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, marginBottom: 8,
    borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  accent: { width: 3, alignSelf: 'stretch' },
  body: { flex: 1, paddingVertical: 11, paddingHorizontal: 12, gap: 5 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  cat: { fontSize: 9, fontWeight: '600', marginLeft: 'auto' },
  title: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  titleDone: { textDecorationLine: 'line-through' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, fontWeight: '500' },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

const FILTER_TABS: FilterTab[] = ['All', 'Tasks', 'Meetings', 'Deadlines'];

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const S = useMemo(() => makeStyles(C), [C]);

  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [tasks, meetings, deadlines] = await Promise.all([
      tasksStorage.list(), meetingsStorage.list(), deadlinesStorage.list(),
    ]);
    const unified: UnifiedItem[] = [
      ...tasks.map((t) => toUnified(t, 'task')),
      ...meetings.map((m) => toUnified(m, 'meeting')),
      ...deadlines.map((d) => toUnified(d, 'deadline')),
    ].sort((a, b) => b.createdAt - a.createdAt);
    setItems(unified);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    if (activeTab === 'All') return items;
    const map: Record<FilterTab, ItemType | null> = { All: null, Tasks: 'task', Meetings: 'meeting', Deadlines: 'deadline' };
    return items.filter((i) => i.type === map[activeTab]);
  }, [items, activeTab]);

  const counts = useMemo(() => ({
    All: items.length,
    Tasks: items.filter((i) => i.type === 'task').length,
    Meetings: items.filter((i) => i.type === 'meeting').length,
    Deadlines: items.filter((i) => i.type === 'deadline').length,
  }), [items]);

  const handleToggle = async (item: UnifiedItem) => {
    if (item.type !== 'task') return;
    await tasksStorage.toggle(item.id);
    load();
  };

  const handleDelete = async (item: UnifiedItem) => {
    if (item.type === 'task') await tasksStorage.remove(item.id);
    else if (item.type === 'meeting') await meetingsStorage.remove(item.id);
    else await deadlinesStorage.remove(item.id);
    load();
  };

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={S.header}>
        <View>
          <Text style={S.title}>Tasks</Text>
          <Text style={S.subtitle}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
        </View>
        <Pressable style={S.addBtn} onPress={() => setShowModal(true)}>
          <Icon name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Filter widgets */}
      <View style={S.filtersRow}>
        <Pressable style={[S.filterWidget, { backgroundColor: '#6B4EFF', marginRight: GAP }]} onPress={() => setActiveTab('All')}>
          <Text style={S.filterLabelLight}>ALL</Text>
          <Text style={S.filterCountLight}>{counts.All}</Text>
          {activeTab === 'All' && (
            <View style={[S.activeIndicator, { backgroundColor: '#fff' }]} />
          )}
        </Pressable>
        <Pressable style={[S.filterWidget, { backgroundColor: '#9D8AFF' }]} onPress={() => setActiveTab('Tasks')}>
          <Text style={S.filterLabelLight}>TASKS</Text>
          <Text style={S.filterCountLight}>{counts.Tasks}</Text>
          {activeTab === 'Tasks' && (
            <View style={[S.activeIndicator, { backgroundColor: '#fff' }]} />
          )}
        </Pressable>
      </View>
      <View style={[S.filtersRow, { marginTop: GAP }]}>
        <Pressable style={[S.filterWidget, { backgroundColor: '#5CE1E6', marginRight: GAP }]} onPress={() => setActiveTab('Meetings')}>
          <Text style={S.filterLabelDark}>MEETINGS</Text>
          <Text style={S.filterCountDark}>{counts.Meetings}</Text>
          {activeTab === 'Meetings' && (
            <View style={[S.activeIndicator, { backgroundColor: '#000' }]} />
          )}
        </Pressable>
        <Pressable style={[S.filterWidget, { backgroundColor: '#FF8A7A' }]} onPress={() => setActiveTab('Deadlines')}>
          <Text style={S.filterLabelLight}>DEADLINES</Text>
          <Text style={S.filterCountLight}>{counts.Deadlines}</Text>
          {activeTab === 'Deadlines' && (
            <View style={[S.activeIndicator, { backgroundColor: '#fff' }]} />
          )}
        </Pressable>
      </View>

      {/* List */}
      <View style={{ marginTop: 16 }} />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={S.empty}>
            <View style={S.emptyIcon}>
              <Icon name="check-square" size={26} color={C.textLight} />
            </View>
            <Text style={S.emptyTitle}>{loading ? 'Loading…' : 'Nothing here yet'}</Text>
            <Text style={S.emptyBody}>Tap + to add a task, meeting, or deadline.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            colors={C}
            onToggle={item.type === 'task' ? () => handleToggle(item) : undefined}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      <AddModal visible={showModal} onClose={() => setShowModal(false)} onSaved={load} colors={C} />
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
    title: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    subtitle: { color: C.textMid, fontSize: 12, marginTop: 1 },
    addBtn: {
      width: 42, height: 42, borderRadius: 21, backgroundColor: '#6B4EFF',
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#6B4EFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 6,
    },
    filtersRow: { flexDirection: 'row', paddingHorizontal: 16 },
    filterWidget: {
      width: HALF,
      borderRadius: 24,
      padding: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
      position: 'relative',
    },
    filterLabelLight: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: 4,
    },
    filterCountLight: {
      color: '#fff',
      fontSize: 36,
      fontWeight: '800',
      letterSpacing: -1,
    },
    filterLabelDark: {
      color: 'rgba(0,0,0,0.5)',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: 4,
    },
    filterCountDark: {
      color: C.dark,
      fontSize: 36,
      fontWeight: '800',
      letterSpacing: -1,
    },
    activeIndicator: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    empty: { alignItems: 'center', marginTop: 32, gap: 10, paddingHorizontal: 32 },
    emptyIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: C.text },
    emptyBody: { color: C.textMid, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  });
}
