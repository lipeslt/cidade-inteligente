import { useState, useRef, useCallback, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Animated as RNAnimated } from 'react-native';
import { YStack, Text, Input, Button, Spinner } from 'tamagui';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useAuthStore } from '@/stores/authStore';
import { validateLoginForm } from '@/utils/validation';
import { AppError } from '@/utils/errors';

function FadeInView({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity = useRef(new RNAnimated.Value(0)).current;
  const translateY = useRef(new RNAnimated.Value(20)).current;

  useEffect(() => {
    RNAnimated.timing(opacity, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
    RNAnimated.timing(translateY, {
      toValue: 0,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <RNAnimated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </RNAnimated.View>
  );
}

const LOGIN_TIMEOUT_MS = 15000;

/**
 * Tela de Login — design profissional com gradiente visual,
 * ícone de cidade e campos estilizados.
 */
export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogin = useCallback(async () => {
    setErrorMessage(null);

    const validation = validateLoginForm(email, senha);
    if (!validation.valid) {
      setErrorMessage(validation.errors.join('. '));
      return;
    }

    setIsLoading(true);

    let timedOut = false;
    timeoutRef.current = setTimeout(() => {
      timedOut = true;
      setIsLoading(false);
      setErrorMessage('Falha na conexão. Verifique sua internet e tente novamente.');
    }, LOGIN_TIMEOUT_MS);

    try {
      await login(email.trim(), senha);
      if (timedOut) return;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsLoading(false);
      router.replace('/(tabs)');
    } catch (error) {
      if (timedOut) return;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsLoading(false);
      if (error instanceof AppError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
      }
    }
  }, [email, senha, login, router]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <YStack flex={1} justifyContent="center" padding="$6" gap="$5">
        {/* Logo / Brand */}
        <FadeInView delay={0}>
          <YStack alignItems="center" gap="$3" marginBottom="$6">
            <YStack
              width={80}
              height={80}
              borderRadius={40}
              backgroundColor="#1e40af"
              alignItems="center"
              justifyContent="center"
              elevation={4}
            >
              <Feather name="map-pin" size={36} color="#ffffff" />
            </YStack>
            <Text fontSize={24} fontWeight="800" color="#1e293b" textAlign="center">
              Conecta Boa Esperança
            </Text>
            <Text fontSize="$3" color="#64748b" textAlign="center">
              Faça login para continuar
            </Text>
          </YStack>
        </FadeInView>

        {/* Form */}
        <FadeInView delay={200}>
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="500" color="#374151">
                E-mail
              </Text>
              <Input
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                size="$5"
                borderWidth={1.5}
                borderColor="#e2e8f0"
                borderRadius="$4"
                backgroundColor="#f8fafc"
                focusStyle={{ borderColor: '#1e40af', backgroundColor: '#ffffff' }}
                accessibilityLabel="E-mail"
              />
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="500" color="#374151">
                Senha
              </Text>
              <Input
                placeholder="••••••••"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                editable={!isLoading}
                size="$5"
                borderWidth={1.5}
                borderColor="#e2e8f0"
                borderRadius="$4"
                backgroundColor="#f8fafc"
                focusStyle={{ borderColor: '#1e40af', backgroundColor: '#ffffff' }}
                accessibilityLabel="Senha"
              />
            </YStack>

            <Button
              onPress={handleLogin}
              disabled={isLoading}
              size="$5"
              backgroundColor="#1e40af"
              color="#ffffff"
              fontWeight="700"
              borderRadius="$4"
              marginTop="$3"
              pressStyle={{ backgroundColor: '#1d4ed8', scale: 0.98 }}
              disabledStyle={{ opacity: 0.6 }}
              accessibilityLabel="Entrar"
            >
              {isLoading ? <Spinner color="#ffffff" /> : 'Entrar'}
            </Button>
          </YStack>
        </FadeInView>

        {/* Error */}
        {errorMessage && (
          <FadeInView delay={0}>
            <YStack
              backgroundColor="#fef2f2"
              borderWidth={1}
              borderColor="#fecaca"
              borderRadius="$4"
              padding="$3"
              flexDirection="row"
              alignItems="center"
              gap="$2"
            >
              <Feather name="alert-circle" size={18} color="#dc2626" />
              <Text color="#dc2626" fontSize="$3" flex={1}>
                {errorMessage}
              </Text>
            </YStack>
          </FadeInView>
        )}
      </YStack>
    </KeyboardAvoidingView>
  );
}
