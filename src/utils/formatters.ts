/**
 * Funções de formatação para o app Conecta Boa Esperança.
 *
 * - Coordenadas: usa toFixed + trim de trailing zeros
 * - Descrição: trunca com "..." se exceder maxLength
 * - Data: converte via string splitting (sem Date object) para evitar problemas de timezone
 */

/**
 * Formata coordenada para exibição ao cidadão (até 6 casas decimais).
 * Usa toFixed(6) e remove zeros à direita após o ponto decimal.
 *
 * Exemplo: -12.5448 → "-12.5448" (não "-12.544800")
 */
export function formatCoordinateCitizen(value: number): string {
  const fixed = value.toFixed(6);
  // Remove trailing zeros after decimal point, but keep at least one digit after dot
  // e.g. "12.000000" → "12.0" is acceptable, but we trim to "12"
  // Actually per spec: trim trailing zeros entirely
  return trimTrailingZeros(fixed);
}

/**
 * Formata coordenada para envio ao endpoint de localização do técnico (até 8 casas decimais).
 * Usa toFixed(8) e remove zeros à direita após o ponto decimal.
 *
 * Exemplo: -12.5448 → "-12.5448" (não "-12.54480000")
 */
export function formatCoordinateTechnician(value: number): string {
  const fixed = value.toFixed(8);
  return trimTrailingZeros(fixed);
}

/**
 * Trunca texto de descrição para exibição na lista.
 * Se text.length > maxLength, retorna text.slice(0, maxLength) + "...".
 * Caso contrário, retorna o texto sem modificação.
 *
 * @param text - Texto da descrição
 * @param maxLength - Comprimento máximo antes de truncar (default: 100)
 */
export function truncateDescription(text: string, maxLength: number = 100): string {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
}

/**
 * Converte string de data no formato "YYYY-MM-DD HH:mm:ss" para "DD/MM/YYYY HH:mm".
 * Usa string splitting em vez de Date object para evitar problemas de timezone.
 *
 * Exemplo: "2026-05-08 10:00:00" → "08/05/2026 10:00"
 */
export function formatDateTime(dateString: string): string {
  // Split "YYYY-MM-DD HH:mm:ss" into date and time parts
  const [datePart, timePart] = dateString.split(' ');
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split(':');

  return `${day}/${month}/${year} ${hour}:${minute}`;
}

/**
 * Remove zeros à direita após o ponto decimal.
 * Se todos os dígitos decimais forem zero, remove também o ponto.
 *
 * "12.544800" → "12.5448"
 * "12.000000" → "12"
 * "-3.10"     → "-3.1"
 */
function trimTrailingZeros(value: string): string {
  if (!value.includes('.')) {
    return value;
  }
  // Remove trailing zeros
  let result = value.replace(/0+$/, '');
  // Remove trailing dot if all decimals were zeros
  if (result.endsWith('.')) {
    result = result.slice(0, -1);
  }
  return result;
}

/**
 * Garante que uma URL use HTTPS ao invés de HTTP.
 * Necessário porque a API retorna URLs de fotos com http://
 * mas o Android bloqueia requisições HTTP por padrão.
 */
export function ensureHttps(url: string): string {
  if (url && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}
