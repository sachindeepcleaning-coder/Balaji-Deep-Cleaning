import { useState, useRef } from 'react';
import { PHONE, waMsg } from '../lib/site.js';
import { sendLead } from '../lib/sendLead.js';
import { track, whatsappClick } from '../lib/landing.js';
import { normalizePhone, isValidPhone } from '../lib/phone.js';
import { focusField, notifyRejected } from '../lib/form-reject.js';

// Simple lead form posting to Web3Forms, then redirecting to thank-you.html.
export default function LeadForm({ formName = 'lead', source = 'Website', compact = false }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const phoneRef = useRef(null);
  const nameRef = useRef(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    const data = new FormData(e.target);
    const leadName = String(data.get('name') || '').trim();
    // Normalise ONCE, at submit — never while typing. The browser `pattern`
    // that used to sit on this input refused a hyphenated number
    // ("98739-15215") outright, so the visitor could not submit at all and
    // the lead was lost. The number is now accepted in any shape and
    // canonicalised to the 10 digits the lead gateway insists on.
    const leadPhone = normalizePhone(String(data.get('phone') || '').trim());
    if (leadName.length < 2) {
      setStatus('idle');
      setError('❌ Please enter your full name.');
      notifyRejected();
      focusField(nameRef.current);
      return;
    }
    if (!isValidPhone(leadPhone)) {
      setStatus('idle');
      setError('❌ Enter a valid 10-digit mobile number (it starts with 6-9).');
      notifyRejected();
      focusField(phoneRef.current);
      return;
    }
    const ok = await sendLead({
      name: leadName,
      phone: leadPhone,
      source,
      fields: { message: String(data.get('message') || '').trim() },
    });
    if (ok) {
      track('generate_lead', { event_category: 'Lead', event_label: 'Lead Form' });
      window.setTimeout(() => { window.location.href = '/thank-you.html'; }, 250);
      return;
    }
    setStatus('idle');
    setError(`❌ Couldn't send your request. Please call ${PHONE} or`);
    // The send failed, so no lead exists on the site either — click-guard
    // must not count this as a conversion.
    notifyRejected();
    focusField(phoneRef.current);
  };

  return (
    <form className="lead-form" onSubmit={onSubmit}>
      <input type="hidden" name="form-name" value={formName} />
      <input type="hidden" name="source" value={source} />
      <div className={compact ? 'hero-form-row' : ''}>
        <div>
          <label htmlFor={`${formName}-name`}>Your Name *</label>
          <input id={`${formName}-name`} name="name" placeholder="e.g. Rahul Sharma" required ref={nameRef} />
        </div>
        <div>
          <label htmlFor={`${formName}-phone`}>Phone Number *</label>
          {/* No browser pattern attribute: the old one (digits, a plus and a
              space, 8-15 chars) refused a hyphenated number before the
              visitor could submit, so the lead was lost. The number is
              validated in JS (normalised first) instead. */}
          <input
            id={`${formName}-phone`}
            name="phone"
            type="tel"
            placeholder="+91 9560739281"
            required
            ref={phoneRef}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${formName}-msg`}>Message</label>
        <textarea id={`${formName}-msg`} name="message" rows="3" placeholder="Tell us about your cleaning needs" />
      </div>
      <button type="submit" className="btn btn-secondary btn-block" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Get Free Quote'}
      </button>
      {error && (
        <p className="form-error">
          {error}{' '}
          <a href={waMsg('Hi, my quote request on your website did not go through. Please call me back.')} target="_blank" rel="noopener" onClick={whatsappClick}>
            WhatsApp us →
          </a>
        </p>
      )}
      <p className="lead-note">We’ll call you back to confirm your booking.</p>
    </form>
  );
}
