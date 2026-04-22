import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { registerForPushNotifications, subscribeToNotifications } from '../lib/notifications';

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const unsub = subscribeToNotifications(user.id);
        return unsub;
      }
    });
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Comuse' }} />
        <Stack.Screen name="feed" options={{ title: 'AI Feed' }} />
        <Stack.Screen name="login" options={{ title: 'Sign In', headerShown: false }} />
        <Stack.Screen name="project/[id]" options={{ title: 'Project' }} />
        <Stack.Screen name="branch/[id]" options={{ title: 'Branch' }} />
      </Stack>
    </>
  );
}
