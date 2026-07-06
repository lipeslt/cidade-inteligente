import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface MapPreviewProps {
  latitude: number;
  longitude: number;
  height?: number;
}

/**
 * Componente de preview de mapa compacto.
 * Usa um fallback visual com link para o Google Maps ao invés de
 * react-native-maps nativo (que crasha sem API key no APK).
 */
export function MapPreview({ latitude, longitude, height = 200 }: MapPreviewProps) {
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const handleOpenMaps = () => {
    Linking.openURL(mapsUrl);
  };

  return (
    <TouchableOpacity
      onPress={handleOpenMaps}
      activeOpacity={0.8}
      accessibilityLabel="Abrir localização no Google Maps"
      accessibilityRole="button"
    >
      <View style={[styles.container, { height }]}>
        <View style={styles.iconContainer}>
          <Feather name="map-pin" size={32} color="#1e40af" />
        </View>
        <Text style={styles.coordsText}>
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </Text>
        <View style={styles.openButton}>
          <Feather name="external-link" size={14} color="#1e40af" />
          <Text style={styles.openText}>Abrir no Google Maps</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordsText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  openText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
  },
});
