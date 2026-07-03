import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

interface PageLoadingProps {
  message?: string;
}

/**
 * Componente de carregamento de página — centralizado, limpo e profissional.
 * Exibe um spinner azul com mensagem opcional.
 */
export function PageLoading({ message = 'Carregando...' }: PageLoadingProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  text: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
});
