import { useState, useRef, useCallback, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Animated,
  View,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { YStack, XStack, Text, Input, Button, Spinner } from 'tamagui';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuthStore } from '@/stores/authStore';
import { validateLoginForm } from '@/utils/validation';
import { AppError } from '@/utils/errors';

const { width, height } = Dimensions.get('window');
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
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(-30)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    });
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
      {/* Green gradient background */}
      <LinearGradient
        colors={['#1e3a5f', '#1e40af', '#2563eb']}
        style={styles.topSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Diagonal decorative lines */}
        <View style={styles.diagonalLine1} />
        <View style={styles.diagonalLine2} />
        <View style={styles.diagonalLine3} />

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ translateY: logoTranslateY }],
            },
          ]}
        >
          <Image
            source={require('../src/img/LOGO-PREFEITURA-CLARA.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </LinearGradient>

      {/* White card form */}
      <KeyboardAvoidingView
        style={styles.bottomSection}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Animated.View
          style={[
            styles.formCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
          {/* Greeting */}
          <Text style={styles.greeting}>Olá!</Text>
          <Text style={styles.greetingSub}>Faça login para continuar</Text>

          <YStack gap="$4" marginTop="$4">
            {/* Email Field */}
            <XStack
              backgroundColor="#ffffff"
              borderRadius={25}
              borderWidth={1.5}
              borderColor="#e2e8f0"
              alignItems="center"
              paddingHorizontal="$4"
              height={50}
            >
              <Feather name="user" size={18} color="#94a3b8" />
              <Input
                flex={1}
                placeholder="E-mail"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                borderWidth={0}
                backgroundColor="transparent"
                placeholderTextColor="#94a3b8"
                fontSize={14}
                accessibilityLabel="E-mail"
              />
            </XStack>

            {/* Password Field */}
            <XStack
              backgroundColor="#ffffff"
              borderRadius={25}
              borderWidth={1.5}
              borderColor="#e2e8f0"
              alignItems="center"
              paddingHorizontal="$4"
              height={50}
            >
              <Feather name="lock" size={18} color="#94a3b8" />
              <Input
                flex={1}
                placeholder="Senha"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                borderWidth={0}
                backgroundColor="transparent"
                placeholderTextColor="#94a3b8"
                fontSize={14}
                accessibilityLabel="Senha"
              />
              <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={18}
                color="#94a3b8"
                onPress={() => setShowPassword(!showPassword)}
              />
            </XStack>

            {/* Error Message */}
            {errorMessage && (
              <XStack
                backgroundColor="#fef2f2"
                borderRadius={12}
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
              height={50}
              backgroundColor="#1e40af"
              borderRadius={25}
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
                <Text color="#ffffff" fontWeight="700" fontSize={16}>
                  Entrar
                </Text>
              )}
            </Button>
          </YStack>

          {/* Footer */}
          <Text style={styles.footer}>
            Prefeitura Municipal de Sorriso - MT
          </Text>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topSection: {
    height: height * 0.4,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  diagonalLine1: {
    position: 'absolute',
    width: 2,
    height: '120%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '25deg' }],
    left: '20%',
    top: '-10%',
  },
  diagonalLine2: {
    position: 'absolute',
    width: 2,
    height: '120%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '25deg' }],
    left: '40%',
    top: '-10%',
  },
  diagonalLine3: {
    position: 'absolute',
    width: 2,
    height: '120%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    transform: [{ rotate: '25deg' }],
    left: '65%',
    top: '-10%',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  bottomSection: {
    flex: 1,
    marginTop: -40,
  },
  formCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 28,
    paddingTop: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e40af',
  },
  greetingSub: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 4,
  },
  footer: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 24,
  },
});
