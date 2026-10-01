import { LegalPage } from '../components/legal/LegalPage';
import { privacyPolicy } from '../config/legal';
import { seo } from '../config/site';
import { useSeo } from '../hooks/useSeo';

export default function PrivacyPolicyPage() {
  useSeo(seo.privacy);
  return <LegalPage document={privacyPolicy} related={{ label: 'Terms & Conditions', to: '/terms-and-conditions' }} />;
}
