import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';

const LOGO = (
  <span className="font-display font-bold text-xl tracking-tight text-text-primary">
    Book<span className="text-accent-crimson">Karoo</span>
  </span>
);

const NAV_COLS = [
  {
    heading: 'Explore',
    links: [['Movies', ROUTES.MOVIES], ['Events', ROUTES.EVENTS], ['Sports', ROUTES.SPORTS], ['Plays', ROUTES.PLAYS], ['Activities', ROUTES.ACTIVITIES]],
  },
  {
    heading: 'Company',
    links: [['About Us', '/about'], ['Careers', '/careers'], ['List Your Show', '/list-your-show'], ['Blog', '/blog']],
  },
  {
    heading: 'Support',
    links: [['Help Centre', ROUTES.HELP], ['Refund Policy', '/terms'], ['Cancellation', '/terms'], ['Contact Us', '/about']],
  },
  {
    heading: 'Legal',
    links: [['Terms & Conditions', '/terms'], ['Privacy Policy', '/privacy'], ['FAQ', '/faq'], ['Sitemap', '/sitemap']],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border-default pt-14 pb-8 mt-20 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(99,102,241,0.08),transparent_60%)]">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2 lg:col-span-1">
            {LOGO}
            <p className="mt-3 text-sm text-text-muted leading-relaxed font-sans">
              Book the moment. Karo it now.
            </p>
            <p className="mt-2 text-xs text-text-muted font-sans">
              India's premier entertainment booking platform.
            </p>
          </div>
          {NAV_COLS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-[11px] font-semibold text-text-muted tracking-widest uppercase mb-4 font-sans">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors font-sans"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t border-border-default text-xs text-text-muted font-sans">
          <span>© 2026 BookKaroo Pvt Ltd. All rights reserved.</span>
          <span>GST collected is remitted to the department. GSTIN: 24XXXXX0000X1Z5</span>
        </div>
      </div>
    </footer>
  );
}
