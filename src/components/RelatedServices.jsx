// Cross-links between every service page. Each row links to the other service
// pages, which helps Google crawl and understand the site structure.
const LINKS = [
  { label: 'Deep Cleaning Services', href: 'deep-cleaning-services-in-gurgaon.html' },
  { label: 'House Cleaning Services', href: 'house-cleaning-services-in-gurgaon.html' },
  { label: '1 BHK Full Home', href: 'full-home-deep-cleaning-1bhk-gurgaon.html' },
  { label: '2 BHK Full Home', href: 'full-home-deep-cleaning-2bhk-gurgaon.html' },
  { label: '3 BHK Full Home', href: 'full-home-deep-cleaning-3bhk-gurgaon.html' },
  { label: '4 BHK Full Home', href: 'full-home-deep-cleaning-4bhk-gurgaon.html' },
  { label: '5 BHK Full Home', href: 'full-home-deep-cleaning-5bhk-gurgaon.html' },
  { label: 'Kitchen Deep Cleaning', href: 'kitchen-deep-cleaning-gurgaon.html' },
  { label: 'Bathroom Deep Cleaning', href: 'bathroom-deep-cleaning-gurgaon.html' },
  { label: 'Sofa Shampoo Cleaning', href: 'sofa-shampoo-cleaning-gurgaon.html' },
  { label: 'Carpet Shampoo Cleaning', href: 'carpet-shampoo-cleaning-gurgaon.html' },
  { label: 'Office Deep Cleaning', href: 'office-deep-cleaning-gurgaon.html' },
  { label: 'Move-In / Move-Out', href: 'move-in-move-out-cleaning-gurgaon.html' },
  { label: 'Residential Cleaners Near Me', href: 'residential-cleaners-near-me.html' },
  { label: 'Society & Bulk Cleaning', href: 'society-cleaning-services-gurgaon.html' },
];

export default function RelatedServices({ currentHref }) {
  return (
    <section className="section section-alt">
      <div className="section-inner">
        <div style={{ textAlign: 'center' }} className="fade-up">
          <div className="section-tag">Explore More</div>
          <h2 className="section-title">Related Deep Cleaning Services in <span className="hl2">Gurgaon</span></h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>Every service is available across all Gurgaon sectors with the same police-verified team and pay-after-cleaning policy.</p>
        </div>
        <div className="areas-list" style={{ marginTop: '28px' }}>
          {LINKS.filter((l) => l.href !== currentHref).map((l) => (
            <a key={l.href} href={l.href} className="area-tag" style={{ color: 'var(--green)', fontWeight: 700 }}>
              {l.label} →
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
