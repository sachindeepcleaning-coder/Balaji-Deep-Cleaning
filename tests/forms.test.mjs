// The other two lead forms — LeadForm and MultiStepForm.
//
// The bug these tests pin down: both used the browser attribute
// `pattern="[0-9+ ]{8,15}"`. The browser runs that check BEFORE the submit
// event, so a visitor who typed "98739-15215" could not submit AT ALL —
// the form was refused and the lead was silently lost. Neither form
// validated the number in JS, so nothing else caught it.
//
// The fix: no browser pattern (the number is accepted in any shape), the
// value is normalised ONCE at submit, the canonical 10 digits are sent, and
// a refused submit moves the focus back into the form and tells click-guard
// to undo the conversion it latched.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { PHONE_PATTERN, normalizePhone } from '../src/lib/phone.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(resolve(ROOT, rel), 'utf8');

const FORMS = ['src/components/LeadForm.jsx', 'src/components/MultiStepForm.jsx'];

test('the old browser pattern really did refuse a hyphenated number', () => {
  // The pattern the forms used, as the browser applies it (the value has to
  // match it in full). This is the bug, pinned so the reason for the change
  // stays visible in the repo.
  const old = /^[0-9+ ]{8,15}$/;
  assert.equal(old.test('98739-15215'), false, 'the old pattern refused a hyphenated number');
  assert.equal(old.test('+91 98739-15215'), false, 'the old pattern refused a +91 hyphenated number');
  assert.equal(old.test('+91 9873915215'), true, 'the old pattern accepted a spaced +91 number');
  // ...but the gateway refused THAT one, so the lead only survived through
  // the Web3Forms fallback, with a non-canonical number.
  assert.equal(PHONE_PATTERN.test('+91 9873915215'), false, 'the gateway rejects a raw +91 number');
  assert.equal(PHONE_PATTERN.test(normalizePhone('+91 9873915215')), true, 'normalising fixes it');
});

for (const file of FORMS) {
  test(`${file}: no browser pattern can refuse a typed number`, () => {
    const src = read(file);
    assert.ok(
      !/pattern\s*=/.test(src),
      'the phone input must not carry a browser pattern attribute'
    );
    assert.ok(
      !/maxLength="10"/.test(src),
      'the number must never be cut at 10 digits'
    );
  });

  test(`${file}: normalises the number and sends the canonical 10 digits`, () => {
    const src = read(file);
    assert.ok(src.includes('normalizePhone'), 'the form must normalise the phone');
    assert.ok(src.includes('isValidPhone'), 'the form must validate the normalised phone');
    assert.ok(
      /phone: leadPhone/.test(src),
      'sendLead must receive the normalised number'
    );
    assert.ok(
      /const leadPhone = normalizePhone\(/.test(src),
      'the number must be normalised exactly once, at submit'
    );
  });

  test(`${file}: a refused submit undoes the conversion and moves the focus back`, () => {
    const src = read(file);
    assert.ok(
      /from '\.\.\/lib\/form-reject\.js'/.test(src),
      'the form must use the shared rejection helpers'
    );
    assert.ok(src.includes('notifyRejected'), 'the rejection hook must be called');
    assert.ok(src.includes('focusField'), 'the focus must move back into the form');
    // the failure path of sendLead must call the hook
    const failureBlock = src.slice(src.indexOf("Couldn't send your request"));
    assert.ok(
      /notifyRejected\(\)/.test(failureBlock),
      'a failed send must tell click-guard that no lead exists'
    );
  });
}

test('LeadForm moves the focus straight back to the phone field on a failed send', () => {
  const src = read('src/components/LeadForm.jsx');
  const failureBlock = src.slice(src.indexOf("Couldn't send your request"));
  assert.ok(
    /focusField\(phoneRef\.current\)/.test(failureBlock),
    'a failed send must move the focus back into the form'
  );
});

test('MultiStepForm moves the focus back to step 0 on a failed send', () => {
  const src = read('src/components/MultiStepForm.jsx');
  const failureBlock = src.slice(src.indexOf("Couldn't send your request"));
  assert.ok(
    /setFocusPhone\(true\)/.test(failureBlock),
    'a failed send must go back to the details step and focus the phone'
  );
  assert.ok(
    /focusField\(phoneRef\.current\)/.test(src),
    'the focus effect must actually move the focus'
  );
});

test('LeadForm still validates the name (the gateway rejects a short name)', () => {
  const src = read('src/components/LeadForm.jsx');
  assert.ok(src.includes('leadName.length < 2'), 'the name must be checked before sending');
  assert.ok(/name: leadName/.test(src), 'the trimmed name must be sent');
});

test('MultiStepForm keeps its draft, redirect and tracking behaviour', () => {
  const src = read('src/components/MultiStepForm.jsx');
  assert.ok(src.includes("const STORAGE_KEY = 'sdc_lead'"), 'the draft key must not change');
  assert.ok(src.includes("window.location.href = '/thank-you.html'"), 'the redirect must stay');
  assert.ok(src.includes("track('generate_lead'"), 'the tracking call must stay');
  assert.ok(src.includes('localStorage.removeItem'), 'the draft must be cleared on success');
  assert.ok(src.includes('setStep(0)'), 'a refused submit must go back to the details step');
});
