import { AREAS_SERVED, phoneCallClick } from '../lib/landing.js';
import { PHONE_TEL } from '../lib/site.js';

export default function AreasSection() {
  return (
    <section className="section section-alt">
      <div className="section-inner" style={{ textAlign: 'center' }}>
        <div className="fade-up">
          <div className="section-tag">Areas Served</div>
          <h2 className="section-title">We Cover All of <span className="hl2">Gurgaon</span></h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>Serving every sector and locality in Gurugram (Gurgaon)</p>
        </div>
        <div className="areas-list fade-up">
          {AREAS_SERVED.map((a) => <span key={a} className="area-tag">{a}</span>)}
        </div>
        <p style={{ marginTop: '18px', fontSize: '.84rem', color: 'var(--muted)' }}>
          Not sure if we serve your area? <a href={PHONE_TEL} style={{ color: 'var(--green)', fontWeight: 700 }} onClick={phoneCallClick}>Just call us →</a>
        </p>
      </div>
    </section>
  );
}