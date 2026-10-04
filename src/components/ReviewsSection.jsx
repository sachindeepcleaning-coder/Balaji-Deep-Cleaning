import { REVIEWS } from '../lib/landing.js';

export default function ReviewsSection({ reviews = REVIEWS }) {
  return (
    <section className="section">
      <div className="section-inner">
        <div className="reviews-head fade-up">
          <div className="section-tag">Customer Reviews</div>
          <h2 className="section-title">What Gurgaon Families <span className="hl2">Say</span></h2>
          <div style={{ marginTop: '14px' }}>
            <div className="rating-summary">
              <span className="rs-stars">⭐⭐⭐⭐⭐</span>
              <span className="rs-num">4.5</span>
              <span className="rs-count">/ 5 · 148 Reviews</span>
            </div>
          </div>
        </div>
        <div className="reviews-grid">
          {reviews.map(([initials, name, loc, text]) => (
            <div key={initials + name} className="review-card fade-up">
              <div className="review-stars">⭐⭐⭐⭐⭐</div>
              <p className="review-text">&ldquo;{text}&rdquo;</p>
              <div className="reviewer">
                <div className="reviewer-av">{initials}</div>
                <div>
                  <div className="reviewer-name">{name}</div>
                  <div className="reviewer-loc">{loc}</div>
                </div>
                <span className="review-verified">✓ Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}