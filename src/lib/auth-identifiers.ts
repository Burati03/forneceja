export const normalizePhone = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `55${digits}`;
  if (digits.length === 11 && !digits.startsWith("55")) return `55${digits}`;
  return digits;
};

export const isValidPhone = (value: string): boolean => {
  const normalized = normalizePhone(value);
  return normalized.length >= 10 && normalized.length <= 15;
};
