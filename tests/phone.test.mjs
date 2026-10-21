// Phone normalisation tests — the "never lose a lead" guard.
//
// Run:  npm test        (node --test "tests/*.test.mjs")
//   or: node --test tests/phone.test.mjs
//
// The bug these tests pin down: the quote form used to cut the input at 10
// digits and then validate the RAW value, so
//   "09873915215"     -> "0987391521"  -> invalid -> THE LEAD WAS DROPPED
//                         before sendLead ever ran (no email, no Sheet),
//   "+91 98739-15215" -> "9198739152"  -> valid-looking -> the owner was
//                         emailed a WRONG number, silently.
// The other two forms (LeadForm, MultiStepForm) used the browser
// `pattern="[0-9+ ]{8,15}"`, which refused a hyphenated number outright.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { normalizePhone, isValidPhone, PHONE_PATTERN } from '../src/lib/phone.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(resolve(ROOT, rel), 'utf8');

test('normalizePhone canonicalises every way a visitor types a number', () => {
  const expected = '9873915215';
  const inputs = [
    '9873915215',
    '09873915215',
    '919873915215',
    '+91 98739-15215',
    '98739 15215',
    '+91-98739-15215',
    '9109873915215',   // "+91" AND a leading 0
    '+91 09873915215',
  ];
  for (const input of inputs) {
    assert.equal(normalizePhone(input), expected, `normalizePhone(${JSON.stringify(input)})`);
  }
});

test('normalizePhone is idempotent', () => {
  for (const input of ['9873915215', '09873915215', '919873915215', '+91 98739-15215']) {
    const once = normalizePhone(input);
    assert.equal(normalizePhone(once), once, `not idempotent for ${JSON.stringify(input)}`);
  }
});

test('normalizePhone keeps anything it cannot canonicalise (digits only)', () => {
  assert.equal(normalizePhone(''), '');
  assert.equal(normalizePhone('abc'), '');
  assert.equal(normalizePhone(null), '');
  assert.equal(normalizePhone(undefined), '');
  assert.equal(normalizePhone('12345'), '12345');
  assert.equal(normalizePhone('919873915215432'), '919873915215432');
});

test('isValidPhone accepts only a canonical 10-digit Indian mobile', () => {
  assert.equal(isValidPhone('9873915215'), true);
  assert.equal(isValidPhone('09873915215'), true);
  assert.equal(isValidPhone('+91 98739-15215'), true);
  assert.equal(isValidPhone(''), false);
  assert.equal(isValidPhone('abc'), false);
  assert.equal(isValidPhone('1234567890'), false); // does not start with 6-9
  assert.equal(isValidPhone('987391521'), false);  // 9 digits
  assert.equal(isValidPhone('98739152155'), false); // 11 digits
});

test('the pattern is the one the lead gateway enforces', () => {
  assert.equal(PHONE_PATTERN.source, '^[6-9][0-9]{9}$');
  assert.equal(PHONE_PATTERN.test('9873915215'), true);
  assert.equal(PHONE_PATTERN.test('09873915215'), false);
});

test('every accepted input survives the whole path to the gateway', () => {
  // What the form does at submit time: normalise, validate, send. The
  // gateway then runs its own /^[6-9][0-9]{9}$/ check on the number it
  // receives — so the number the form sends must pass it.
  const inputs = [
    '9873915215',
    '09873915215',
    '919873915215',
    '+91 98739-15215',
    '98739-15215',
    '98739 15215',
    '9109873915215',
  ];
  for (const input of inputs) {
    const canonical = normalizePhone(input);
    assert.equal(isValidPhone(canonical), true, `rejected ${JSON.stringify(input)}`);
    assert.equal(PHONE_PATTERN.test(canonical), true, `gateway would reject ${JSON.stringify(input)}`);
    assert.equal(canonical.length, 10, `not 10 digits for ${JSON.stringify(input)}`);
  }
});

// ---- Regression guard on the forms themselves --------------------------
// A future edit that puts the 10-digit cut or the browser `pattern` back
// would silently start losing leads again, so the sources are pinned here.

test('QuoteForm keeps 13 digits and never truncates to 10', () => {
  const src = read('src/components/QuoteForm.jsx');
  assert.ok(src.includes('maxLength="13"'), 'phone input must accept 13 digits');
  assert.ok(src.includes('slice(0, 13)'), 'onChange must keep 13 digits');
  assert.ok(!src.includes('slice(0, 10)'), 'the 10-digit truncation must be gone');
  assert.ok(!src.includes('maxLength="10"'), 'the 10-digit maxLength must be gone');
});

