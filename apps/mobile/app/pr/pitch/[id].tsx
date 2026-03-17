import { useLocalSearchParams } from 'expo-router';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { colors } from '../../../src/constants/colors';
import { EmptyState } from '../../../src/components/EmptyState';

export default function PitchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <EmptyState
        icon="mail"
        title="Pitch Detail"
        subtitle={`Viewing pitch ${id}`}
        actionLabel="Open in Pravado"
        onAction={() => Linking.openURL(`https://app.pravado.io/app/pr/pitches/${id}`)}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
});
