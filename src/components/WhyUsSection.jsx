import { WHY_US } from '../lib/landing.js';
import { WHY_US_VARIANTS } from '../lib/trust-variants.js';
import TwoTone from './TwoTone.jsx';

const TITLES = {
  home: '6 Reasons Gurgaon Families Book Us',
  care: '6 Reasons Your Surfaces Are Safe With Us',
  commercial: '6 Reasons Facility Heads Rebook Us',
};

export default function WhyUsSection({ variant } = {}) {
  const items = (variant && WHY_US_VARIANTS[variant]) || WHY_US;
  const title = (variant && TITLES[variant]) || '6 Reasons Gurgaon Trusts Us';
  return (
    <section className="section section-alt">
      <div className="section-inner">
        <div style={{ textAlign: 'center', marginBottom: 0 }} className="fade-up">
          <div className="section-tag">Why Choose Us</div>
          <h2 className="section-title"><TwoTone text={title} /></h2>
        </div>
        <div className="whyus-grid" style={{ marginTop: '36px' }}>
          {items.map(([icon, t, desc]) => (
            <div key={t} className="why-card fade-up">
              <div className="why-icon">{icon}</div>
              <div>
                <div className="why-title">{t}</div>
                <div className="why-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}