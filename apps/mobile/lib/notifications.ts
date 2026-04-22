import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export function subscribeToNotifications(userId: string) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        const n = payload.new as any;
        const typeLabels: Record<string, string> = {
          branch_added: 'New branch added to your project!',
          comment: 'New comment on your work',
          promotion: 'Your promotion is active!',
          contribution: 'Contribution update',
          report_resolved: 'Your report has been resolved',
        };

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Comuse',
            body: typeLabels[n.type] ?? 'You have a new notification',
          },
          trigger: null,
        });
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
