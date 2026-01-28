/**
 * Clean RUT - Remove formatting
 * @param {string} rut - Formatted RUT
 * @returns {string} Clean RUT without dots or dash
 */
export function cleanRut(rut) {
  if (!rut) return '';
  return String(rut).replace(/\./g, '').replace(/-/g, '');
}

/**
 * Format RUT - Add dots and dash
 * @param {string} value - RUT value
 * @returns {string} Formatted RUT
 */
export function formatRut(value) {
  if (!value) return '';

  // Remove all non-alphanumeric characters
  const clean = String(value).replace(/[^0-9kK]/g, '');

  if (clean.length === 0) return '';

  // Separate body and verifier digit
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();

  if (body.length === 0) return dv;

  // Add dots to body
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formatted}-${dv}`;
}

/**
 * Validate Chilean RUT
 * @param {string} rut - RUT to validate
 * @returns {boolean} True if valid
 */
export function validateRut(rut) {
  if (!rut || rut.trim() === '') return false;

  // Clean RUT
  const clean = cleanRut(rut);

  // Extract body and verifier digit
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();

  // Validate format
  if (!/^\d+$/.test(body)) return false;
  if (!/^[0-9kK]$/.test(dv)) return false;

  // Calculate verifier digit
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

  return dv === calculatedDv;
}
