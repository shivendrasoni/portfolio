import { ArrowUpRight } from 'lucide-react';
import { Reveal, Section, SectionHeading } from './primitives';
import { PROJECTS, type Project } from './data';

const ProjectCard = ({ project }: { project: Project }) => {
  const { name, tag, icon: Icon, description, tech, href, featured } = project;
  const Wrapper = href ? 'a' : 'div';

  return (
    <Wrapper
      {...(href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-all duration-300 md:p-6 ${
        href ? 'hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.05]' : ''
      } ${featured ? 'lg:col-span-2' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="liquid-glass flex h-11 w-11 items-center justify-center rounded-xl">
          <Icon className="h-5 w-5 text-white/85" strokeWidth={1.5} />
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[10.5px] uppercase tracking-[0.16em] text-white/50">
          {tag}
        </span>
      </div>

      <h3 className="mt-5 flex items-center gap-2 text-lg font-normal tracking-tight md:text-xl">
        {name}
        {href ? (
          <ArrowUpRight
            className="h-4 w-4 text-white/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
            strokeWidth={1.5}
          />
        ) : null}
      </h3>

      <p className="mt-2 flex-1 text-[13px] leading-[1.65] text-white/55 md:text-[13.5px]">
        {description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {tech.map((item) => (
          <span
            key={item}
            className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/60"
          >
            {item}
          </span>
        ))}
      </div>
    </Wrapper>
  );
};

const WorkSection = () => (
  <Section id="work">
    <Reveal>
      <SectionHeading
        label="Selected Work"
        title="Products I build on the side"
        description="Small teams, fast loops, shipped to real users. Most of these started as a weekend problem and stayed."
      />
    </Reveal>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
      {PROJECTS.map((project, index) => (
        <Reveal
          key={project.name}
          delay={Math.min(index, 5) * 60}
          className={project.featured ? 'lg:col-span-2' : ''}
        >
          <ProjectCard project={{ ...project, featured: false }} />
        </Reveal>
      ))}
    </div>
  </Section>
);

export default WorkSection;
