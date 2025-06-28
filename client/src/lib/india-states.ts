// DEPRECATED: Use india-states-cities.ts for all state/city data and utilities
export { getAllStates as indianStates, getCitiesByState, autocompleteCity } from "./india-states-cities";

// Re-export validators for compatibility
export function validatePinCode(pinCode: string): boolean {
  const pinCodePattern = /^[1-9][0-9]{5}$/;
  return pinCodePattern.test(pinCode);
}

export function validateIndianPhone(phone: string): boolean {
  const phonePattern = /^[6-9][0-9]{9}$/;
  return phonePattern.test(phone);
}

// Standard GST Number validation for India
export function validateGST(gstNumber: string): boolean {
  const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstPattern.test(gstNumber);
}