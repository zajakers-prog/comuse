import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { BranchTreeMobile } from '../../components/branch-tree-mobile';

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  useEffect(() => {
    supabase.from('projects').select('*').eq('id', id).single()
      .then(({ data }) => setProject(data));

    supabase.from('branches').select('*, users!branches_author_id_fkey(display_name)')
      .eq('project_id', id!)
      .order('created_at', { ascending: true })
      .then(({ data }) => setBranches(data ?? []));
  }, [id]);

  if (!project) return <View style={styles.center}><Text>Loading...</Text></View>;

  const treeBranches = branches.map((b: any) => ({
    id: b.id,
    title: b.title,
    author_name: b.users?.display_name ?? 'Unknown',
    completion_percent: b.completion_percent,
    parent_branch_id: b.parent_branch_id,
  }));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tags}>
          <Text style={styles.tag}>{project.category}</Text>
          <Text style={styles.tag}>{project.license_type}</Text>
        </View>
        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.desc}>{project.description}</Text>
      </View>

      {/* View toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'tree' && styles.toggleActive]}
          onPress={() => setViewMode('tree')}
        >
          <Text style={viewMode === 'tree' ? styles.toggleTextActive : styles.toggleText}>Tree</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'list' && styles.toggleActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={viewMode === 'list' ? styles.toggleTextActive : styles.toggleText}>List</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'tree' ? (
        <BranchTreeMobile branches={treeBranches} />
      ) : (
        branches.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            style={styles.branch}
            onPress={() => router.push(`/branch/${item.id}`)}
          >
            <Text style={styles.branchTitle}>{item.title}</Text>
            <Text style={styles.branchMeta}>
              {item.users?.display_name} · {item.completion_percent}%
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tag: { fontSize: 12, backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, overflow: 'hidden' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  desc: { fontSize: 14, color: '#666' },
  toggleRow: { flexDirection: 'row', padding: 12, gap: 8 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  toggleActive: { backgroundColor: '#5c7cfa', borderColor: '#5c7cfa' },
  toggleText: { fontSize: 13, color: '#666' },
  toggleTextActive: { fontSize: 13, color: '#fff', fontWeight: '600' },
  branch: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  branchTitle: { fontSize: 16, fontWeight: '500' },
  branchMeta: { fontSize: 12, color: '#999', marginTop: 4 },
});
