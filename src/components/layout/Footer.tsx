import { Link } from 'react-router-dom';
import { services } from '../../config/services';
import { brand, contactDetails, cta, navigation, socialLinks } from '../../config/site';
import { EmailLink } from '../ui/EmailLink';
import { Logo } from '../brand/Logo';
import { Arrow } from '../ui/ButtonLink';

export function Footer() {
  const year = new Date().getFullYear();
  const hasContact = contactDetails.email || contactDetails.address;

  return (
    <footer className="border-t border-[var(--line)] bg-ink-950">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-10 lg:py-20">
        <div className="lg:col-span-4">
          <Link to="/" aria-label={`${brand.name} home`} className="inline-block rounded-[2px]">
            <Logo showTagline />
          </Link>
          <p className="mt-6 max-w-sm text-steel-300">
            {brand.descriptor}. We take your idea from its starting point and shift it into a real, manufacturable
            product.
          </p>
          <Link to={cta.primary.to} className="btn btn-quiet mt-6 text-brand-400 hover:text-brand-300">
            {cta.primary.label}
            <Arrow />
          </Link>
        </div>

        <nav aria-label="Footer" className="lg:col-span-2">
          <h2 className="tech-label mb-5">Explore</h2>
          <ul className="grid gap-0.5 text-sm lg:gap-3">
            {navigation.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="inline-flex min-h-10 items-center text-steel-200 transition-colors hover:text-steel-50 pointer-fine:min-h-0"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h2 className="tech-label mb-5">Services</h2>
          <ul className="grid gap-0.5 text-sm lg:gap-3">
            {services.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/#services`}
                  className="inline-flex min-h-10 items-center lg:min-h-0 text-steel-200 transition-colors hover:text-steel-50"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="tech-label mb-5">Contact</h2>
          {hasContact ? (
            <address className="grid gap-0.5 text-sm lg:gap-3 not-italic text-steel-200">
              {contactDetails.email && (
                <EmailLink
                  email={contactDetails.email}
                  className="inline-flex min-h-10 items-center hover:text-steel-50 pointer-fine:min-h-0"
                />
              )}
              {contactDetails.address && <span>{contactDetails.address}</span>}
              {contactDetails.hours && <span className="text-steel-400">{contactDetails.hours}</span>}
            </address>
          ) : (
            <p className="text-sm text-steel-300">
              Share your idea, sketches or CAD files through the{' '}
              <Link
                to="/contact"
                className="text-steel-50 underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-brand-500"
              >
                project intake form
              </Link>
              .
            </p>
          )}
          {socialLinks.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-4 text-sm">
              {socialLinks.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center lg:min-h-0 text-steel-300 hover:text-steel-50"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-[var(--line)]">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-steel-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {brand.name}. All rights reserved.
          </p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-5 lg:gap-y-2">
              <li>
                <Link
                  to="/privacy-policy"
                  className="inline-flex min-h-10 items-center lg:min-h-0 transition-colors hover:text-steel-50"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-and-conditions"
                  className="inline-flex min-h-10 items-center lg:min-h-0 transition-colors hover:text-steel-50"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </nav>
          <p className="font-mono tracking-wider uppercase">Concept · CAD · Documentation · Manufacturing</p>
        </div>
      </div>
    </footer>
  );
}
