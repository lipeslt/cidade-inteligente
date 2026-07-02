import { Stack } from 'expo-router';

/**
 * Layout de stack para a seção "Minhas Solicitações".
 * Permite navegação entre a lista (index) e o detalhe ([id]).
 */
export default function MinhasSolicitacoesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
