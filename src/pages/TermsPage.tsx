import { LegalPage } from '../components/legal/LegalPage';
import { termsAndConditions } from '../config/legal';
import { seo } from '../config/site';
import { useSeo } from '../hooks/useSeo';

export default function TermsPage() {
  useSeo(seo.terms);
  return <LegalPage document={termsAndConditions} related={{ label: 'Privacy Policy', to: '/privacy-policy' }} />;
}
