import Nav from './Nav.jsx';
import Footer from './Footer.jsx';
import UrgencyBar from './UrgencyBar.jsx';
import Topbar from './Topbar.jsx';
import StickyMobileBar from './StickyMobileBar.jsx';
import WaNudge from './WaNudge.jsx';

export default function Layout({ children, page }) {
  return (
    <>
      <UrgencyBar page={page} />
      <Topbar />
      <Nav />
      <main id="main">{children}</main>
      <Footer />
      <StickyMobileBar />
      <WaNudge />
    </>
  );
}