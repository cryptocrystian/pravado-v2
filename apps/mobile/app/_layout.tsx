import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../src/lib/supabase';
import { registerForPushNotifications } from '../src/lib/notifications';
import * as Notifications from 'expo-notifications';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) registerForPushNotifications().catch(() => {});
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, segments, loading, router]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { screen?: string; id?: string };
      if (data.screen === 'queue') router.push('/(tabs)/queue');
      else if (data.screen === 'content' && data.id) router.push(`/content/${data.id}`);
      else if (data.screen === 'analytics') router.push('/(tabs)/analytics');
    });
    return () => sub.remove();
  }, [router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0F' } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="content/[id]" options={{ presentation: 'modal', headerShown: true, headerStyle: { backgroundColor: '#13131A' }, headerTintColor: '#FFFFFF', title: 'Content Detail' }} />
        <Stack.Screen name="pr/pitch/[id]" options={{ presentation: 'modal', headerShown: true, headerStyle: { backgroundColor: '#13131A' }, headerTintColor: '#FFFFFF', title: 'Pitch Detail' }} />
      </Stack>
    </>
  );
}
