/**
 * Valida si un departamento y un distrito tienen IDs válidos.
 * Realiza una comprobación de formato y asegura que no estén vacíos.
 */
export function validateDepartmentDistrict(departmentId: string, districtId: string): boolean {
  if (!departmentId || !districtId) {
    return false;
  }
  
  // Expresión regular para validar formato alfanumérico con guiones y guiones bajos
  const formatoValido = /^[a-zA-Z0-9\-_]+$/;
  return formatoValido.test(departmentId) && formatoValido.test(districtId);
}
