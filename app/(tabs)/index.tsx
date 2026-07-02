import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Button, Card, ScrollView } from 'tamagui';

import { useAuthStore } from '@/stores/authStore';

/**
 * Tela Início (Home/Dashboard).
 *
 * Exibe boas-vindas ao usuário autenticado com acesso rápido
 * às funcionalidades principais do app.
 */
export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const firstName = user?.nome?.split(' ')[0] ?? 'Usuário';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView flex={1}>
        <YStack flex={1} padding="$4" gap="$5">
          {/* Boas-vindas */}
          <YStack gap="$2" paddingTop="$4">
            <Text fontSize="$8" fontWeight="700" color="$blue10">
              Olá, {firstName}!
            </Text>
            <Text fontSize="$4" color="$gray10" lineHeight="$4">
              Bem-vindo ao Conecta Boa Esperança. Utilize o app para reportar
              problemas urbanos e acompanhar suas solicitações.
            </Text>
          </YStack>

          {/* Ações rápidas */}
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600" color="$gray12">
              Acesso rápido
            </Text>

            <XStack gap="$3" flexWrap="wrap">
              {/* Card Nova Solicitação */}
              <Card
                flex={1}
                minWidth={140}
                bordered
                elevate
                size="$4"
                backgroundColor="$blue2"
                pressStyle={{ scale: 0.97, opacity: 0.9 }}
                onPress={() => router.push('/(tabs)/nova-solicitacao')}
                accessibilityLabel="Nova Solicitação"
                accessibilityRole="button"
              >
                <Card.Header padded>
                  <YStack gap="$2" alignItems="center">
                    <Text fontSize={32}>📝</Text>
                    <Text
                      fontSize="$4"
                      fontWeight="600"
                      color="$blue10"
                      textAlign="center"
                    >
                      Nova Solicitação
                    </Text>
                    <Text
                      fontSize="$2"
                      color="$gray10"
                      textAlign="center"
                    >
                      Reportar um problema
                    </Text>
                  </YStack>
                </Card.Header>
              </Card>

              {/* Card Minhas Solicitações */}
              <Card
                flex={1}
                minWidth={140}
                bordered
                elevate
                size="$4"
                backgroundColor="$green2"
                pressStyle={{ scale: 0.97, opacity: 0.9 }}
                onPress={() => router.push('/(tabs)/minhas-solicitacoes')}
                accessibilityLabel="Minhas Solicitações"
                accessibilityRole="button"
              >
                <Card.Header padded>
                  <YStack gap="$2" alignItems="center">
                    <Text fontSize={32}>📋</Text>
                    <Text
                      fontSize="$4"
                      fontWeight="600"
                      color="$green10"
                      textAlign="center"
                    >
                      Minhas Solicitações
                    </Text>
                    <Text
                      fontSize="$2"
                      color="$gray10"
                      textAlign="center"
                    >
                      Acompanhar status
                    </Text>
                  </YStack>
                </Card.Header>
              </Card>
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
