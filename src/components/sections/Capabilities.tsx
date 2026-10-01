import { capabilityGroups, manufacturingProcesses, toolStack } from '../../config/content';
import { Reveal } from '../ui/Reveal';
import { SectionHeader } from '../ui/SectionHeader';

export function Capabilities() {
  // Client-supplied groups appear only once they contain real entries.
  const groups = [
    ...capabilityGroups,
    ...(toolStack.length ? [{ title: 'CAD platforms & tools', items: toolStack }] : []),
    ...(manufacturingProcesses.length ? [{ title: 'Manufacturing processes', items: manufacturingProcesses }] : []),
  ];

  return (
    <section id="capabilities" aria-labelledby="capabilities-title" className="surface-mist section-y">
      <div className="container-x">
        <SectionHeader
          index="06"
          label="Capabilities"
          titleId="capabilities-title"
          title="Capabilities and deliverables."
          lede="What the work covers, what you receive, and the file formats we exchange with your team and suppliers."
        />
        <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group, gi) => (
            <Reveal key={group.title} delay={gi * 80}>
              <h3 className="tech-label border-b border-[var(--line)] pb-3 text-steel-100">{group.title}</h3>
              <ul className="mt-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center justify-between gap-4 border-b border-[var(--line-faint)] py-3 text-steel-200"
                  >
                    {item}
                    <span aria-hidden="true" className="h-1 w-1 bg-steel-500" />
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
