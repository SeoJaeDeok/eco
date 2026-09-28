import type { Observation } from '../types';

export const OBSERVATION_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type ObservationMonth = typeof OBSERVATION_MONTHS[number];

export interface ObservationDateParts {
  year: number;
  month: ObservationMonth;
}

export const normalizeObservationMonths = (months: readonly number[]): ObservationMonth[] => {
  const selected = OBSERVATION_MONTHS.filter((month) => months.includes(month));
  return selected.length === OBSERVATION_MONTHS.length ? [] : selected;
};

export const toggleObservationMonth = (
  months: readonly ObservationMonth[],
  month: ObservationMonth,
): ObservationMonth[] => normalizeObservationMonths(
  months.includes(month) ? months.filter((value) => value !== month) : [...months, month],
);

// observed_date is a calendar date, not an instant. Never infer a timezone or repair an invalid day.
export const getObservationDateParts = (date: unknown): ObservationDateParts | null => {
  if (typeof date !== 'string' || date.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return null;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1] ? { year, month: month as ObservationMonth } : null;
};

export const getObservationMonth = (date: unknown): ObservationMonth | null => (
  getObservationDateParts(date)?.month ?? null
);

export const getObservationYears = (observations: readonly Observation[]): number[] => {
  const years = new Set<number>();
  for (const observation of observations) {
    if (observation.status !== 'approved') continue;
    const date = getObservationDateParts(observation.date);
    if (date) years.add(date.year);
  }
  return [...years].sort((a, b) => b - a);
};
