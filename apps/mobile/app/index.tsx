import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setProjects(data ?? []));
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.feedBtn}
        onPress={() => router.push('/feed')}
      >
        <Text style={styles.feedBtnText}>AI Curated Feed</Text>
      </TouchableOpacity>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/project/${item.id}`)}
          >
            <View style={styles.tags}>
              <Text style={styles.tag}>{item.category}</Text>
              <Text style={styles.tag}>{item.language}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No projects yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  tag: {
    fontSize: 12,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  desc: { fontSize: 14, color: '#666' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  feedBtn: { margin: 16, padding: 12, backgroundColor: '#5c7cfa', borderRadius: 10, alignItems: 'center' },
  feedBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
