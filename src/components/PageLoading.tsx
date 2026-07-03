import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface PageLoadingProps {
  message?: string;
  icon?: keyof typeof Feather.glyphMap;
}

/**
 * Componente de carregamento de página — centralizado, limpo e profissional.
 * Exibe um spinner dentro de um container circular com mensagem abaixo.
 */
export function PageLoading({ message = 'Carregando...', icon }: PageLoadingProps) {
  return (
    <View style={styles.container}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
      <Text style={styles.message}>{message}</Text>
      {icon && (
        <View style={styles.iconHint}>
          <Feather name={icon} size={16} color="#94a3b8" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    gap: 16,
    padding: 32,
  },
  spinnerContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  message: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  iconHint: {
    marginTop: 4,
  },
});
