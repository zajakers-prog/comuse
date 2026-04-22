import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

interface Branch {
  id: string;
  title: string;
  author_name: string;
  completion_percent: number;
  parent_branch_id: string | null;
}

interface Props {
  branches: Branch[];
}

function BranchNode({ branch, children, depth, onPress }: {
  branch: Branch;
  children: Branch[];
  depth: number;
  onPress: (id: string) => void;
}) {
  const childBranches = children.filter((b) => b.parent_branch_id === branch.id);

  return (
    <View style={{ marginLeft: depth * 16 }}>
      <TouchableOpacity
        style={styles.node}
        onPress={() => onPress(branch.id)}
      >
        {depth > 0 && <View style={styles.connector} />}
        <View style={styles.nodeContent}>
          <Text style={styles.nodeTitle} numberOfLines={1}>{branch.title}</Text>
          <Text style={styles.nodeMeta}>{branch.author_name}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${branch.completion_percent}%` }]} />
          </View>
        </View>
      </TouchableOpacity>
      {childBranches.map((child) => (
        <BranchNode
          key={child.id}
          branch={child}
          children={children}
          depth={depth + 1}
          onPress={onPress}
        />
      ))}
    </View>
  );
}

export function BranchTreeMobile({ branches }: Props) {
  const router = useRouter();
  const roots = branches.filter((b) => !b.parent_branch_id);

  const handlePress = (id: string) => {
    router.push(`/branch/${id}`);
  };

  if (branches.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No branches yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal style={styles.container}>
      <View style={styles.tree}>
        {roots.map((root) => (
          <BranchNode
            key={root.id}
            branch={root}
            children={branches}
            depth={0}
            onPress={handlePress}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 12 },
  tree: { paddingHorizontal: 16, paddingVertical: 8 },
  node: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  connector: {
    width: 12, height: 1, backgroundColor: '#ddd', marginRight: 4,
  },
  nodeContent: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 10,
    minWidth: 160,
  },
  nodeTitle: { fontSize: 14, fontWeight: '600' },
  nodeMeta: { fontSize: 11, color: '#999', marginTop: 2 },
  progressTrack: {
    height: 4, backgroundColor: '#f0f0f0', borderRadius: 2, marginTop: 6,
  },
  progressFill: {
    height: 4, backgroundColor: '#5c7cfa', borderRadius: 2,
  },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#999' },
});
