import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface Props { icon: string; title: string; subtitle: string; actionLabel?: string; onAction?: () => void; }

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={s.container}>
      <Ionicons name={icon as any} size={32} color={colors.textDim} />
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={s.btn} onPress={onAction}>
          <Text style={s.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', padding: 32 },
  title: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginTop: 12 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  btn: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.electricPurple, borderRadius: 8 },
  btnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
});
