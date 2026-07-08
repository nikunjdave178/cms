// Factory data mapping Indian PIN codes to city/state.
// Lookup order: exact 6-digit pin → 3-digit city prefix → 2-digit state prefix.

export const IN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

// First two digits of a PIN → state (postal-circle approximation).
const PIN2_STATE = {
  11: 'Delhi',
  12: 'Haryana', 13: 'Haryana',
  14: 'Punjab', 15: 'Punjab',
  16: 'Chandigarh',
  17: 'Himachal Pradesh',
  18: 'Jammu and Kashmir', 19: 'Jammu and Kashmir',
  20: 'Uttar Pradesh', 21: 'Uttar Pradesh', 22: 'Uttar Pradesh', 23: 'Uttar Pradesh',
  24: 'Uttarakhand', 25: 'Uttar Pradesh', 26: 'Uttar Pradesh', 27: 'Uttar Pradesh',
  28: 'Uttar Pradesh',
  30: 'Rajasthan', 31: 'Rajasthan', 32: 'Rajasthan', 33: 'Rajasthan', 34: 'Rajasthan',
  36: 'Gujarat', 37: 'Gujarat', 38: 'Gujarat', 39: 'Gujarat',
  40: 'Maharashtra', 41: 'Maharashtra', 42: 'Maharashtra', 43: 'Maharashtra', 44: 'Maharashtra',
  45: 'Madhya Pradesh', 46: 'Madhya Pradesh', 47: 'Madhya Pradesh', 48: 'Madhya Pradesh',
  49: 'Chhattisgarh',
  50: 'Telangana',
  51: 'Andhra Pradesh', 52: 'Andhra Pradesh', 53: 'Andhra Pradesh',
  56: 'Karnataka', 57: 'Karnataka', 58: 'Karnataka', 59: 'Karnataka',
  60: 'Tamil Nadu', 61: 'Tamil Nadu', 62: 'Tamil Nadu', 63: 'Tamil Nadu', 64: 'Tamil Nadu',
  67: 'Kerala', 68: 'Kerala', 69: 'Kerala',
  70: 'West Bengal', 71: 'West Bengal', 72: 'West Bengal', 73: 'West Bengal', 74: 'West Bengal',
  75: 'Odisha', 76: 'Odisha', 77: 'Odisha',
  78: 'Assam',
  79: 'Arunachal Pradesh',
  80: 'Bihar', 81: 'Jharkhand', 82: 'Jharkhand', 83: 'Jharkhand', 84: 'Bihar', 85: 'Bihar',
}

// Three-digit overrides where the two-digit circle is shared by another state/UT.
const PIN3_STATE = {
  190: 'Jammu and Kashmir', 194: 'Ladakh',
  246: 'Uttarakhand', 247: 'Uttar Pradesh', 249: 'Uttarakhand', 262: 'Uttarakhand', 263: 'Uttarakhand',
  362: 'Gujarat', 396: 'Dadra and Nagar Haveli and Daman and Diu',
  403: 'Goa',
  605: 'Puducherry',
  682: 'Kerala', 683: 'Kerala',
  737: 'Sikkim', 744: 'Andaman and Nicobar Islands',
  790: 'Arunachal Pradesh', 791: 'Arunachal Pradesh', 792: 'Arunachal Pradesh',
  793: 'Meghalaya', 794: 'Meghalaya', 795: 'Manipur', 796: 'Mizoram',
  797: 'Nagaland', 798: 'Nagaland', 799: 'Tripura',
  811: 'Bihar', 812: 'Bihar', 823: 'Bihar', 824: 'Bihar', 842: 'Bihar', 845: 'Bihar', 846: 'Bihar', 847: 'Bihar', 848: 'Bihar', 852: 'Bihar', 854: 'Bihar', 855: 'Bihar',
}

