import * as Location from 'expo-location';

import { apiClient } from './api';
import { formatCoordinateTechnician } from '@/utils/formatters';

/**
 * Serviço de localização — permissões GPS, captura de posição e registro de
 * localização do técnico.
 *
 * Usa expo-location para permissões e posição.
 * Usa apiClient para o POST ao endpoint /tecnico/localizacao.
 */

/**
 * Solicita permissão de localização foreground ao usuário.
 * Retorna true se a permissão foi concedida, false caso contrário.
 */
export async function requestPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Obtém a posição atual do dispositivo com accuracy Balanced e timeout configurável.
 * Retorna as coordenadas { latitude, longitude } ou null se falhar ou exceder o timeout.
 *
 * @param timeoutMs - Timeout em milissegundos (default: 15000)
 */
export async function getCurrentPosition(
  timeoutMs: number = 15000,
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    });

    const result = await Promise.race([locationPromise, timeoutPromise]);

    if (!result) {
      return null;
    }

    return {
      latitude: result.coords.latitude,
      longitude: result.coords.longitude,
    };
  } catch {
    return null;
  }
}

/**
 * Registra a localização do técnico vinculada a uma solicitação.
 * POST /tecnico/localizacao com id_solicitacao, latitude e longitude como strings
 * formatadas com até 8 casas decimais. Timeout de 15s.
 *
 * @param idSolicitacao - ID da solicitação vinculada
 * @param coords - Coordenadas { latitude, longitude } capturadas pelo GPS
 */
export async function registrarLocalizacaoTecnico(
  idSolicitacao: number,
  coords: { latitude: number; longitude: number },
): Promise<void> {
  await apiClient.post(
    '/tecnico/localizacao',
    {
      id_solicitacao: idSolicitacao,
      latitude: formatCoordinateTechnician(coords.latitude),
      longitude: formatCoordinateTechnician(coords.longitude),
    },
    { timeout: 15000 },
  );
}
