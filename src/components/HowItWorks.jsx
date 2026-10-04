import { HOW_IT_WORKS } from '../lib/landing.js';

export default function HowItWorks() {
  return (
    <section className="section section-alt">
      <div className="section-inner">
        <div style={{ textAlign: 'center' }} className="fade-up">
          <div className="section-tag">How It Works</div>
          <h2 className="section-title">Book in 4 <span className="hl2">Easy Steps</span></h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>A verified professional at your door in hours — not days.</p>
        </div>
        <div className="hiw-wrap">
          {HOW_IT_WORKS.map(([num, title, desc]) => (
            <div key={num} className="hiw-step fade-up">
              <div className="hiw-num"><span>{num}</span></div>
              <div className="hiw-title">{title}</div>
              <div className="hiw-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}