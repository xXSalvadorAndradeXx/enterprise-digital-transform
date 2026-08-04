/**
 * Proveedores de correo admitidos al crear usuarios del ERP.
 *
 * Esta validación mejora la calidad de los datos en Frontend,
 * pero no demuestra que la cuenta de correo realmente exista.
 */
export const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
] as const;

export const ALLOWED_EMAIL_DOMAINS_MESSAGE =
  "Utilice un correo de Gmail, Outlook, Hotmail, Live, Yahoo o iCloud.";
