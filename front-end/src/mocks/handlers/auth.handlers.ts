import { delay, http, HttpResponse } from "msw";
import type { ZodError } from "zod";

import { loginSchema, registerSchema } from "@/lib/validations";
import {
  createMockCustomer,
  mockAccessToken,
  mockAccessTokenExpiresIn,
  mockAuthDelays,
  mockAuthErrors,
  mockAuthScenarios,
  mockCustomer,
  mockDuplicateRegistration,
  mockLoginCredentials,
} from "@/mocks/data";
import type { MockAuthErrorFixture, MockAuthScenario } from "@/mocks/data";
import type { ApiError, ApiSuccess } from "@/types/api/api.types";
import type { Customer } from "@/types/auth/customer.types";

const AUTH_API_PATH = "/api/v1/ecommerce/auth";

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

type CurrentCustomerData = Pick<
  Customer,
  "id" | "fullName" | "email" | "phone"
>;

type RefreshSuccessData = {
  accessToken: string;
  expiresIn: number;
};

const scenarioErrors: Partial<
  Record<MockAuthScenario, MockAuthErrorFixture>
> = {
  [mockAuthScenarios.invalidCredentials]: mockAuthErrors.invalidCredentials,
  [mockAuthScenarios.emailDuplicate]: mockAuthErrors.emailDuplicate,
  [mockAuthScenarios.duiDuplicate]: mockAuthErrors.duiDuplicate,
  [mockAuthScenarios.invalidPassword]: mockAuthErrors.invalidPassword,
  [mockAuthScenarios.invalidLocation]: mockAuthErrors.invalidLocation,
  [mockAuthScenarios.refreshExpired]: mockAuthErrors.refreshExpired,
  [mockAuthScenarios.invalidSession]: mockAuthErrors.invalidSession,
  [mockAuthScenarios.serverError]: mockAuthErrors.serverError,
};

function getRequestScenario(request: Request): MockAuthScenario | null {
  const scenario = new URL(request.url).searchParams.get("scenario");
  const scenarios = Object.values(mockAuthScenarios) as MockAuthScenario[];

  return scenario && scenarios.includes(scenario as MockAuthScenario)
    ? (scenario as MockAuthScenario)
    : null;
}

async function applyDelay(scenario: MockAuthScenario | null) {
  if (scenario === mockAuthScenarios.slow) {
    await delay(mockAuthDelays.slowMs);
    return;
  }

  const { minimumMs, maximumMs } = mockAuthDelays.default;
  const duration =
    Math.floor(Math.random() * (maximumMs - minimumMs + 1)) + minimumMs;

  await delay(duration);
}

function createSuccessResponse<T>(data: T, statusCode = 200) {
  const body: ApiSuccess<T> = {
    success: true,
    data,
  };

  return HttpResponse.json(body, { status: statusCode });
}

function createErrorResponse(
  error: MockAuthErrorFixture,
  details?: Record<string, unknown>,
) {
  const body: ApiError = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(details ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  };

  return HttpResponse.json(body, { status: error.statusCode });
}

function getValidationDetails(error: ZodError): Record<string, unknown> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.join(".") : "body";
    details[field] = [...(details[field] ?? []), issue.message];
  }

  return details;
}

function getRegisterValidationError(error: ZodError) {
  const invalidFields = new Set(
    error.issues.map((issue) => String(issue.path[0] ?? "")),
  );

  if (invalidFields.has("dui")) {
    return mockAuthErrors.invalidDui;
  }

  if (invalidFields.has("password")) {
    return mockAuthErrors.invalidPassword;
  }

  if (
    invalidFields.has("departmentId") ||
    invalidFields.has("districtId")
  ) {
    return mockAuthErrors.invalidLocation;
  }

  return mockAuthErrors.invalidRegistration;
}

async function readJson(request: Request) {
  try {
    return { success: true as const, body: (await request.json()) as unknown };
  } catch {
    return { success: false as const };
  }
}

async function getScenarioResponse(
  request: Request,
  supportedScenarios: readonly MockAuthScenario[],
) {
  const scenario = getRequestScenario(request);

  await applyDelay(scenario);

  if (scenario && supportedScenarios.includes(scenario)) {
    const error = scenarioErrors[scenario];

    if (error) {
      return createErrorResponse(error);
    }
  }

  return null;
}

