export const mockAuthScenarios = {
  slow: "slow",
  serverError: "server-error",
  invalidCredentials: "invalid-credentials",
  emailDuplicate: "email-duplicate",
  duiDuplicate: "dui-duplicate",
  invalidPassword: "invalid-password",
  invalidLocation: "invalid-location",
  refreshExpired: "refresh-expired",
  invalidSession: "invalid-session",
} as const;

export type MockAuthScenario =
  (typeof mockAuthScenarios)[keyof typeof mockAuthScenarios];

export type MockAuthErrorFixture = {
  statusCode: 400 | 401 | 409 | 422 | 500;
  code: string;
  message: string;
};

export const mockAuthDelays = {
  default: {
    minimumMs: 300,
    maximumMs: 600,
  },
  slowMs: 2_000,
} as const;

export const mockAuthErrors = {
  invalidJson: {
    statusCode: 400,
    code: "VALIDATION_ERROR",
    message: "El cuerpo de la solicitud no contiene JSON válido.",
  },
  invalidLogin: {
    statusCode: 400,
    code: "VALIDATION_ERROR",
    message: "Los datos de inicio de sesión no son válidos.",
  },
  invalidRegistration: {
    statusCode: 400,
    code: "VALIDATION_ERROR",
    message: "Los datos de registro no son válidos.",
  },
  invalidDui: {
    statusCode: 400,
    code: "INVALID_DUI",
    message: "El DUI no es válido.",
  },
  invalidCredentials: {
    statusCode: 401,
    code: "INVALID_CREDENTIALS",
    message: "El correo o la contraseña son incorrectos.",
  },
  emailDuplicate: {
    statusCode: 409,
    code: "EMAIL_ALREADY_EXISTS",
    message: "El correo electrónico ya está registrado.",
  },
  duiDuplicate: {
    statusCode: 409,
    code: "DUI_ALREADY_EXISTS",
    message: "El DUI ya está registrado.",
  },
  invalidPassword: {
    statusCode: 422,
    code: "INVALID_PASSWORD",
    message: "La contraseña no cumple con los requisitos de seguridad.",
  },
  invalidLocation: {
    statusCode: 422,
    code: "INVALID_LOCATION",
    message: "La ubicación seleccionada no es válida.",
  },
  refreshExpired: {
    statusCode: 401,
    code: "SESSION_EXPIRED_OR_REVOKED",
    message: "La sesión ha expirado o ya no es válida.",
  },
  invalidSession: {
    statusCode: 401,
    code: "SESSION_EXPIRED_OR_REVOKED",
    message: "La sesión ha expirado o ya no es válida.",
  },
  serverError: {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "No fue posible completar la solicitud.",
  },
} as const satisfies Record<string, MockAuthErrorFixture>;
