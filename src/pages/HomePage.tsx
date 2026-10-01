import { FinalCta } from '../components/cta/FinalCta';
import { Hero } from '../components/hero/Hero';
import { ProcessSection } from '../components/process/ProcessSection';
import { AssemblySequence } from '../components/sequence/AssemblySequence';
import { Capabilities } from '../components/sections/Capabilities';
import { Differentiators } from '../components/sections/Differentiators';
import { ProblemSolution } from '../components/sections/ProblemSolution';
import { StatsStrip } from '../components/sections/StatsStrip';
import { TrustStrip } from '../components/sections/TrustStrip';
import { ServicesSection } from '../components/services/ServicesSection';
import { InspectionViewer } from '../components/showcase/InspectionViewer';
import { WorkShowcase } from '../components/showcase/WorkShowcase';
import { services } from '../config/services';
import { brand, contactDetails, seo, siteUrl } from '../config/site';
import { useSeo } from '../hooks/useSeo';

const organizationJsonLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: brand.name,
  description: seo.home.description,
  ...(siteUrl && { url: siteUrl }),
  ...(contactDetails.email && { email: contactDetails.email }),
  makesOffer: services.map((s) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: s.title, description: s.summary },
  })),
};

export default function HomePage() {
  useSeo(seo.home, organizationJsonLd);
  return (
    <>
      <Hero />
      <ServicesSection />
      <TrustStrip />
      <AssemblySequence />
      <StatsStrip />
      <ProcessSection />
      <InspectionViewer />
      <ProblemSolution />
      <Differentiators />
      <Capabilities />
      <WorkShowcase />
      <FinalCta />
    </>
  );
}
