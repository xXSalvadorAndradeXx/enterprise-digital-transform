export function formatPhone(phone: string) {
  if (!phone) return "";

  const digits = phone.replace(/\D/g, "");

  let local = digits;

  if (digits.startsWith("503") && digits.length === 11) {
    local = digits.slice(3);
  }

  if (local.length !== 8) {
    return phone;
  }

  return `+503 ${local.slice(0, 4)}-${local.slice(4)}`;
}