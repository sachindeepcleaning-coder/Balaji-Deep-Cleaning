import { PRICING, phoneCallClick } from '../lib/landing.js';
import { PHONE_TEL } from '../lib/site.js';

export default function PricingSection() {
  return (
    <section className="section">
      <div className="section-inner">
        <div style={{ textAlign: 'center' }} className="fade-up">
          <div className="section-tag">Transparent Pricing</div>
          <h2 className="section-title">Simple, Honest <span className="hl2">Pricing</span></h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>No hidden charges. Exact price confirmed on call before booking.</p>
        </div>
        <div className="pricing-grid">
          {PRICING.map((p) => (
            <div key={p.size} className={`pricing-card${p.pop ? ' pop' : ''} fade-up`}>
              <div className="pc-type">Full Home</div>
              <div className="pc-size">{p.size}</div>
              <div className="pc-price"><sub>₹</sub>{p.price}</div>
              <div className="pc-from">All rooms incl.</div>
              <ul className="pc-items">
                {p.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
              <a href={PHONE_TEL} className="btn-pc" onClick={phoneCallClick}>
                Book Now →
              </a>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '.82rem', color: 'var(--muted)' }}>
          💡 Prices above are starting prices. Exact quote given on call based on your home's condition. <strong>No surprises.</strong>
        </p>
      </div>
    </section>
  );
}