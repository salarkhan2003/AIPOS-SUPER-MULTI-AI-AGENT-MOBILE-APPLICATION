import { Text } from 'react-native';
import { BasicScreen, Card } from '@/components/Screen';
import { B } from '@/constants/basic';

/** Visual mock only per spec */
export default function KnowledgeGraphScreen() {
  return (
    <BasicScreen title="Knowledge Graph">
      <Card><Text style={{ color: B.dim }}>Mock graph visualization — data from memory.search relations (Section 2).</Text></Card>
    </BasicScreen>
  );
}
