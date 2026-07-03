import { useState, useRef, useCallback, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Animated,
  View,
  StyleSheet,
  Dimensions,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
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
const PANEL_HEIGHT = height * 0.55;

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animations
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const panelTranslateY = useRef(new Animated.Value(PANEL_HEIGHT)).current;
  const logoMoveUp = useRef(new Animated.Value(0)).current;
  const panelKeyboardOffset = useRef(new Animated.Value(0)).current;

  // Keyboard listeners to move panel up
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      Animated.timing(panelKeyboardOffset, {
        toValue: -e.endCoordinates.height * 0.5,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(panelKeyboardOffset, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Entrance animation
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Show form panel
  const handleShowForm = useCallback(() => {
    setShowForm(true);
    Animated.parallel([
      Animated.spring(panelTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(logoMoveUp, {
        toValue: -(height * 0.25),
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Hide form panel (tap outside)
  const handleHideForm = useCallback(() => {
    Keyboard.dismiss();
    setShowForm(false);
    Animated.parallel([
      Animated.spring(panelTranslateY, {
        toValue: PANEL_HEIGHT,
        tension: 65,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(logoMoveUp, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = useCallback(async () => {
    setErrorMessage(null);
    Keyboard.dismiss();

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
      {/* Blue gradient full background */}
      <LinearGradient
        colors={['#0f172a', '#1e3a5f', '#1e40af']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Logo centered */}
      <TouchableWithoutFeedback onPress={showForm ? handleHideForm : undefined}>
        <View style={styles.logoArea}>
          <Animated.View
            style={{
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: logoMoveUp },
              ],
            }}
          >
            <Image
              source={require('../src/img/LOGO-PREFEITURA-CLARA.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      {/* "Iniciar Sessão" button - visible only when form is hidden */}
      {!showForm && (
        <Animated.View style={[styles.startBtnContainer, { opacity: btnOpacity }]}>
          <Button
            onPress={handleShowForm}
            size="$5"
            backgroundColor="#ffffff"
            borderRadius={30}
            pressStyle={{ scale: 0.96, opacity: 0.9 }}
            width={width - 60}
            accessibilityLabel="Iniciar Sessão"
          >
            <XStack alignItems="center" gap="$2">
              <Text color="#1e40af" fontWeight="700" fontSize={16}>
                Iniciar Sessão
              </Text>
              <Feather name="arrow-right" size={18} color="#1e40af" />
            </XStack>
          </Button>
        </Animated.View>
      )}

      {/* Sliding form panel from bottom */}
      <Animated.View
        style={[
          styles.formPanel,
          {
            transform: [
              { translateY: panelTranslateY },
              { translateY: panelKeyboardOffset },
            ],
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          <View style={styles.formContent}>
            {/* Greeting */}
            <Text style={styles.greeting}>Olá!</Text>
            <Text style={styles.greetingSub}>Faça login para continuar</Text>

            <YStack gap="$4" marginTop="$5">
              {/* Email Field */}
              <XStack
                backgroundColor="#f8fafc"
                borderRadius={25}
                borderWidth={1.5}
                borderColor="#e2e8f0"
                alignItems="center"
                paddingHorizontal="$4"
                height={52}
              >
                <Feather name="mail" size={18} color="#94a3b8" />
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
                  fontSize={15}
                  accessibilityLabel="E-mail"
                />
              </XStack>

              {/* Password Field */}
              <XStack
                backgroundColor="#f8fafc"
                borderRadius={25}
                borderWidth={1.5}
                borderColor="#e2e8f0"
                alignItems="center"
                paddingHorizontal="$4"
                height={52}
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
                  fontSize={15}
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
                height={52}
                backgroundColor="#1e40af"
                borderRadius={26}
                pressStyle={{ backgroundColor: '#1d4ed8', scale: 0.98 }}
                disabledStyle={{ opacity: 0.7 }}
                marginTop="$1"
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
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 220,
  },
  startBtnContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  formPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  handleBar: {
    width: 56,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  formContent: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
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
});
