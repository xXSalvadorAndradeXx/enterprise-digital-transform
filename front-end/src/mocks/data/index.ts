/** Datos reutilizables por los handlers de MSW y las pruebas. */
export {
  createMockCustomer,
  mockAccessToken,
  mockAccessTokenExpiresIn,
  mockCustomer,
  mockDuplicateRegistration,
  mockLoginCredentials,
} from "./auth.data";
export {
  mockAuthDelays,
  mockAuthErrors,
  mockAuthScenarios,
} from "./auth-scenarios.data";
export type {
  MockAuthErrorFixture,
  MockAuthScenario,
} from "./auth-scenarios.data";
export {
  mockDepartments,
  mockDistricts,
} from "./locations.data";
