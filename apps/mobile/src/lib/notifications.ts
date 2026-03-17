import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiFetch } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[Notifications] Not a physical device, skipping registration');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Register with API (may 404 if endpoint not built yet)
  try {
    await apiFetch('/notifications/register-device', {
      method: 'POST',
      body: JSON.stringify({
        expo_push_token: token,
        device_type: Platform.OS as 'ios' | 'android',
      }),
    });
  } catch (err) {
    console.warn('[Notifications] Failed to register token with API (endpoint may not exist yet):', err);
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token;
}
