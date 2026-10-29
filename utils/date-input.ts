export function parseIsoDate(value: string) {
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function startOfTodayUtc() {
  const today = new Date();

  return new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );
}

export function getDateError(
  value: string,
  options: { label: string; allowPast?: boolean; allowFuture?: boolean },
) {
  if (!value.trim()) return null;

  const parsed = parseIsoDate(value);
  if (!parsed) return `${options.label} must use YYYY-MM-DD.`;

  const today = startOfTodayUtc();
  if (options.allowFuture === false && parsed > today) {
    return `${options.label} cannot be in the future.`;
  }

  if (options.allowPast === false && parsed < today) {
    return `${options.label} cannot be in the past.`;
  }

  return null;
}

export function getPartialDateError(
  value: string,
  options: { label: string; allowPast?: boolean; allowFuture?: boolean },
) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parts = trimmed.split("-");
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  const currentYear = new Date().getFullYear();

  if (
    options.allowFuture === false &&
    year.length === 4 &&
    Number(year) > currentYear
  ) {
    return `${options.label} year cannot be greater than ${currentYear}.`;
  }

  if (month?.length === 2) {
    const monthNumber = Number(month);
    if (monthNumber < 1 || monthNumber > 12) {
      return `${options.label} month must be between 01 and 12.`;
    }
  }

  if (day?.length === 2) {
    const dayNumber = Number(day);
    if (dayNumber < 1 || dayNumber > 31) {
      return `${options.label} day must be between 01 and 31.`;
    }

    if (year.length === 4 && month?.length === 2) {
      const yearNumber = Number(year);
      const monthNumber = Number(month);
      const daysInMonth = new Date(
        Date.UTC(yearNumber, monthNumber, 0),
      ).getUTCDate();

      if (dayNumber > daysInMonth) {
        return `${options.label} day is not valid for this month.`;
      }
    }
  }

  if (trimmed.length === 10) return getDateError(trimmed, options);

  return null;
}

export function formatDateInput(value: string, options?: { maxYear?: number }) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  let year = digits.slice(0, 4);

  if (options?.maxYear && year.length === 4 && Number(year) > options.maxYear) {
    year = year.slice(0, 3);
  }

  const monthDigits = digits.slice(4);
  let month = monthDigits.slice(0, 2);
  let day = digits.slice(6, 8);

  if (year.length === 4 && /^[2-9]$/.test(monthDigits.slice(0, 1))) {
    month = `0${monthDigits.slice(0, 1)}`;
    day = monthDigits.slice(1, 3);
  }

  if (year.length === 4 && month.length === 2 && /^[4-9]$/.test(day)) {
    day = `0${day}`;
  }

  return [year, month, day].filter(Boolean).join("-");
}
