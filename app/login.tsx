import { useState, useRef, useCallback, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Animated,
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { YStack, XStack, Text, Input, Button, Spinner } from 'tamagui';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuthStore } from '@/stores/authStore';
import { validateLoginForm } from '@/utils/validation';
import { AppError } from '@/utils/errors';

const { width } = Dimensions.get('window');
const LOGIN_TIMEOUT_MS = 15000;

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsLoading(false);
      router.replace('/(tabs)');
    } catch (error) {
      if (timedOut) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsLoading(false);
      if (error instanceof AppError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
      }
    }
  }, [email, senha, login, router]);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0f172a', '#1e3a5f', '#1e40af']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative circles */}
      <View style={[styles.circle, styles.circleTopRight]} />
      <View style={[styles.circle, styles.circleBottomLeft]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Logo Section */}
          <Animated.View style={[styles.logoSection, { transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoOuter}>
              <View style={styles.logoInner}>
                <Feather name="map-pin" size={32} color="#ffffff" />
              </View>
            </View>
            <Text style={styles.brandTitle}>Conecta</Text>
            <Text style={styles.brandSubtitle}>Boa Esperança</Text>
            <Text style={styles.tagline}>Cidade Inteligente</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: formOpacity,
                transform: [{ translateY: formTranslateY }],
              },
            ]}
          >
            <YStack gap="$4" padding="$5">
              {/* Email Field */}
              <YStack gap="$2">
                <Text fontSize={13} fontWeight="600" color="#475569" letterSpacing={0.5}>
                  E-MAIL
                </Text>
                <XStack
                  backgroundColor="#f8fafc"
                  borderRadius="$4"
                  borderWidth={1.5}
                  borderColor="#e2e8f0"
                  alignItems="center"
                  paddingHorizontal="$3"
                  focusStyle={{ borderColor: '#1e40af' }}
                >
                  <Feather name="mail" size={18} color="#94a3b8" />
                  <Input
                    flex={1}
                    placeholder="seu@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    size="$4"
                    borderWidth={0}
                    backgroundColor="transparent"
                    placeholderTextColor="#94a3b8"
                    accessibilityLabel="E-mail"
                  />
                </XStack>
              </YStack>

              {/* Password Field */}
              <YStack gap="$2">
                <Text fontSize={13} fontWeight="600" color="#475569" letterSpacing={0.5}>
                  SENHA
                </Text>
                <XStack
                  backgroundColor="#f8fafc"
                  borderRadius="$4"
                  borderWidth={1.5}
                  borderColor="#e2e8f0"
                  alignItems="center"
                  paddingHorizontal="$3"
                  focusStyle={{ borderColor: '#1e40af' }}
                >
                  <Feather name="lock" size={18} color="#94a3b8" />
                  <Input
                    flex={1}
                    placeholder="••••••••"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    size="$4"
                    borderWidth={0}
                    backgroundColor="transparent"
                    placeholderTextColor="#94a3b8"
                    accessibilityLabel="Senha"
                  />
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color="#94a3b8"
                    onPress={() => setShowPassword(!showPassword)}
                  />
                </XStack>
              </YStack>

              {/* Error Message */}
              {errorMessage && (
                <XStack
                  backgroundColor="#fef2f2"
                  borderWidth={1}
                  borderColor="#fecaca"
                  borderRadius="$3"
                  padding="$3"
                  alignItems="center"
                  gap="$2"
                >
                  <Feather name="alert-circle" size={16} color="#dc2626" />
                  <Text color="#dc2626" fontSize={13} flex={1}>
                    {errorMessage}
                  </Text>
                </XStack>
              )}

              {/* Submit Button */}
              <Button
                onPress={handleLogin}
                disabled={isLoading}
                size="$5"
                backgroundColor="#1e40af"
                borderRadius="$4"
                pressStyle={{ backgroundColor: '#1d4ed8', scale: 0.98 }}
                disabledStyle={{ opacity: 0.7 }}
                marginTop="$2"
                accessibilityLabel="Entrar"
              >
                {isLoading ? (
                  <XStack alignItems="center" gap="$2">
                    <Spinner color="#ffffff" size="small" />
                    <Text color="#ffffff" fontWeight="700" fontSize={16}>
                      Entrando...
                    </Text>
                  </XStack>
                ) : (
                  <XStack alignItems="center" gap="$2">
                    <Text color="#ffffff" fontWeight="700" fontSize={16}>
                      Entrar
                    </Text>
                    <Feather name="arrow-right" size={18} color="#ffffff" />
                  </XStack>
                )}
              </Button>
            </YStack>
          </Animated.View>

          {/* Footer */}
          <Text style={styles.footer}>
            Prefeitura Municipal de Boa Esperança
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 32,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  circleTopRight: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.3,
    right: -width * 0.3,
  },
  circleBottomLeft: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
});
