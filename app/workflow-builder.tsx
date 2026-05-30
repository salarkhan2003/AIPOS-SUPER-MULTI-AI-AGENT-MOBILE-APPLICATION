import { useEffect, useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { BasicScreen, Card } from '@/components/Screen';
import { B } from '@/constants/basic';
import { watchdogs } from '@/lib/watchdogs';

export default function WorkflowsScreen() {
  const [list, setList] = useState<Awaited<ReturnType<typeof watchdogs.list>>>([]);

  useEffect(() => { watchdogs.list().then(setList); }, []);

  return (
    <BasicScreen title="Workflows / Watchdogs">
      <Pressable
        style={s.btn}
        onPress={async () => {
          await watchdogs.register('irctc_delay', { train: '12712' }, 'notify + suggest_cab');
          setList(await watchdogs.list());
        }}>
        <Text style={s.btnTxt}>Add train 12712 delay watchdog</Text>
      </Pressable>
      {list.map((w) => (
        <Card key={w.id}>
          <Text style={s.t}>{w.trigger}</Text>
          <Text style={s.d}>{w.action}</Text>
        </Card>
      ))}
    </BasicScreen>
  );
}

const s = StyleSheet.create({
  btn: { backgroundColor: B.accent, padding: 14, borderRadius: B.radius, marginBottom: 12 },
  btnTxt: { color: B.bg, fontWeight: '700', textAlign: 'center' },
  t: { color: B.text, fontWeight: '600' },
  d: { color: B.dim, fontSize: 12 },
});
