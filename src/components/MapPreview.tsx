import React from 'react';
import { YStack, Text } from 'tamagui';

let MapView: React.ComponentType<any> | null = null;
let Marker: React.ComponentType<any> | null = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
} catch {
  // react-native-maps não disponível (ambiente de teste)
  MapView = null;
  Marker = null;
}

export interface MapPreviewProps {
  latitude: number;
  longitude: number;
  height?: number;
}

/**
 * Componente de preview de mapa compacto com um marker.
 * Se react-native-maps não estiver disponível (ex: testes), exibe placeholder com coordenadas.
 */
export function MapPreview({ latitude, longitude, height = 200 }: MapPreviewProps) {
  if (!MapView || !Marker) {
    return (
      <YStack
        height={height}
        borderRadius="$3"
        backgroundColor="$gray4"
        alignItems="center"
        justifyContent="center"
        borderWidth={1}
        borderColor="$gray6"
      >
        <Text fontSize="$3" color="$gray9">
          📍 Mapa
        </Text>
        <Text fontSize="$2" color="$gray8" marginTop="$1">
          Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
        </Text>
      </YStack>
    );
  }

  return (
    <YStack height={height} borderRadius="$3" overflow="hidden">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker coordinate={{ latitude, longitude }} />
      </MapView>
    </YStack>
  );
}
