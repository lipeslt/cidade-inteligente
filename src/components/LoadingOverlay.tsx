import { View } from '@tamagui/core';
import { Spinner } from '@tamagui/spinner';

/**
 * Overlay fullscreen com spinner centralizado e fundo semi-transparente.
 * Usado para indicar carregamento em operações que bloqueiam a interface.
 */
export function LoadingOverlay() {
  return (
    <View
      position="absolute"
      t={0}
      l={0}
      r={0}
      b={0}
      bg="rgba(0, 0, 0, 0.4)"
      justify="center"
      items="center"
      z={1000}
    >
      <Spinner size="large" color="$blue10" />
    </View>
  );
}
