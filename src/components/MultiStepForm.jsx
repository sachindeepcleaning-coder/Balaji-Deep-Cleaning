import { useState, useEffect, useRef } from 'react';
import { PHONE, waMsg } from '../lib/site.js';
import { sendLead } from '../lib/sendLead.js';
import { track, whatsappClick } from '../lib/landing.js';
import { normalizePhone, isValidPhone } from '../lib/phone.js';
import { focusField, notifyRejected } from '../lib/form-reject.js';

const STEPS = [{ title: 'Your Details' }, { title: 'Service' }, { title: 'Schedule' }];
const STORAGE_KEY = 'sdc_lead';

// Multi-step quote form: progress bar, localStorage draft, Web3Forms submit.
export default function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: '', phone: '', service: '', date: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [focusPhone, setFocusPhone] = useState(false);
  const nameRef = useRef(null);
  const phoneRef = useRef(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setData((d) => ({ ...d, ...JSON.parse(s) }));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  // The phone field only exists on step 0, so the focus has to be moved
  // AFTER the step that holds it is on screen again.
  useEffect(() => {
    if (!focusPhone) return;
    focusField(phoneRef.current);
    setFocusPhone(false);
  }, [focusPhone]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  // Validate the details before the visitor leaves step 0. The number is
  // normalised first, so "+91 98739-15215" and "09873915215" are accepted;
  // the browser's old numeric pattern attribute (digits, a plus and a
  // space, 8-15 chars) refused a hyphenated number outright and the lead
  // was lost.
  const detailsError = () => {
    const n = String(data.name || '').trim();
    if (n.length < 2) {
      setError('❌ Please enter your full name.');
      focusField(nameRef.current);
      return true;
    }
    if (!isValidPhone(normalizePhone(data.phone))) {
      setError('❌ Enter a valid 10-digit mobile number (it starts with 6-9).');
      focusField(phoneRef.current);
      return true;
    }
    return false;
  };

  const next = () => {
    if (step === 0) {
      // No submit happened yet, so nothing was latched as a conversion —
      // the focus jump is just for the visitor, not a rejection signal.
      if (detailsError()) return;
      setError('');
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    const leadName = String(data.name || '').trim();
    // Normalise ONCE, at submit — never while typing.
    const leadPhone = normalizePhone(data.phone);
    if (leadName.length < 2 || !isValidPhone(leadPhone)) {
      setStatus('idle');
      // The site refused the submit: the focus goes back to the field that
      // has to be fixed (step 0 holds it) and click-guard is told, so the
      // conversion it latched is undone — no lead exists, so there must be
      // no owner alert email and no CRM card.
      setStep(0);
      setFocusPhone(true);
      setError(leadName.length < 2
        ? '❌ Please enter your full name.'
        : '❌ Enter a valid 10-digit mobile number (it starts with 6-9).');
      notifyRejected();
      return;
    }
    const ok = await sendLead({
      name: leadName,
      phone: leadPhone,
      source: 'Multi-Step Form',
      fields: { service: data.service, date: data.date, message: data.message },
    });
    if (ok) {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      track('generate_lead', { event_category: 'Lead', event_label: 'Multi-Step Form' });
      window.setTimeout(() => { window.location.href = '/thank-you.html'; }, 250);
      return;
    }
    setStatus('idle');
    setError(`❌ Couldn't send your request. Please call ${PHONE} or`);
    // The send failed, so no lead exists on the site either — click-guard
    // must not count this as a conversion.
    notifyRejected();
    setStep(0);
    setFocusPhone(true);
  };

  return (
    <form className="multistep" onSubmit={submit}>
      <div className="steps-bar">
        {STEPS.map((s, i) => (
          <div key={i} className={`bar${i <= step ? ' done' : ''}`} />
        ))}
      </div>
      <p className="text-muted" style={{ marginBottom: 16 }}>
        Step {step + 1} of {STEPS.length}: {STEPS[step].title}
      </p>

      {step === 0 && (
        <>
          <label>Your Name *</label>
          <input value={data.name} onChange={(e) => set('name', e.target.value)} required ref={nameRef} />
          <label>Phone *</label>
          {/* No browser pattern attribute: the old one (digits, a plus and a
              space, 8-15 chars) refused a hyphenated number before the
              visitor could submit, so the lead was lost. The number is
              validated in JS (normalised first) instead. */}
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => set('phone', e.target.value)}
            required
            ref={phoneRef}
          />
        </>
      )}
      {step === 1 && (
        <>
          <label>Service Needed</label>
          <input value={data.service} onChange={(e) => set('service', e.target.value)} placeholder="e.g. 2 BHK deep cleaning" />
          <label>Message</label>
          <textarea rows="3" value={data.message} onChange={(e) => set('message', e.target.value)} />
        </>
      )}
      {step === 2 && (
        <>
          <label>Preferred Date</label>
          <input type="date" value={data.date} onChange={(e) => set('date', e.target.value)} />
          <p className="lead-note">We’ll confirm the exact time by phone.</p>
        </>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        {step > 0 && (
          <button type="button" className="btn btn-outline" onClick={prev}>
            Back
          </button>
        )}
        {step < STEPS.length - 1 && (
          <button type="button" className="btn btn-primary" onClick={next}>
            Next
          </button>
        )}
        {step === STEPS.length - 1 && (
          <button type="submit" className="btn btn-secondary" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Submit'}
          </button>
        )}
      </div>
      {error && (
        <p className="form-error">
          {error}{' '}
          <a href={waMsg('Hi, my booking request on your website did not go through. Please call me back.')} target="_blank" rel="noopener" onClick={whatsappClick}>
            WhatsApp us →
          </a>
        </p>
      )}
    </form>
  );
}
