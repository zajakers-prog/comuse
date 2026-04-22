import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function BranchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [branch, setBranch] = useState<any>(null);

  useEffect(() => {
    supabase
      .from('branches')
      .select('*, users!branches_author_id_fkey(display_name)')
      .eq('id', id)
      .single()
      .then(({ data }) => setBranch(data));
  }, [id]);

  if (!branch) return <View style={styles.container}><Text>Loading...</Text></View>;

  const content = branch.content as { text?: string } | null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{branch.title}</Text>
      <Text style={styles.meta}>
        {branch.users?.display_name} · {branch.completion_percent}% complete
      </Text>
      <Text style={styles.content}>
        {content?.text || 'No content yet.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  meta: { fontSize: 14, color: '#666', marginBottom: 16 },
  content: { fontSize: 16, lineHeight: 24 },
});
