import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { BasicScreen, Card } from '@/components/Screen';
import { B } from '@/constants/basic';
import { listAuditLogs } from '@/lib/audit';

export default function ActivityLogsScreen() {
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof listAuditLogs>>>([]);
  useEffect(() => { listAuditLogs(100).then(setLogs); }, []);
  return (
    <BasicScreen title="Audit Trail">
      {logs.map((l) => (
        <Card key={l.id}>
          <Text style={{ color: B.dim, fontSize: 11 }}>{new Date(l.timestamp).toLocaleString()}</Text>
          <Text style={{ color: B.text }}>{l.action} — {l.result}</Text>
        </Card>
      ))}
    </BasicScreen>
  );
}
