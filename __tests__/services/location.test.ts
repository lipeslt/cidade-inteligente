import {
  requestPermission,
  getCurrentPosition,
  registrarLocalizacaoTecnico,
} from '../../src/services/location';

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    Balanced: 3,
  },
}));

// Mock apiClient
jest.mock('../../src/services/api', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

// Mock formatters
jest.mock('../../src/utils/formatters', () => ({
  formatCoordinateTechnician: jest.fn((v: number) => v.toFixed(8).replace(/0+$/, '').replace(/\.$/, '')),
}));

import * as Location from 'expo-location';
import { apiClient } from '../../src/services/api';
import { formatCoordinateTechnician } from '../../src/utils/formatters';

describe('Location Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPermission', () => {
    it('returns true when permission is granted', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestPermission();
      expect(result).toBe(true);
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('returns false when permission is denied', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await requestPermission();
      expect(result).toBe(false);
    });

    it('returns false for undetermined permission status', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });

      const result = await requestPermission();
      expect(result).toBe(false);
    });
  });

  describe('getCurrentPosition', () => {
    it('returns coordinates on success', async () => {
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: { latitude: -19.123456, longitude: -40.654321 },
      });

      const result = await getCurrentPosition();
      expect(result).toEqual({ latitude: -19.123456, longitude: -40.654321 });
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: Location.Accuracy.Balanced,
      });
    });

    it('returns null when location times out', async () => {
      (Location.getCurrentPositionAsync as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ coords: { latitude: 0, longitude: 0 } }), 5000)),
      );

      const result = await getCurrentPosition(50); // 50ms timeout
      expect(result).toBeNull();
    });

    it('returns null when getCurrentPositionAsync throws', async () => {
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error('Location unavailable'),
      );

      const result = await getCurrentPosition();
      expect(result).toBeNull();
    });

    it('uses default timeout of 15000ms', async () => {
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: { latitude: -10.0, longitude: -40.0 },
      });

      const result = await getCurrentPosition();
      expect(result).toEqual({ latitude: -10.0, longitude: -40.0 });
    });
  });

  describe('registrarLocalizacaoTecnico', () => {
    it('sends POST with formatted coordinates and timeout 15s', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ data: { ok: true } });

      const coords = { latitude: -19.12345678, longitude: -40.87654321 };
      await registrarLocalizacaoTecnico(42, coords);

      expect(formatCoordinateTechnician).toHaveBeenCalledWith(-19.12345678);
      expect(formatCoordinateTechnician).toHaveBeenCalledWith(-40.87654321);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/tecnico/localizacao',
        {
          id_solicitacao: 42,
          latitude: expect.any(String),
          longitude: expect.any(String),
        },
        { timeout: 15000 },
      );
    });

    it('propagates API errors', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const coords = { latitude: -19.0, longitude: -40.0 };
      await expect(registrarLocalizacaoTecnico(1, coords)).rejects.toThrow('Network Error');
    });
  });
});
