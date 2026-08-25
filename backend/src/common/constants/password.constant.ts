// src/common/constants/password.constant.ts

/**
 * Expresión regular que valida la política de contraseña segura:
 * - Al menos una letra minúscula (?=.*[a-z])
 * - Al menos una letra mayúscula (?=.*[A-Z])
 * - Al menos un número (?=.*\d)
 * - Al menos un símbolo o carácter especial (?=.*[\W_])
 * - Mínimo 12 caracteres de longitud (.{12,})
 */
export const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;

/**
 * Mensaje estándar de error cuando la contraseña no cumple la política.
 */
export const PASSWORD_POLICY_MESSAGE =
  'La contraseña debe tener al menos 12 caracteres, incluir al menos una letra mayúscula, una letra minúscula, un número y un carácter especial (símbolo).';
