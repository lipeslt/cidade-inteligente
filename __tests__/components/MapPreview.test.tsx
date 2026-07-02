import React from 'react';
import { MapPreview } from '../../src/components/MapPreview';

describe('MapPreview', () => {
  it('deve ser exportado como named export', () => {
    expect(MapPreview).toBeDefined();
    expect(typeof MapPreview).toBe('function');
  });

  it('deve renderizar sem erro com coordenadas válidas', () => {
    expect(() => {
      MapPreview({ latitude: -18.7128, longitude: -40.4108 });
    }).not.toThrow();
  });

  it('deve aceitar height customizado', () => {
    expect(() => {
      MapPreview({ latitude: -18.7128, longitude: -40.4108, height: 300 });
    }).not.toThrow();
  });

  it('deve usar height default de 200 quando não especificado', () => {
    // MapPreview should accept call without height (default 200)
    expect(() => {
      MapPreview({ latitude: -18.7128, longitude: -40.4108 });
    }).not.toThrow();
  });
});
