import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { BasicScreen, Card } from '@/components/Screen';
import { B } from '@/constants/basic';
import { listAuditLogs } from '@/lib/audit';

export default function ExecutionMonitorScreen() {
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof listAuditLogs>>>([]);
  useEffect(() => { listAuditLogs(30).then(setLogs); }, []);
  return (
    <BasicScreen title="Execution Monitor">
      {logs.map((l) => (
        <Card key={l.id}>
          <Text style={{ color: B.accent, fontSize: 10 }}>{l.agent}</Text>
          <Text style={{ color: B.text }}>{l.action}</Text>
          <Text style={{ color: B.dim, fontSize: 12 }}>{l.result}</Text>
        </Card>
      ))}
    </BasicScreen>
  );
}
