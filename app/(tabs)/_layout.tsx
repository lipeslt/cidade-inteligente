import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/stores/authStore';

/**
 * Ícone customizado para o botão central "+" elevado na tab bar.
 */
function CenterTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.centerBtnOuter}>
      <View style={[styles.centerBtn, focused && styles.centerBtnFocused]}>
        <Feather name="plus" size={28} color="#ffffff" />
      </View>
    </View>
  );
}

/**
 * Layout de tabs com navegação baseada no role do usuário:
 *
 * - admin: Início, Painel, Perfil (sem center button)
 * - tecnico: Início, Nova Solicitação (center "+"), Trabalho, Perfil
 * - cidadao: Início, Nova Solicitação (center "+"), Perfil
 *
 * Todas as rotas são declaradas como Tabs.Screen; as que não se aplicam
 * ao role ficam ocultas via href: null.
 */
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const role = user?.tipo ?? 'cidadao';

  const isAdmin = role === 'admin';
  const isTecnico = role === 'tecnico';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1e40af',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 10,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {/* Início — visível para todos */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />

      {/* Nova Solicitação — center button para cidadao e tecnico, oculto para admin */}
      <Tabs.Screen
        name="nova-solicitacao"
        options={{
          title: 'Nova Solicitação',
          ...(isAdmin
            ? { href: null }
            : {
                tabBarIcon: ({ focused }) => <CenterTabIcon focused={focused} />,
              }),
        }}
      />

      {/* Painel — visível apenas para admin */}
      <Tabs.Screen
        name="painel"
        options={{
          title: 'Painel',
          ...(isAdmin
            ? {
                tabBarIcon: ({ color }) => (
                  <Feather name="bar-chart-2" size={22} color={color} />
                ),
              }
            : { href: null }),
        }}
      />

      {/* Trabalho — visível apenas para tecnico */}
      <Tabs.Screen
        name="trabalho"
        options={{
          title: 'Trabalho',
          ...(isTecnico
            ? {
                tabBarIcon: ({ color }) => (
                  <Feather name="tool" size={22} color={color} />
                ),
              }
            : { href: null }),
        }}
      />

      {/* Perfil — visível para todos */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />

      {/* Minhas Solicitações — oculto da tab bar, acessado via navegação */}
      <Tabs.Screen
        name="minhas-solicitacoes"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerBtnOuter: {
    position: 'relative',
    top: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  centerBtnFocused: {
    backgroundColor: '#1d4ed8',
    transform: [{ scale: 1.05 }],
  },
});
