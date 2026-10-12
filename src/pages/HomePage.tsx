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
import { seo } from '../config/site';
import { homeJsonLd } from '../config/structuredData';
import { useSeo } from '../hooks/useSeo';

export default function HomePage() {
  useSeo(seo.home, homeJsonLd);
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
