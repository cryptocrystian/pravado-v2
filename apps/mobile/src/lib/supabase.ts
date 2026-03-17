import 'react-native-url-polyfill/dist/setup';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = 'https://kroexsdyyqmlxfpbwajv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtyb2V4c2R5eXFtbHhmcGJ3YWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzIxNjEsImV4cCI6MjA3ODcwODE2MX0.nGkVwgMTjujQeD7Bg1zHEXAAhoDTUOdF-PLc7IKuGb4';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
