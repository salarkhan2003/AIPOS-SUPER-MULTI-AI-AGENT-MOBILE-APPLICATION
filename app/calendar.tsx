import { Icon } from '@/components/Icon';
import { scheduleLocalIn } from '@/lib/notifications-local';
import { calendarStorage, type CalEventStored } from '@/lib/storage';
import { useTheme } from '@/lib/themeContext';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const SCREEN_W = Dimensions.get('window').width;
const CAL_CELL = Math.floor((SCREEN_W - 32 - 28) / 7);
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function dayKeyFromDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayKeyForOffset(base: Date, dayIndex: number, todayIdx: number): string {
  const d = new Date(base);
  d.setDate(base.getDate() - todayIdx + dayIndex);
  return d.toISOString().slice(0, 10);
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const now = new Date();
  const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const [selectedDay, setSelectedDay] = useState(todayIdx);
  const [events, setEvents] = useState<CalEventStored[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [time, setTime] = useState('09:00');
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const selectedKey = dayKeyForOffset(now, selectedDay, todayIdx);
  const monthStr = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const eventDays = useMemo(() => new Set(events.map((e) => e.dayKey)), [events]);

  const monthGrid = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    const startPad = (first.getDay() + 6) % 7;
    const cells: { key: string; day: number; inMonth: boolean }[] = [];
    for (let i = 0; i < startPad; i++) cells.push({ key: `pad-${i}`, day: 0, inMonth: false });
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(viewYear, viewMonth, d);
      cells.push({ key: dayKeyFromDate(date), day: d, inMonth: true });
    }
    return cells;
  }, [viewMonth, viewYear]);
  const styles = makeStyles(C);

  const palette = [C.violet, C.coral, C.mint, C.orange, C.blue];

  const loadEvents = useCallback(async () => {
    let all = await calendarStorage.list();
    if (all.length === 0) {
      const todayKey = dayKeyForOffset(now, todayIdx, todayIdx);
      const seeds: Omit<CalEventStored, 'id'>[] = [
        { dayKey: todayKey, time: '09:00', title: 'Team standup', desc: 'Daily sync', color: C.violet, duration: '30 min' },
        { dayKey: todayKey, time: '14:00', title: 'IRCTC booking', desc: 'Train 12712', color: C.mint, duration: '15 min' },
        { dayKey: todayKey, time: '17:00', title: 'Call Mom', desc: 'Weekly family call', color: C.orange, duration: '30 min' },
      ];
      for (const s of seeds) await calendarStorage.add(s);
      all = await calendarStorage.list();
    }
    setEvents(all);
  }, [C.coral, C.mint, C.orange, C.violet, now, todayIdx]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const dayEvents = events
    .filter((e) => e.dayKey === selectedKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  const upcoming = events
    .filter((e) => e.dayKey > selectedKey)
    .sort((a, b) => (a.dayKey + a.time).localeCompare(b.dayKey + b.time))
    .slice(0, 6);

  const setReminder = async (ev: CalEventStored) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await scheduleLocalIn(5, `Reminder: ${ev.title}`, ev.desc, 'task');
    Alert.alert('Reminder set', `You'll be reminded about "${ev.title}" in 5 seconds.`);
  };

  const addEvent = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Enter an event title.');
      return;
    }
    const color = palette[Math.floor(Math.random() * palette.length)];
    await calendarStorage.add({
      dayKey: selectedKey,
      time: time.trim() || '09:00',
      title: title.trim(),
      desc: desc.trim() || 'Added from Ghost Calendar',
      color,
      duration: '30 min',
    });
    setTitle('');
    setDesc('');
    setTime('09:00');
    setShowAdd(false);
    await loadEvents();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Icon name="back" size={20} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Calendar</Text>
            <Text style={styles.subtitle}>{monthStr}</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => setShowAdd((v) => !v)}>
            <Icon name={showAdd ? 'close' : 'forward'} size={16} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.weekCard}>
          {DAYS.map((d, i) => {
            const date = new Date(now);
            date.setDate(now.getDate() - todayIdx + i);
            const active = i === selectedDay;
            const isToday = i === todayIdx;
            return (
              <Pressable
                key={d + i}
                style={[styles.dayCol, active && styles.dayColActive]}
                onPress={() => setSelectedDay(i)}>
                <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{d}</Text>
                <Text style={[styles.dayNum, active && styles.dayNumActive]}>{date.getDate()}</Text>
                {isToday && !active ? <View style={styles.todayDot} /> : null}
              </Pressable>
            );
          })}
        </View>

        {showAdd ? (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>New event · {selectedKey}</Text>
            <TextInput style={styles.input} placeholder="Title" placeholderTextColor={C.textLight} value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Time (HH:mm)" placeholderTextColor={C.textLight} value={time} onChangeText={setTime} />
            <TextInput style={styles.input} placeholder="Description" placeholderTextColor={C.textLight} value={desc} onChangeText={setDesc} />
            <Pressable style={styles.saveBtn} onPress={addEvent}>
              <Text style={styles.saveBtnText}>Save event</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>
          {selectedDay === todayIdx ? "TODAY'S SCHEDULE" : `${DAYS[selectedDay].toUpperCase()} · ${selectedKey}`}
        </Text>

        {dayEvents.length > 0 ? (
          dayEvents.map((ev) => (
            <Pressable key={ev.id} style={styles.eventCard} onPress={() => setReminder(ev)}>
              <View style={[styles.eventTime, { backgroundColor: ev.color + '22' }]}>
                <Text style={[styles.eventTimeText, { color: ev.color }]}>{ev.time}</Text>
                <Text style={[styles.eventDuration, { color: ev.color }]}>{ev.duration}</Text>
              </View>
              <View style={[styles.eventBar, { backgroundColor: ev.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{ev.title}</Text>
                <Text style={styles.eventDesc}>{ev.desc}</Text>
              </View>
              <Pressable
                onPress={async () => {
                  await calendarStorage.remove(ev.id);
                  await loadEvents();
                }}
                hitSlop={8}>
                <Icon name="close" size={14} color={C.textLight} />
              </Pressable>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyDay}>
            <Icon name="calendar" size={28} color={C.textLight} />
            <Text style={styles.emptyDayText}>No events — tap + to add one</Text>
          </View>
        )}

        {upcoming.length > 0 ? (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>UPCOMING</Text>
            {upcoming.map((item) => (
              <View key={item.id} style={styles.upcomingRow}>
                <View style={[styles.upcomingDot, { backgroundColor: item.color }]} />
                <Text style={styles.upcomingDay}>{item.dayKey}</Text>
                <Text style={styles.upcomingTitle}>{item.title}</Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>FULL CALENDAR · {MONTH_NAMES[viewMonth]} {viewYear}</Text>
        <View style={styles.fullCalCard}>
          <View style={styles.monthNav}>
            <Pressable
              onPress={() => {
                if (viewMonth === 0) {
                  setViewMonth(11);
                  setViewYear((y) => y - 1);
                } else setViewMonth((m) => m - 1);
              }}>
              <Text style={styles.monthNavBtn}>‹</Text>
            </Pressable>
            <Text style={styles.monthNavTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <Pressable
              onPress={() => {
                if (viewMonth === 11) {
                  setViewMonth(0);
                  setViewYear((y) => y + 1);
                } else setViewMonth((m) => m + 1);
              }}>
              <Text style={styles.monthNavBtn}>›</Text>
            </Pressable>
          </View>
          <View style={styles.calWeekHead}>
            {DAYS.map((d) => (
              <Text key={d} style={styles.calWeekHeadText}>{d}</Text>
            ))}
          </View>
          <View style={styles.calGrid}>
            {monthGrid.map((cell) => {
              if (!cell.inMonth) {
                return <View key={cell.key} style={styles.calCellEmpty} />;
              }
              const hasEv = eventDays.has(cell.key);
              const isSel = cell.key === selectedKey;
              const isTod = cell.key === dayKeyFromDate(now);
              return (
                <Pressable
                  key={cell.key}
                  style={[styles.calCell, isSel && styles.calCellSel, isTod && !isSel && styles.calCellToday]}
                  onPress={() => {
                    const d = new Date(cell.key);
                    const monIdx = (d.getDay() + 6) % 7;
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - todayIdx);
                    const cellWeekIdx = Math.round((d.getTime() - weekStart.getTime()) / 86400000);
                    if (cellWeekIdx >= 0 && cellWeekIdx < 7) setSelectedDay(cellWeekIdx);
                    else setSelectedDay(monIdx);
                  }}>
                  <Text style={[styles.calCellNum, isSel && styles.calCellNumSel]}>{cell.day}</Text>
                  {hasEv ? <View style={[styles.calDot, { backgroundColor: isSel ? '#fff' : C.violet }]} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable style={styles.connectCard} onPress={() => router.push('/integrations')}>
          <View style={styles.connectIcon}>
            <Icon name="calendar" size={20} color={C.violet} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.connectTitle}>Connect Google Calendar</Text>
            <Text style={styles.connectSub}>Optional sync — local events work offline</Text>
          </View>
          <Icon name="forward" size={16} color={C.violet} />
        </Pressable>

      </ScrollView>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    title: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    subtitle: { color: C.textMid, fontSize: 13 },
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.violet, alignItems: 'center', justifyContent: 'center' },
    weekCard: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 20, padding: 10, marginBottom: 16, elevation: 2 },
    dayCol: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 14 },
    dayColActive: { backgroundColor: C.violet },
    dayLabel: { fontSize: 10, fontWeight: '700', color: C.textLight, marginBottom: 4 },
    dayLabelActive: { color: 'rgba(255,255,255,0.75)' },
    dayNum: { fontSize: 15, fontWeight: '800', color: C.text },
    dayNumActive: { color: '#fff' },
    todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.coral, marginTop: 3 },
    addCard: { marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 18, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.border },
    addTitle: { color: C.text, fontWeight: '700', marginBottom: 10 },
    input: { backgroundColor: C.bg, borderRadius: 12, padding: 12, color: C.text, marginBottom: 8, borderWidth: 1, borderColor: C.border },
    saveBtn: { backgroundColor: C.violet, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '700' },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: C.textLight, letterSpacing: 1.2, marginBottom: 10, paddingHorizontal: 16 },
    eventCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 18, padding: 14, marginBottom: 10, elevation: 2 },
    eventTime: { width: 56, borderRadius: 12, padding: 8, alignItems: 'center' },
    eventTimeText: { fontSize: 13, fontWeight: '800' },
    eventDuration: { fontSize: 9, fontWeight: '600', marginTop: 2 },
    eventBar: { width: 3, height: 40, borderRadius: 2 },
    eventTitle: { color: C.text, fontWeight: '700', fontSize: 15 },
    eventDesc: { color: C.textMid, fontSize: 12, marginTop: 2 },
    emptyDay: { alignItems: 'center', paddingVertical: 32, gap: 8 },
    emptyDayText: { color: C.textLight, fontSize: 14 },
    upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 8 },
    upcomingDot: { width: 8, height: 8, borderRadius: 4 },
    upcomingDay: { color: C.textMid, fontSize: 11, fontWeight: '700', width: 88 },
    upcomingTitle: { color: C.text, fontWeight: '600', fontSize: 14, flex: 1 },
    connectCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginTop: 8, backgroundColor: C.violet + '14', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.violet + '30' },
    connectIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.violet + '22', alignItems: 'center', justifyContent: 'center' },
    connectTitle: { color: C.violet, fontWeight: '700', fontSize: 15 },
    connectSub: { color: C.textMid, fontSize: 12, marginTop: 2 },
    fullCalCard: {
      marginHorizontal: 16,
      backgroundColor: C.surface,
      borderRadius: 20,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: C.border,
      elevation: 3,
    },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    monthNavBtn: { fontSize: 28, fontWeight: '300', color: C.violet, paddingHorizontal: 12 },
    monthNavTitle: { fontSize: 16, fontWeight: '800', color: C.text },
    calWeekHead: { flexDirection: 'row', marginBottom: 6 },
    calWeekHeadText: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: C.textLight },
    calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calCell: {
      width: CAL_CELL,
      height: CAL_CELL,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      marginBottom: 4,
    },
    calCellEmpty: { width: CAL_CELL, height: CAL_CELL, marginBottom: 4 },
    calCellSel: { backgroundColor: C.violet },
    calCellToday: { borderWidth: 2, borderColor: C.coral },
    calCellNum: { fontSize: 14, fontWeight: '700', color: C.text },
    calCellNumSel: { color: '#fff' },
    calDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  });
}
