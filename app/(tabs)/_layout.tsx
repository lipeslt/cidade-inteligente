import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Custom tab bar icon for the center "+" button.
 * Renders a raised circular blue button that floats above the tab bar.
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
 * Tab layout with 3 tabs:
 * - Início (left) with home icon
 * - Nova Solicitação (center) with raised "+" button
 * - Perfil (right) with user icon
 *
 * The "minhas-solicitacoes" route is accessed from within
 * the Início tab (not shown as a separate tab).
 */
export default function TabLayout() {
  const insets = useSafeAreaInsets();

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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="nova-solicitacao"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <CenterTabIcon focused={focused} />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
      {/* Hidden from tab bar — accessed via navigation */}
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
