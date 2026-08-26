import { delay, http, HttpResponse } from "msw";
import type { ZodError } from "zod";

import { loginSchema, registerSchema } from "@/lib/validations";
import {
  createMockCustomer,
  mockAccessToken,
  mockAccessTokenExpiresIn,
  mockCustomer,
  mockDuplicateRegistration,
  mockLoginCredentials,
} from "@/mocks/data";
import type { ApiError, ApiSuccess } from "@/types/api/api.types";
import type { Customer } from "@/types/auth/customer.types";

const AUTH_API_PATH = "/api/v1/ecommerce/auth";
const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 600;

type LoginSuccessData = {
  customer: Pick<Customer, "id" | "fullName" | "email">;
  accessToken: string;
  expiresIn: number;
};

type RegisterSuccessData = {
  customer: Customer;
  accessToken: string;
  expiresIn: number;
};

function getRandomDelay() {
  return (
    Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) +
    MIN_DELAY_MS
  );
}

function getValidationDetails(error: ZodError): Record<string, unknown> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.join(".") : "body";
    details[field] = [...(details[field] ?? []), issue.message];
  }

  return details;
}

function createErrorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  const body: ApiError = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  };

  return HttpResponse.json(body, { status: statusCode });
}

function getRegisterValidationCode(error: ZodError) {
  const invalidFields = new Set(
    error.issues.map((issue) => String(issue.path[0] ?? "")),
  );

  if (invalidFields.has("dui")) {
    return "INVALID_DUI";
  }

  if (invalidFields.has("password")) {
    return "INVALID_PASSWORD";
  }

  if (
    invalidFields.has("departmentId") ||
    invalidFields.has("districtId")
  ) {
    return "INVALID_LOCATION";
  }

  return "VALIDATION_ERROR";
}

async function readJson(request: Request) {
  try {
    return { success: true as const, body: (await request.json()) as unknown };
  } catch {
    return { success: false as const };
  }
}

const loginHandler = http.post(`*${AUTH_API_PATH}/login`, async ({ request }) => {
  await delay(getRandomDelay());

  const json = await readJson(request);

  if (!json.success) {
    return createErrorResponse(
      400,
      "VALIDATION_ERROR",
      "El cuerpo de la solicitud no contiene JSON válido.",
      { body: ["Se esperaba un cuerpo JSON válido."] },
    );
  }

  const parsedRequest = loginSchema.safeParse(json.body);

  if (!parsedRequest.success) {
    return createErrorResponse(
      400,
      "VALIDATION_ERROR",
      "Los datos de inicio de sesión no son válidos.",
      getValidationDetails(parsedRequest.error),
    );
  }

  const { email, password } = parsedRequest.data;

  if (
    email.toLowerCase() !== mockLoginCredentials.email ||
    password !== mockLoginCredentials.password
  ) {
    return createErrorResponse(
      401,
      "INVALID_CREDENTIALS",
      "El correo o la contraseña son incorrectos.",
    );
  }

  const body: ApiSuccess<LoginSuccessData> = {
    success: true,
    data: {
      customer: {
        id: mockCustomer.id,
        fullName: mockCustomer.fullName,
        email: mockCustomer.email,
      },
      accessToken: mockAccessToken,
      expiresIn: mockAccessTokenExpiresIn,
    },
  };

  return HttpResponse.json(body, { status: 200 });
});

const registerHandler = http.post(
  `*${AUTH_API_PATH}/register`,
  async ({ request }) => {
    await delay(getRandomDelay());

    const json = await readJson(request);

    if (!json.success) {
      return createErrorResponse(
        400,
        "VALIDATION_ERROR",
        "El cuerpo de la solicitud no contiene JSON válido.",
        { body: ["Se esperaba un cuerpo JSON válido."] },
      );
    }

    const parsedRequest = registerSchema.safeParse(json.body);

    if (!parsedRequest.success) {
      return createErrorResponse(
        400,
        getRegisterValidationCode(parsedRequest.error),
        "Los datos de registro no son válidos.",
        getValidationDetails(parsedRequest.error),
      );
    }

    const registration = parsedRequest.data;

    if (registration.email.toLowerCase() === mockDuplicateRegistration.email) {
      return createErrorResponse(
        409,
        "EMAIL_ALREADY_EXISTS",
        "El correo electrónico ya está registrado.",
      );
    }

    if (registration.dui === mockDuplicateRegistration.dui) {
      return createErrorResponse(
        409,
        "DUI_ALREADY_EXISTS",
        "El DUI ya está registrado.",
      );
    }

    const body: ApiSuccess<RegisterSuccessData> = {
      success: true,
      data: {
        customer: createMockCustomer(registration),
        accessToken: mockAccessToken,
        expiresIn: mockAccessTokenExpiresIn,
      },
    };

    return HttpResponse.json(body, { status: 201 });
  },
);

export const authHandlers = [loginHandler, registerHandler];