test('QuoteForm validates and sends the NORMALISED number', () => {
  const src = read('src/components/QuoteForm.jsx');
  assert.ok(src.includes('normalizePhone'), 'the form must normalise the phone');
  assert.ok(src.includes('isValidPhone'), 'the form must validate the normalised phone');
  assert.ok(
    /const p = normalizePhone\(phone\)/.test(src),
    'the number sent to sendLead must be the normalised one'
  );
  assert.ok(
    /sendLead\(\{ name: n, phone: p,/.test(src),
    'sendLead must receive the normalised number'
  );
  assert.ok(
    !/\/\^\[6-9\]\[0-9\]\{9\}\$\/\.test\(p\)/.test(src),
    'the raw-value regex test must be gone'
  );
  assert.ok(
    /normalizePhone\(phone\)/.test(src) && src.includes('+91{normalizePhone(phone)}'),
    'the success message must show the normalised number'
  );
});

test('QuoteForm tells click-guard when the site refused the submit', () => {
  const src = read('src/components/QuoteForm.jsx');
  assert.ok(src.includes('notifyRejected'), 'the rejection hook must be called');
  assert.ok(src.includes('focusField'), 'the focus must move back into the form');
  assert.ok(
    /from '\.\.\/lib\/form-reject\.js'/.test(src),
    'the form must use the shared rejection helpers'
  );
});

test('the shared rejection helpers blur before focusing and call the beacon hook', () => {
  const src = read('src/lib/form-reject.js');
  // focus() on the already-focused element fires no focusin event, and that
  // event is exactly how the click-guard beacon v12 tells a refused submit
  // from a good one — so the blur() is load-bearing.
  assert.ok(/document\.activeElement === el\) el\.blur\(\)/.test(src), 'focusField must blur first');
  assert.ok(src.includes('cgFormRejected'), 'the beacon rejection hook must be called');
  assert.ok(
    /typeof window\.cgFormRejected === 'function'/.test(src),
    'the hook must be guarded so it is a no-op until the beacon grows it'
  );
});

test('sendLead canonicalises the number it sends', () => {
  const src = read('src/lib/sendLead.js');
  assert.ok(src.includes('normalizePhone'), 'sendLead must normalise the phone');
  assert.ok(src.includes('phone: leadPhone'), 'both payloads must carry the normalised phone');
  assert.ok(!/phone: phone \|\| ''/.test(src), 'the raw phone must never be sent');
  assert.ok(
    /delete restFields\.phone/.test(src),
    'a stray field must not overwrite the normalised number in the Web3Forms payload'
  );
});

// ---- The one canonical normalisation matrix (shared by all three .shop
// sites) ---------------------------------------------------------------
// A known prefix is stripped ONLY when exactly 10 digits remain. Anything
// we do not recognise is left untouched, so it fails validation loudly
// instead of silently becoming a different — valid, wrong — number.

test('every known prefix resolves to the same canonical 10 digits', () => {
  const expected = '9873915215';
  for (const input of [
    '9873915215',
    '09873915215',
    '919873915215',
    '+91 98739-15215',
    '98739 15215',
    '091 98739 15215',
    '9109873915215',
    '0091 98739 15215',
    '00919873915215',
  ]) {
    assert.equal(normalizePhone(input), expected, `normalizePhone(${JSON.stringify(input)})`);
    assert.equal(isValidPhone(input), true, `isValidPhone(${JSON.stringify(input)})`);
  }
});

test('an unrecognised number is left untouched, never reshaped', () => {
  for (const input of ['9198765432109', '9876543210987', '919873915215432', '12345', '98739152155']) {
    assert.equal(normalizePhone(input), input, `normalizePhone(${JSON.stringify(input)})`);
    assert.equal(isValidPhone(input), false, `isValidPhone(${JSON.stringify(input)})`);
  }
});

test('normalisation is idempotent', () => {
  assert.equal(normalizePhone(normalizePhone('00919873915215')), '9873915215');
  assert.equal(normalizePhone(normalizePhone('9198765432109')), '9198765432109');
  assert.equal(normalizePhone(normalizePhone('09873915215')), '9873915215');
});
