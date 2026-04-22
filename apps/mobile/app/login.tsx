import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();

  const handleOAuth = async (provider: 'google' | 'apple') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'comuse://auth/callback',
      },
    });

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, 'comuse://auth/callback');
      if (result.type === 'success') {
        router.replace('/');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comuse</Text>
      <Text style={styles.subtitle}>Sign in to explore</Text>

      <TouchableOpacity style={styles.googleBtn} onPress={() => handleOAuth('google')}>
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.appleBtn} onPress={() => handleOAuth('apple')}>
        <Text style={styles.appleText}>Continue with Apple</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  googleBtn: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  googleText: { fontSize: 16, fontWeight: '500' },
  appleBtn: {
    width: '100%',
    padding: 16,
    backgroundColor: '#000',
    borderRadius: 12,
    alignItems: 'center',
  },
  appleText: { fontSize: 16, fontWeight: '500', color: '#fff' },
});
