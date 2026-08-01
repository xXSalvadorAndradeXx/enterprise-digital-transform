export interface PasswordRevealBoxProps {
  password: string;
  /** Horas hasta que expire la contraseña temporal. Default: 24. */
  expiresInHours?: number;
}