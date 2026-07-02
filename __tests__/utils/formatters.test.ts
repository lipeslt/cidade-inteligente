import {
  formatCoordinateCitizen,
  formatCoordinateTechnician,
  truncateDescription,
  formatDateTime,
} from '../../src/utils/formatters';

describe('formatCoordinateCitizen', () => {
  it('formats coordinate with trailing zeros trimmed', () => {
    expect(formatCoordinateCitizen(-12.5448)).toBe('-12.5448');
  });

  it('trims all trailing zeros', () => {
    expect(formatCoordinateCitizen(10.0)).toBe('10');
  });

  it('keeps necessary decimal digits', () => {
    expect(formatCoordinateCitizen(-23.123456)).toBe('-23.123456');
  });

  it('limits to at most 6 decimal places', () => {
    // 1.23456789 toFixed(6) = "1.234568" (rounded)
    const result = formatCoordinateCitizen(1.23456789);
    const decimalPart = result.split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(6);
  });

  it('handles zero', () => {
    expect(formatCoordinateCitizen(0)).toBe('0');
  });

  it('handles negative values', () => {
    expect(formatCoordinateCitizen(-180)).toBe('-180');
  });
});

describe('formatCoordinateTechnician', () => {
  it('formats coordinate with trailing zeros trimmed', () => {
    expect(formatCoordinateTechnician(-12.5448)).toBe('-12.5448');
  });

  it('trims all trailing zeros', () => {
    expect(formatCoordinateTechnician(10.0)).toBe('10');
  });

  it('keeps up to 8 decimal places', () => {
    expect(formatCoordinateTechnician(-23.12345678)).toBe('-23.12345678');
  });

  it('limits to at most 8 decimal places', () => {
    const result = formatCoordinateTechnician(1.123456789012);
    const decimalPart = result.split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(8);
  });

  it('handles zero', () => {
    expect(formatCoordinateTechnician(0)).toBe('0');
  });
});

describe('truncateDescription', () => {
  it('returns text unchanged if within default limit', () => {
    const text = 'Short description';
    expect(truncateDescription(text)).toBe(text);
  });

  it('truncates with "..." if exceeds default 100 chars', () => {
    const text = 'a'.repeat(150);
    const result = truncateDescription(text);
    expect(result).toBe('a'.repeat(100) + '...');
    expect(result.length).toBe(103);
  });

  it('returns text unchanged at exactly 100 chars', () => {
    const text = 'b'.repeat(100);
    expect(truncateDescription(text)).toBe(text);
  });

  it('truncates at custom maxLength', () => {
    const text = 'Hello World! This is a test.';
    const result = truncateDescription(text, 5);
    expect(result).toBe('Hello...');
  });

  it('handles empty string', () => {
    expect(truncateDescription('')).toBe('');
  });
});

describe('formatDateTime', () => {
  it('converts standard datetime format', () => {
    expect(formatDateTime('2026-05-08 10:00:00')).toBe('08/05/2026 10:00');
  });

  it('preserves day, month, year, hour, minute', () => {
    expect(formatDateTime('2024-12-31 23:59:59')).toBe('31/12/2024 23:59');
  });

  it('handles midnight', () => {
    expect(formatDateTime('2025-01-01 00:00:00')).toBe('01/01/2025 00:00');
  });

  it('handles single-digit values with leading zeros', () => {
    expect(formatDateTime('2023-03-05 09:07:01')).toBe('05/03/2023 09:07');
  });
});
