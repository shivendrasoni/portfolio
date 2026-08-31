import { Sparkle } from 'lucide-react';
import { Reveal, Section, SectionHeading } from './primitives';
import { AWARDS, EDUCATION, EXPERIENCE, SKILLS } from './data';

const RoleRow = ({
  years,
  role,
  company,
  location,
  current,
  highlights,
}: (typeof EXPERIENCE)[number]) => (
  <article className="grid grid-cols-1 gap-4 border-t border-white/10 py-6 md:grid-cols-[210px_1fr] md:gap-8 md:py-7">
    <div>
      <p className="text-[12.5px] text-white/45">{years}</p>
      {current ? (
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.16em] text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" />
          Current
        </span>
      ) : null}
    </div>
    <div>
      <h3 className="text-lg font-normal tracking-tight md:text-xl">{role}</h3>
      <p className="mt-1 text-[13px] text-white/55">
        {company} &middot; {location}
      </p>
      <ul className="mt-4 space-y-2">
        {highlights.map((highlight) => (
          <li key={highlight} className="flex gap-2.5 text-[13px] leading-[1.6] text-white/65">
            <Sparkle className="mt-1 h-3 w-3 shrink-0 text-white/35" strokeWidth={1.5} />
            {highlight}
          </li>
        ))}
      </ul>
    </div>
  </article>
);

const ChipGroup = ({ title, items }: { title: string; items: readonly string[] }) => (
  <div>
    <p className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">{title}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-white/65"
        >
          {item}
        </span>
      ))}
    </div>
  </div>
);

const ExperienceSection = () => (
  <Section id="experience">
    <Reveal>
      <SectionHeading
        label="Experience"
        title="A decade of building and leading"
        description="From payments at PhonePe to AI platform work at HighLevel — scaling systems, and the teams behind them."
      />
    </Reveal>

    <div className="border-b border-white/10">
      {EXPERIENCE.map((role, index) => (
        <Reveal key={`${role.company}-${role.years}`} delay={Math.min(index, 4) * 60}>
          <RoleRow {...role} />
        </Reveal>
      ))}
    </div>

    <div className="mt-10 grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3">
      <Reveal className="lg:col-span-2">
        <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <p className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">Recognition</p>
          <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {AWARDS.map((award) => (
              <li key={award} className="flex gap-2.5 text-[13px] leading-[1.55] text-white/65">
                <Sparkle className="mt-1 h-3 w-3 shrink-0 text-white/35" strokeWidth={1.5} />
                {award}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div className="noise-overlay relative h-full overflow-hidden rounded-2xl bg-[#324444] p-5 md:p-6">
          <p className="relative text-[10.5px] uppercase tracking-[0.18em] text-white/50">Education</p>
          <h3 className="relative mt-3 text-lg font-normal tracking-tight">{EDUCATION.degree}</h3>
          <p className="relative mt-1 text-[13px] text-white/70">{EDUCATION.institution}</p>
          <p className="relative mt-1 text-[13px] text-white/50">{EDUCATION.period}</p>
        </div>
      </Reveal>
    </div>

    <Reveal>
      <div className="mt-4 grid grid-cols-1 gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:mt-5 md:grid-cols-3 md:gap-8 md:p-6">
        <ChipGroup title="Leadership" items={SKILLS.leadership} />
        <ChipGroup title="Technical" items={SKILLS.technical} />
        <ChipGroup title="Domains" items={SKILLS.domains} />
      </div>
    </Reveal>
  </Section>
);

export default ExperienceSection;
