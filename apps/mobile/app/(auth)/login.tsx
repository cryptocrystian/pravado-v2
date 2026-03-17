import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { colors } from '../../src/constants/colors';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const redirectUrl = makeRedirectUri({ scheme: 'pravado', path: 'auth/callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success' && result.url) {
          const params = new URL(result.url);
          const accessToken = params.searchParams.get('access_token') || params.hash?.match(/access_token=([^&]*)/)?.[1];
          const refreshToken = params.searchParams.get('refresh_token') || params.hash?.match(/refresh_token=([^&]*)/)?.[1];
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          }
        }
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Enter your email'); return; }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: makeRedirectUri({ scheme: 'pravado', path: 'auth/callback' }) },
      });
      if (error) throw error;
      setMagicLinkSent(true);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <Text style={s.logo}>PRAVADO</Text>
        <Text style={s.subtitle}>AI-Powered Visibility</Text>

        {magicLinkSent ? (
          <View style={s.card}>
            <Text style={s.successTitle}>Check your email</Text>
            <Text style={s.successText}>We sent a magic link to {email}</Text>
            <TouchableOpacity onPress={() => setMagicLinkSent(false)} style={s.linkBtn}>
              <Text style={s.linkText}>Try a different email</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.card}>
            <TouchableOpacity style={s.googleBtn} onPress={handleGoogleLogin} disabled={loading}>
              <Text style={s.googleText}>{loading ? 'Signing in...' : 'Continue with Google'}</Text>
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            <TextInput
              style={s.input}
              placeholder="Work email"
              placeholderTextColor={colors.textDim}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={s.magicBtn} onPress={handleMagicLink} disabled={loading}>
              <Text style={s.magicText}>Send Magic Link</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={s.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { fontSize: 32, fontWeight: '800', letterSpacing: 4, color: colors.electricPurple, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 48 },
  card: { width: '100%', maxWidth: 360, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 24 },
  googleBtn: { backgroundColor: colors.electricPurple, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  googleText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: colors.textDim },
  input: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, marginBottom: 12 },
  magicBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  magicText: { color: colors.cyberBlue, fontSize: 15, fontWeight: '600' },
  successTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  successText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  linkBtn: { alignItems: 'center' },
  linkText: { color: colors.cyberBlue, fontSize: 14 },
  terms: { fontSize: 11, color: colors.textDim, textAlign: 'center', marginTop: 32, paddingHorizontal: 20 },
});
