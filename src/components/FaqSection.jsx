import { useEffect, useState } from 'react';
import { FAQS } from '../lib/landing.js';

export default function FaqSection({ faqs = FAQS }) {
  const [open, setOpen] = useState(0);

  return (
    <section className="section">
      <div className="section-inner">
        <div style={{ textAlign: 'center' }} className="fade-up">
          <div className="section-tag">FAQ</div>
          <h2 className="section-title">Common Questions <span className="hl2">Answered</span></h2>
        </div>
        <div className="faq-wrap">
          {faqs.map(([q, a], i) => (
            <div key={q} className={`faq-item${open === i ? ' open' : ''}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                {q}
                <span className="faq-arrow">▼</span>
              </button>
              <div className="faq-a">{a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}