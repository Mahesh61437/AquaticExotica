// List of Indian states and union territories for address selection
export const indianStates = [
  { name: "Andhra Pradesh", code: "AP" },
  { name: "Arunachal Pradesh", code: "AR" },
  { name: "Assam", code: "AS" },
  { name: "Bihar", code: "BR" },
  { name: "Chhattisgarh", code: "CG" },
  { name: "Goa", code: "GA" },
  { name: "Gujarat", code: "GJ" },
  { name: "Haryana", code: "HR" },
  { name: "Himachal Pradesh", code: "HP" },
  { name: "Jharkhand", code: "JH" },
  { name: "Karnataka", code: "KA" },
  { name: "Kerala", code: "KL" },
  { name: "Madhya Pradesh", code: "MP" },
  { name: "Maharashtra", code: "MH" },
  { name: "Manipur", code: "MN" },
  { name: "Meghalaya", code: "ML" },
  { name: "Mizoram", code: "MZ" },
  { name: "Nagaland", code: "NL" },
  { name: "Odisha", code: "OD" },
  { name: "Punjab", code: "PB" },
  { name: "Rajasthan", code: "RJ" },
  { name: "Sikkim", code: "SK" },
  { name: "Tamil Nadu", code: "TN" },
  { name: "Telangana", code: "TG" },
  { name: "Tripura", code: "TR" },
  { name: "Uttar Pradesh", code: "UP" },
  { name: "Uttarakhand", code: "UK" },
  { name: "West Bengal", code: "WB" },
  // Union Territories
  { name: "Andaman and Nicobar Islands", code: "AN" },
  { name: "Chandigarh", code: "CH" },
  { name: "Dadra and Nagar Haveli and Daman and Diu", code: "DN" },
  { name: "Delhi", code: "DL" },
  { name: "Jammu and Kashmir", code: "JK" },
  { name: "Ladakh", code: "LA" },
  { name: "Lakshadweep", code: "LD" },
  { name: "Puducherry", code: "PY" }
];

// Major cities across India
export const majorIndianCities = [
  // Andhra Pradesh
  { name: "Visakhapatnam", state: "AP" },
  { name: "Vijayawada", state: "AP" },
  { name: "Guntur", state: "AP" },
  
  // Gujarat
  { name: "Ahmedabad", state: "GJ" },
  { name: "Surat", state: "GJ" },
  { name: "Vadodara", state: "GJ" },
  
  // Karnataka
  { name: "Bengaluru", state: "KA" },
  { name: "Mysuru", state: "KA" },
  { name: "Hubli", state: "KA" },
  
  // Maharashtra
  { name: "Mumbai", state: "MH" },
  { name: "Pune", state: "MH" },
  { name: "Nagpur", state: "MH" },
  
  // Delhi
  { name: "New Delhi", state: "DL" },
  { name: "Delhi", state: "DL" },
  
  // Telangana
  { name: "Hyderabad", state: "TG" },
  { name: "Warangal", state: "TG" },
  
  // Tamil Nadu
  { name: "Chennai", state: "TN" },
  { name: "Coimbatore", state: "TN" },
  { name: "Madurai", state: "TN" },
  
  // West Bengal
  { name: "Kolkata", state: "WB" },
  { name: "Howrah", state: "WB" },
  
  // Uttar Pradesh
  { name: "Lucknow", state: "UP" },
  { name: "Kanpur", state: "UP" },
  { name: "Varanasi", state: "UP" },
  { name: "Agra", state: "UP" },
  
  // Punjab
  { name: "Chandigarh", state: "CH" },
  { name: "Amritsar", state: "PB" },
  { name: "Ludhiana", state: "PB" },
  
  // Rajasthan
  { name: "Jaipur", state: "RJ" },
  { name: "Jodhpur", state: "RJ" },
  { name: "Udaipur", state: "RJ" }
];

// Helper function to get cities for a specific state
export function getCitiesByState(stateCode: string) {
  return majorIndianCities.filter(city => city.state === stateCode);
}

// Standard Indian PIN code validation
export function validatePinCode(pinCode: string): boolean {
  const pinCodePattern = /^[1-9][0-9]{5}$/;
  return pinCodePattern.test(pinCode);
}

// Standard GST Number validation for India
export function validateGST(gstNumber: string): boolean {
  const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstPattern.test(gstNumber);
}

// Standard Indian phone number validation (10 digits)
export function validateIndianPhone(phone: string): boolean {
  const phonePattern = /^[6-9][0-9]{9}$/;
  return phonePattern.test(phone);
}