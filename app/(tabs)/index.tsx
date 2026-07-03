import { useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { Animated, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAuthStore } from '@/stores/authStore';
import { getHomeQuickActions } from '@/utils/roles';

function FadeInView({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
    Animated.timing(translateY, {
      toValue: 0,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

/**
 * Tela Início — Dashboard com acesso rápido baseado no role do usuário.
 */
export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const firstName = user?.nome?.split(' ')[0] ?? 'Usuário';
  const role = user?.tipo || 'cidadao';
  const quickActions = getHomeQuickActions(role);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack flex={1} padding="$5" gap="$6">
          {/* Header */}
          <FadeInView delay={0}>
            <YStack gap="$2" paddingTop="$4">
              <Text fontSize={28} fontWeight="800" color="#1e293b">
                Olá, {firstName}!
              </Text>
              <Text fontSize="$4" color="#64748b" lineHeight={22}>
                Bem-vindo ao Conecta Sorriso.{'\n'}
                Reporte problemas urbanos e acompanhe suas solicitações.
              </Text>
            </YStack>
          </FadeInView>

          {/* Quick Actions — dinâmico por role */}
          <FadeInView delay={200}>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="700" color="#1e293b">
                Acesso rápido
              </Text>

              <XStack gap="$3">
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.title}
                    style={{ flex: 1 }}
                    onPress={() => router.push(action.route as any)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={action.title}
                  >
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: action.bgColor,
                        borderRadius: 16,
                        padding: 16,
                        alignItems: 'center',
                        gap: 12,
                        borderWidth: 1,
                        borderColor: action.iconBgColor + '30',
                      }}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: action.iconBgColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Feather name={action.icon as any} size={24} color="#ffffff" />
                      </View>
                      <Text
                        fontSize="$4"
                        fontWeight="600"
                        color={action.textColor}
                        textAlign="center"
                      >
                        {action.title}
                      </Text>
                      <Text fontSize="$2" color="#64748b" textAlign="center">
                        {action.subtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </XStack>
            </YStack>
          </FadeInView>

          {/* Como funciona — apenas para cidadão */}
          {role === 'cidadao' && (
            <FadeInView delay={400}>
              <YStack gap="$3">
                <Text fontSize="$5" fontWeight="700" color="#1e293b">
                  Como funciona
                </Text>

                <YStack
                  backgroundColor="#ffffff"
                  borderRadius="$4"
                  padding="$4"
                  gap="$4"
                  borderWidth={1}
                  borderColor="#e2e8f0"
                  elevation={2}
                >
                  <XStack gap="$3" alignItems="center">
                    <YStack
                      width={40}
                      height={40}
                      borderRadius={20}
                      backgroundColor="#dbeafe"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Feather name="map-pin" size={18} color="#1e40af" />
                    </YStack>
                    <YStack flex={1}>
                      <Text fontSize="$3" fontWeight="600" color="#1e293b">
                        Identifique o problema
                      </Text>
                      <Text fontSize="$2" color="#64748b">
                        Selecione o setor e descreva o problema
                      </Text>
                    </YStack>
                  </XStack>

                  <XStack gap="$3" alignItems="center">
                    <YStack
                      width={40}
                      height={40}
                      borderRadius={20}
                      backgroundColor="#dcfce7"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Feather name="camera" size={18} color="#166534" />
                    </YStack>
                    <YStack flex={1}>
                      <Text fontSize="$3" fontWeight="600" color="#1e293b">
                        Registre com fotos
                      </Text>
                      <Text fontSize="$2" color="#64748b">
                        Tire fotos para comprovar o problema
                      </Text>
                    </YStack>
                  </XStack>

                  <XStack gap="$3" alignItems="center">
                    <YStack
                      width={40}
                      height={40}
                      borderRadius={20}
                      backgroundColor="#fef3c7"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Feather name="bell" size={18} color="#92400e" />
                    </YStack>
                    <YStack flex={1}>
                      <Text fontSize="$3" fontWeight="600" color="#1e293b">
                        Acompanhe o status
                      </Text>
                      <Text fontSize="$2" color="#64748b">
                        Veja o andamento da sua solicitação
                      </Text>
                    </YStack>
                  </XStack>
                </YStack>
              </YStack>
            </FadeInView>
          )}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
