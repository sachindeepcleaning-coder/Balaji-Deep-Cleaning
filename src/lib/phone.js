// Phone normalisation for the Balaji Deep Cleaning lead forms.
//
// THE BUG THIS FIXES (owner priority: never lose a lead):
// the quote form used to cut the input at 10 digits and then validate the RAW
// value, so
//   "09873915215"     -> truncated to "0987391521" -> regex failed -> the
//                         lead was dropped BEFORE sendLead ever ran
//                         (no email, no Sheet, no lead),
//   "+91 98739-15215" -> digits "919873915215" -> cut to "9198739152" ->
//                         the regex PASSED -> the lead gateway accepted it
//                         and the owner was emailed a WRONG number.
// The other two forms (LeadForm, MultiStepForm) used the browser
// `pattern="[0-9+ ]{8,15}"`, which refuses a hyphenated number
// ("98739-15215") outright — the visitor could not submit at all.
// Now every form keeps the number as typed, normalises it ONCE at submit
// time, and the canonical 10 digits are what the lead gateway, the Sheet
// and the owner get.
//
// Pure module (no imports) so it can be unit-tested with `node --test`.
// Test: tests/phone.test.mjs

// The lead gateway validates this exact pattern
// (email/worker/worker.js: /^[6-9][0-9]{9}$/).
export const PHONE_PATTERN = /^[6-9][0-9]{9}$/;

// Canonicalise an Indian mobile number typed by a visitor:
//   "9873915215"      -> "9873915215"
//   "09873915215"     -> "9873915215"   (leading 0)
//   "919873915215"    -> "9873915215"   (+91 country code)
//   "+91 98739-15215" -> "9873915215"
//   "98739 15215"     -> "9873915215"
//   "9109873915215"   -> "9873915215"   (+91 AND a leading 0)
// Anything else is returned as digits only and will fail isValidPhone().
export function normalizePhone(value) {
  let d = String(value === null || value === undefined ? '' : value).replace(/\D/g, '');
  // "+91" country code, with or without a leading 0 in the national number
  // (a 12-digit "+91 + 10 digits" and a 13-digit "+91 + 0 + 10 digits").
  if ((d.length === 12 || d.length === 13) && d.indexOf('91') === 0) d = d.slice(2);
  // national number written with a leading 0
  if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
  return d;
}

// True only for a canonical 10-digit Indian mobile number.
// Normalising first makes it safe to call with the raw field value.
export function isValidPhone(value) {
  return PHONE_PATTERN.test(normalizePhone(value));
}
