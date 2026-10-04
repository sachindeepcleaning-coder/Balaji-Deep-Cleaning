import { CHECKLIST } from '../lib/landing.js';

export default function ChecklistSection() {
  return (
    <section className="section section-alt">
      <div className="section-inner">
        <div className="services-head fade-up">
          <div className="section-tag">What's Included</div>
          <h2 className="section-title">Complete Full Home Deep Cleaning <span className="hl2">Package</span></h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>Our professional deep cleaning service covers every part of your home with expert attention to detail.</p>
        </div>
        <div className="checklist-grid">
          {CHECKLIST.map(([title, desc]) => (
            <div key={title} className="checklist-item fade-up">
              <div className="checklist-icon">✓</div>
              <div>
                <div className="checklist-title">{title}</div>
                <div className="checklist-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}