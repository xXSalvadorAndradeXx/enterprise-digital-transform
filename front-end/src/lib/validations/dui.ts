export function isValidDui(value: string): boolean {
  const digits = value.replace(/\D/g, "");

  if (!/^\d{9}$/.test(digits)) {
    return false;
  }

  let sum = 0;

  for (let index = 0; index < 8; index += 1) {
    sum += Number(digits[index]) * (9 - index);
  }

  const remainder = sum % 10;
  const verifier = remainder === 0 ? 0 : 10 - remainder;

  return verifier === Number(digits[8]);
}
