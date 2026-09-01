import { describe, expect, it } from 'vitest';
import { makeUnits } from './units';

describe('units', () => {
  const metric = makeUnits('metric');
  const imperial = makeUnits('imperial');

  it('shows metres as kilometres or miles, and converts back', () => {
    expect(metric.fmtDistance(5000, 2)).toBe('5.00');
    expect(imperial.fmtDistance(1609.344, 2)).toBe('1.00');
    expect(imperial.toMetres(1)).toBeCloseTo(1609.344, 3);
    expect(metric.toMetres(1)).toBe(1000);
  });

  it('restates a pace per kilometre as a pace per mile', () => {
    // Five minutes a kilometre is a little over eight minutes a mile.
    expect(metric.fmtPace(300)).toBe('5:00');
    expect(imperial.fmtPace(300)).toBe('8:03');
  });

  it('has one reading for a pace that never happened', () => {
    expect(metric.fmtPace(0)).toBe('—:—');
    expect(imperial.fmtPace(Number.POSITIVE_INFINITY)).toBe('—:—');
  });

  it('shows speed and altitude in the matching unit', () => {
    expect(metric.fmtSpeed(10)).toBe('36.0');
    expect(imperial.fmtSpeed(10)).toBe('22.4');
    expect(metric.fmtElevation(100)).toBe('100');
    expect(imperial.fmtElevation(100)).toBe('328');
  });

  it('splits at the length of the unit it is set to', () => {
    expect(metric.splitM).toBe(1000);
    expect(imperial.splitM).toBeCloseTo(1609.344, 3);
  });
});
