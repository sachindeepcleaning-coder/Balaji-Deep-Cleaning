import { PHONE_TEL, waMsg } from '../lib/site.js';
import { phoneCallClick, whatsappClick } from '../lib/landing.js';

// Slim blue info bar above the nav (template style). Contact info only —
const INFO_EMAIL = 'contact@balajicleaningservice.shop';

export default function Topbar() {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <span className="topbar-left">📍 Serving all of Gurgaon, Haryana</span>
        <span className="topbar-right">
          <a href={`mailto:${INFO_EMAIL}`}>{INFO_EMAIL}</a>
          <span className="topbar-sep">|</span>
          <a
            href={waMsg('Hi I want to book deep cleaning service in Gurgaon.')}
            target="_blank" rel="noopener" onClick={whatsappClick}
          >
            WhatsApp
          </a>
          <span className="topbar-sep">|</span>
          <a href={PHONE_TEL} onClick={phoneCallClick}>+91 9560739281</a>
        </span>
      </div>
    </div>
  );
}