const loginHandler = http.post(`*${AUTH_API_PATH}/login`, async ({ request }) => {
  const scenarioResponse = await getScenarioResponse(request, [
    mockAuthScenarios.invalidCredentials,
    mockAuthScenarios.serverError,
  ]);

  if (scenarioResponse) {
    return scenarioResponse;
  }

  const json = await readJson(request);

  if (!json.success) {
    return createErrorResponse(mockAuthErrors.invalidJson, {
      body: ["Se esperaba un cuerpo JSON válido."],
    });
  }

  const parsedRequest = loginSchema.safeParse(json.body);

  if (!parsedRequest.success) {
    return createErrorResponse(
      mockAuthErrors.invalidLogin,
      getValidationDetails(parsedRequest.error),
    );
  }

  const { email, password } = parsedRequest.data;

  if (
    email.toLowerCase() !== mockLoginCredentials.email ||
    password !== mockLoginCredentials.password
  ) {
    return createErrorResponse(mockAuthErrors.invalidCredentials);
  }

  const data: LoginSuccessData = {
    customer: {
      id: mockCustomer.id,
      fullName: mockCustomer.fullName,
      email: mockCustomer.email,
    },
    accessToken: mockAccessToken,
    expiresIn: mockAccessTokenExpiresIn,
  };

  return createSuccessResponse(data);
});

const registerHandler = http.post(
  `*${AUTH_API_PATH}/register`,
  async ({ request }) => {
    const scenarioResponse = await getScenarioResponse(request, [
      mockAuthScenarios.emailDuplicate,
      mockAuthScenarios.duiDuplicate,
      mockAuthScenarios.invalidPassword,
      mockAuthScenarios.invalidLocation,
      mockAuthScenarios.serverError,
    ]);

    if (scenarioResponse) {
      return scenarioResponse;
    }

    const json = await readJson(request);

    if (!json.success) {
      return createErrorResponse(mockAuthErrors.invalidJson, {
        body: ["Se esperaba un cuerpo JSON válido."],
      });
    }

    const parsedRequest = registerSchema.safeParse(json.body);

    if (!parsedRequest.success) {
      return createErrorResponse(
        getRegisterValidationError(parsedRequest.error),
        getValidationDetails(parsedRequest.error),
      );
    }

    const registration = parsedRequest.data;

    if (registration.email.toLowerCase() === mockDuplicateRegistration.email) {
      return createErrorResponse(mockAuthErrors.emailDuplicate);
    }

    if (registration.dui === mockDuplicateRegistration.dui) {
      return createErrorResponse(mockAuthErrors.duiDuplicate);
    }

    const data: RegisterSuccessData = {
      customer: createMockCustomer(registration),
      accessToken: mockAccessToken,
      expiresIn: mockAccessTokenExpiresIn,
    };

    return createSuccessResponse(data, 201);
  },
);

const currentCustomerHandler = http.get(
  `*${AUTH_API_PATH}/me`,
  async ({ request }) => {
    const scenarioResponse = await getScenarioResponse(request, [
      mockAuthScenarios.invalidSession,
      mockAuthScenarios.serverError,
    ]);

    if (scenarioResponse) {
      return scenarioResponse;
    }

    const data: CurrentCustomerData = {
      id: mockCustomer.id,
      fullName: mockCustomer.fullName,
      email: mockCustomer.email,
      phone: mockCustomer.phone,
    };

    return createSuccessResponse(data);
  },
);

const refreshHandler = http.post(
  `*${AUTH_API_PATH}/refresh`,
  async ({ request }) => {
    const scenarioResponse = await getScenarioResponse(request, [
      mockAuthScenarios.refreshExpired,
      mockAuthScenarios.serverError,
    ]);

    if (scenarioResponse) {
      return scenarioResponse;
    }

    const data: RefreshSuccessData = {
      accessToken: mockAccessToken,
      expiresIn: mockAccessTokenExpiresIn,
    };

    return createSuccessResponse(data);
  },
);

const logoutHandler = http.post(
  `*${AUTH_API_PATH}/logout`,
  async ({ request }) => {
    const scenarioResponse = await getScenarioResponse(request, [
      mockAuthScenarios.serverError,
    ]);

    if (scenarioResponse) {
      return scenarioResponse;
    }

    return createSuccessResponse<Record<string, never>>({});
  },
);

export const authHandlers = [
  loginHandler,
  registerHandler,
  currentCustomerHandler,
  refreshHandler,
  logoutHandler,
];
