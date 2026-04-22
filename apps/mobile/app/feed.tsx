import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

interface FeedItem {
  id: string;
  branch_id: string;
  branch_title: string;
  project_title: string;
  project_id: string;
  commercial_score: number;
  artistic_score: number;
  summary: string;
}

export default function FeedScreen() {
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ai_evaluations')
        .select('*, branches(id, title, project_id, projects(title))')
        .order('evaluated_at', { ascending: false })
        .limit(30);

      const feed = (data ?? []).map((e: any) => ({
        id: e.id,
        branch_id: e.branches?.id,
        branch_title: e.branches?.title ?? '',
        project_title: e.branches?.projects?.title ?? '',
        project_id: e.branches?.project_id,
        commercial_score: e.commercial_score ?? 0,
        artistic_score: e.artistic_score ?? 0,
        summary: e.summary_10lines ?? '',
      }));

      setItems(feed);
      setLoading(false);
    }
    load();
  }, []);

  const ScoreBar = ({ label, score }: { label: string; score: number }) => (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreTrack}>
        <View style={[styles.scoreFill, { width: `${score}%` }]} />
      </View>
      <Text style={styles.scoreValue}>{score}</Text>
    </View>
  );

  if (loading) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      style={styles.container}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/branch/${item.branch_id}`)}
        >
          <Text style={styles.projectTitle}>{item.project_title}</Text>
          <Text style={styles.branchTitle}>{item.branch_title}</Text>
          <ScoreBar label="Commercial" score={item.commercial_score} />
          <ScoreBar label="Artistic" score={item.artistic_score} />
          <Text style={styles.summary} numberOfLines={4}>
            {item.summary}
          </Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No AI evaluations yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  projectTitle: { fontSize: 12, color: '#999', marginBottom: 2 },
  branchTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  scoreLabel: { fontSize: 12, color: '#666', width: 80 },
  scoreTrack: { flex: 1, height: 6, backgroundColor: '#f0f0f0', borderRadius: 3 },
  scoreFill: { height: 6, backgroundColor: '#5c7cfa', borderRadius: 3 },
  scoreValue: { fontSize: 12, fontWeight: '600', width: 30, textAlign: 'right' },
  summary: { fontSize: 14, color: '#444', marginTop: 8, lineHeight: 20 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});
