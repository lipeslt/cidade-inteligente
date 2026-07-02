import { useState, useRef, useCallback } from 'react';
import { YStack, Text, Input, Button, Spinner } from 'tamagui';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';
import { validateLoginForm } from '@/utils/validation';
import { AppError } from '@/utils/errors';

/** Timeout de 15s para exibir mensagem de falha de conexão */
const LOGIN_TIMEOUT_MS = 15000;

/**
 * Tela de Login do Conecta Boa Esperança.
 *
 * Valida email/senha client-side antes de submeter.
 * Exibe erros mapeados da API e trata timeout de 15s.
 */
export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ref para cancelar o timeout quando login resolve/rejeita antes de 15s
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogin = useCallback(async () => {
    // Limpa erro anterior
    setErrorMessage(null);

    // Validação client-side
    const validation = validateLoginForm(email, senha);
    if (!validation.valid) {
      setErrorMessage(validation.errors.join('. '));
      return;
    }

    setIsLoading(true);

    // Configura timeout de 15s
    let timedOut = false;
    timeoutRef.current = setTimeout(() => {
      timedOut = true;
      setIsLoading(false);
      setErrorMessage('Falha na conexão. Verifique sua internet e tente novamente.');
    }, LOGIN_TIMEOUT_MS);

    try {
      await login(email.trim(), senha);

      // Se deu timeout antes de resolver, não navega
      if (timedOut) return;

      // Limpa timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setIsLoading(false);
      router.replace('/(tabs)');
    } catch (error) {
      // Se deu timeout antes de rejeitar, não exibe erro duplicado
      if (timedOut) return;

      // Limpa timeout
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
    <YStack flex={1} justifyContent="center" padding="$6" backgroundColor="$background" gap="$4">
      {/* Título */}
      <YStack alignItems="center" gap="$2" marginBottom="$4">
        <Text fontSize="$8" fontWeight="700" color="$blue10" textAlign="center">
          Conecta Boa Esperança
        </Text>
        <Text fontSize="$4" color="$gray10" textAlign="center">
          Faça login para continuar
        </Text>
      </YStack>

      {/* Campos do formulário */}
      <Input
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
        accessibilityLabel="E-mail"
      />

      <Input
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        editable={!isLoading}
        accessibilityLabel="Senha"
      />

      {/* Botão de submit */}
      <Button
        onPress={handleLogin}
        disabled={isLoading}
        theme="blue"
        size="$5"
        marginTop="$2"
        accessibilityLabel="Entrar"
      >
        {isLoading ? <Spinner color="$color" /> : 'Entrar'}
      </Button>

      {/* Mensagem de erro */}
      {errorMessage && (
        <YStack
          backgroundColor="$red2"
          borderWidth={1}
          borderColor="$red6"
          borderRadius="$4"
          padding="$3"
          marginTop="$2"
        >
          <Text color="$red10" fontSize="$3" textAlign="center">
            {errorMessage}
          </Text>
        </YStack>
      )}
    </YStack>
  );
}
