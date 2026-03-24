const mediumDateShortTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatMediumDateTime = (value: string | number | Date): string => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return mediumDateShortTimeFormatter.format(date);
};

export const formatMediumDate = (value: string | number | Date): string => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
};

export const isExpired = (expiry?: string) => {
  if (!expiry) return false;
  return new Date(expiry) < new Date();
};