// Major-city factory data: representative pin + 3-digit prefix used for autofill.
export const CITY_PINCODES = [
  { pin: '110001', prefix: '110', city: 'New Delhi', state: 'Delhi' },
  { pin: '121001', prefix: '121', city: 'Faridabad', state: 'Haryana' },
  { pin: '122001', prefix: '122', city: 'Gurugram', state: 'Haryana' },
  { pin: '124001', prefix: '124', city: 'Rohtak', state: 'Haryana' },
  { pin: '132103', prefix: '132', city: 'Panipat', state: 'Haryana' },
  { pin: '134003', prefix: '134', city: 'Ambala', state: 'Haryana' },
  { pin: '141001', prefix: '141', city: 'Ludhiana', state: 'Punjab' },
  { pin: '143001', prefix: '143', city: 'Amritsar', state: 'Punjab' },
  { pin: '144001', prefix: '144', city: 'Jalandhar', state: 'Punjab' },
  { pin: '147001', prefix: '147', city: 'Patiala', state: 'Punjab' },
  { pin: '160017', prefix: '160', city: 'Chandigarh', state: 'Chandigarh' },
  { pin: '171001', prefix: '171', city: 'Shimla', state: 'Himachal Pradesh' },
  { pin: '180001', prefix: '180', city: 'Jammu', state: 'Jammu and Kashmir' },
  { pin: '190001', prefix: '190', city: 'Srinagar', state: 'Jammu and Kashmir' },
  { pin: '194101', prefix: '194', city: 'Leh', state: 'Ladakh' },
  { pin: '201001', prefix: '201', city: 'Ghaziabad', state: 'Uttar Pradesh' },
  { pin: '201301', city: 'Noida', state: 'Uttar Pradesh' },
  { pin: '202001', prefix: '202', city: 'Aligarh', state: 'Uttar Pradesh' },
  { pin: '208001', prefix: '208', city: 'Kanpur', state: 'Uttar Pradesh' },
  { pin: '211001', prefix: '211', city: 'Prayagraj', state: 'Uttar Pradesh' },
  { pin: '221001', prefix: '221', city: 'Varanasi', state: 'Uttar Pradesh' },
  { pin: '226001', prefix: '226', city: 'Lucknow', state: 'Uttar Pradesh' },
  { pin: '243001', prefix: '243', city: 'Bareilly', state: 'Uttar Pradesh' },
  { pin: '244001', prefix: '244', city: 'Moradabad', state: 'Uttar Pradesh' },
  { pin: '248001', prefix: '248', city: 'Dehradun', state: 'Uttarakhand' },
  { pin: '249401', prefix: '249', city: 'Haridwar', state: 'Uttarakhand' },
  { pin: '250001', prefix: '250', city: 'Meerut', state: 'Uttar Pradesh' },
  { pin: '263001', prefix: '263', city: 'Nainital', state: 'Uttarakhand' },
  { pin: '282001', prefix: '282', city: 'Agra', state: 'Uttar Pradesh' },
  { pin: '284001', prefix: '284', city: 'Jhansi', state: 'Uttar Pradesh' },
  { pin: '302001', prefix: '302', city: 'Jaipur', state: 'Rajasthan' },
  { pin: '305001', prefix: '305', city: 'Ajmer', state: 'Rajasthan' },
  { pin: '313001', prefix: '313', city: 'Udaipur', state: 'Rajasthan' },
  { pin: '324001', prefix: '324', city: 'Kota', state: 'Rajasthan' },
  { pin: '334001', prefix: '334', city: 'Bikaner', state: 'Rajasthan' },
  { pin: '342001', prefix: '342', city: 'Jodhpur', state: 'Rajasthan' },
  { pin: '360001', prefix: '360', city: 'Rajkot', state: 'Gujarat' },
  { pin: '361001', prefix: '361', city: 'Jamnagar', state: 'Gujarat' },
  { pin: '364001', prefix: '364', city: 'Bhavnagar', state: 'Gujarat' },
  { pin: '370001', prefix: '370', city: 'Bhuj', state: 'Gujarat' },
  { pin: '380001', prefix: '380', city: 'Ahmedabad', state: 'Gujarat' },
  { pin: '382010', prefix: '382', city: 'Gandhinagar', state: 'Gujarat' },
  { pin: '390001', prefix: '390', city: 'Vadodara', state: 'Gujarat' },
  { pin: '395001', prefix: '395', city: 'Surat', state: 'Gujarat' },
  { pin: '400001', prefix: '400', city: 'Mumbai', state: 'Maharashtra' },
  { pin: '400601', city: 'Thane', state: 'Maharashtra' },
  { pin: '400701', city: 'Navi Mumbai', state: 'Maharashtra' },
  { pin: '403001', prefix: '403', city: 'Panaji', state: 'Goa' },
  { pin: '411001', prefix: '411', city: 'Pune', state: 'Maharashtra' },
  { pin: '414001', prefix: '414', city: 'Ahmednagar', state: 'Maharashtra' },
  { pin: '416001', prefix: '416', city: 'Kolhapur', state: 'Maharashtra' },
  { pin: '422001', prefix: '422', city: 'Nashik', state: 'Maharashtra' },
  { pin: '425001', prefix: '425', city: 'Jalgaon', state: 'Maharashtra' },
  { pin: '431001', prefix: '431', city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' },
  { pin: '440001', prefix: '440', city: 'Nagpur', state: 'Maharashtra' },
  { pin: '444001', prefix: '444', city: 'Akola', state: 'Maharashtra' },
  { pin: '452001', prefix: '452', city: 'Indore', state: 'Madhya Pradesh' },
  { pin: '456001', prefix: '456', city: 'Ujjain', state: 'Madhya Pradesh' },
  { pin: '462001', prefix: '462', city: 'Bhopal', state: 'Madhya Pradesh' },
  { pin: '474001', prefix: '474', city: 'Gwalior', state: 'Madhya Pradesh' },
  { pin: '482001', prefix: '482', city: 'Jabalpur', state: 'Madhya Pradesh' },
  { pin: '490001', prefix: '490', city: 'Bhilai', state: 'Chhattisgarh' },
  { pin: '492001', prefix: '492', city: 'Raipur', state: 'Chhattisgarh' },
  { pin: '495001', prefix: '495', city: 'Bilaspur', state: 'Chhattisgarh' },
  { pin: '500001', prefix: '500', city: 'Hyderabad', state: 'Telangana' },
  { pin: '506002', prefix: '506', city: 'Warangal', state: 'Telangana' },
  { pin: '515001', prefix: '515', city: 'Anantapur', state: 'Andhra Pradesh' },
  { pin: '517501', prefix: '517', city: 'Tirupati', state: 'Andhra Pradesh' },
  { pin: '520001', prefix: '520', city: 'Vijayawada', state: 'Andhra Pradesh' },
  { pin: '522001', prefix: '522', city: 'Guntur', state: 'Andhra Pradesh' },
  { pin: '524001', prefix: '524', city: 'Nellore', state: 'Andhra Pradesh' },
  { pin: '530001', prefix: '530', city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { pin: '533101', prefix: '533', city: 'Rajahmundry', state: 'Andhra Pradesh' },
  { pin: '560001', prefix: '560', city: 'Bengaluru', state: 'Karnataka' },
  { pin: '570001', prefix: '570', city: 'Mysuru', state: 'Karnataka' },
  { pin: '575001', prefix: '575', city: 'Mangaluru', state: 'Karnataka' },
  { pin: '580020', prefix: '580', city: 'Hubballi', state: 'Karnataka' },
  { pin: '590001', prefix: '590', city: 'Belagavi', state: 'Karnataka' },
  { pin: '600001', prefix: '600', city: 'Chennai', state: 'Tamil Nadu' },
  { pin: '605001', prefix: '605', city: 'Puducherry', state: 'Puducherry' },
  { pin: '620001', prefix: '620', city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  { pin: '625001', prefix: '625', city: 'Madurai', state: 'Tamil Nadu' },
  { pin: '627001', prefix: '627', city: 'Tirunelveli', state: 'Tamil Nadu' },
  { pin: '636001', prefix: '636', city: 'Salem', state: 'Tamil Nadu' },
  { pin: '641001', prefix: '641', city: 'Coimbatore', state: 'Tamil Nadu' },
  { pin: '670001', prefix: '670', city: 'Kannur', state: 'Kerala' },
  { pin: '673001', prefix: '673', city: 'Kozhikode', state: 'Kerala' },
  { pin: '676505', prefix: '676', city: 'Malappuram', state: 'Kerala' },
  { pin: '680001', prefix: '680', city: 'Thrissur', state: 'Kerala' },
  { pin: '682001', prefix: '682', city: 'Kochi', state: 'Kerala' },
  { pin: '686001', prefix: '686', city: 'Kottayam', state: 'Kerala' },
  { pin: '688001', prefix: '688', city: 'Alappuzha', state: 'Kerala' },
  { pin: '691001', prefix: '691', city: 'Kollam', state: 'Kerala' },
  { pin: '695001', prefix: '695', city: 'Thiruvananthapuram', state: 'Kerala' },
  { pin: '700001', prefix: '700', city: 'Kolkata', state: 'West Bengal' },
  { pin: '711101', prefix: '711', city: 'Howrah', state: 'West Bengal' },
  { pin: '713201', prefix: '713', city: 'Durgapur', state: 'West Bengal' },
  { pin: '734001', prefix: '734', city: 'Siliguri', state: 'West Bengal' },
  { pin: '737101', prefix: '737', city: 'Gangtok', state: 'Sikkim' },
  { pin: '744101', prefix: '744', city: 'Port Blair', state: 'Andaman and Nicobar Islands' },
  { pin: '751001', prefix: '751', city: 'Bhubaneswar', state: 'Odisha' },
  { pin: '753001', prefix: '753', city: 'Cuttack', state: 'Odisha' },
  { pin: '769001', prefix: '769', city: 'Rourkela', state: 'Odisha' },
  { pin: '781001', prefix: '781', city: 'Guwahati', state: 'Assam' },
  { pin: '786001', prefix: '786', city: 'Dibrugarh', state: 'Assam' },
  { pin: '791111', prefix: '791', city: 'Itanagar', state: 'Arunachal Pradesh' },
  { pin: '793001', prefix: '793', city: 'Shillong', state: 'Meghalaya' },
  { pin: '795001', prefix: '795', city: 'Imphal', state: 'Manipur' },
  { pin: '796001', prefix: '796', city: 'Aizawl', state: 'Mizoram' },
  { pin: '797001', prefix: '797', city: 'Kohima', state: 'Nagaland' },
  { pin: '799001', prefix: '799', city: 'Agartala', state: 'Tripura' },
  { pin: '800001', prefix: '800', city: 'Patna', state: 'Bihar' },
  { pin: '812001', prefix: '812', city: 'Bhagalpur', state: 'Bihar' },
  { pin: '823001', prefix: '823', city: 'Gaya', state: 'Bihar' },
  { pin: '826001', prefix: '826', city: 'Dhanbad', state: 'Jharkhand' },
  { pin: '827001', prefix: '827', city: 'Bokaro Steel City', state: 'Jharkhand' },
  { pin: '831001', prefix: '831', city: 'Jamshedpur', state: 'Jharkhand' },
  { pin: '834001', prefix: '834', city: 'Ranchi', state: 'Jharkhand' },
  { pin: '842001', prefix: '842', city: 'Muzaffarpur', state: 'Bihar' },
]

const byExactPin = new Map(CITY_PINCODES.map(e => [e.pin, e]))
const byPrefix3 = new Map(CITY_PINCODES.filter(e => e.prefix).map(e => [e.prefix, e]))

// Unique city list (for the city dropdown/datalist), alphabetical.
export const IN_CITIES = [...new Map(CITY_PINCODES.map(e => [e.city, e])).values()]
  .sort((a, b) => a.city.localeCompare(b.city))

/**
 * Resolve a (partial) PIN to { city, state }. City needs >= 3 digits,
 * state falls back to the 2-digit postal circle. Returns {} when unknown.
 */
export function lookupPincode(pin) {
  const p = (pin ?? '').trim()
  if (!/^\d{2,6}$/.test(p)) return {}

  const exact = p.length === 6 ? byExactPin.get(p) : null
  if (exact) return { city: exact.city, state: exact.state }

  const viaPrefix = p.length >= 3 ? byPrefix3.get(p.slice(0, 3)) : null
  if (viaPrefix) return { city: viaPrefix.city, state: viaPrefix.state }

  const state = (p.length >= 3 && PIN3_STATE[p.slice(0, 3)]) || PIN2_STATE[p.slice(0, 2)]
  return state ? { state } : {}
}

/** Find factory data for a city name (case-insensitive) → { city, state, pin } */
export function lookupCity(name) {
  const n = (name ?? '').trim().toLowerCase()
  if (!n) return null
  return CITY_PINCODES.find(e => e.city.toLowerCase() === n) ?? null
}
