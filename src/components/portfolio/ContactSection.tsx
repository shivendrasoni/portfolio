import { ArrowUpRight, Mail, MapPin } from 'lucide-react';
import { Reveal, Section, SectionLabel } from './primitives';
import { LINKS, PROFILE, SOCIALS } from './data';

const ContactSection = () => (
  <Section id="contact" className="pb-28 md:pb-32">
    <Reveal>
      <div className="noise-overlay relative overflow-hidden rounded-2xl bg-[#324444] p-6 md:p-10 lg:p-12">
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionLabel align="start">Reach Me</SectionLabel>
            <h2 className="mt-4 max-w-xl text-2xl font-normal leading-[1.15] tracking-tight sm:text-3xl md:text-[38px]">
              Got something worth building? Let&rsquo;s talk.
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              <a
                href={`mailto:${PROFILE.email}`}
                className="group flex w-fit items-center gap-3 text-base text-white/90 transition-colors hover:text-white md:text-lg"
              >
                <Mail className="h-4 w-4 text-white/60" strokeWidth={1.5} />
                {PROFILE.email}
                <ArrowUpRight
                  className="h-4 w-4 text-white/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                  strokeWidth={1.5}
                />
              </a>
              <p className="flex items-center gap-3 text-[13px] text-white/55">
                <MapPin className="h-4 w-4 text-white/40" strokeWidth={1.5} />
                {PROFILE.location}
              </p>
            </div>
          </div>

          <a
            href={LINKS.topmate}
            target="_blank"
            rel="noopener noreferrer"
            className="liquid-glass flex h-12 w-fit shrink-0 items-center gap-2 rounded-full px-6 text-sm text-white"
          >
            Book a 1:1 on Topmate
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
          </a>
        </div>

        <div className="relative mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIALS.map(({ icon: Icon, href, label, handle, hoverClass }, index) => (
            <Reveal key={label} delay={Math.min(index, 5) * 50}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex h-full items-center gap-3 rounded-xl border border-white/12 bg-black/15 px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-black/25 ${hoverClass}`}
              >
                <span className="liquid-glass flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <Icon className="h-4 w-4 text-white" strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] text-white">{label}</span>
                  <span className="block truncate text-[12px] text-white/50">{handle}</span>
                </span>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-white/35 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                  strokeWidth={1.5}
                />
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </Reveal>

    <p className="mt-8 text-center text-[12px] text-white/30">
      {PROFILE.name} &middot; Built with React, Tailwind and a browser-side LLM.
    </p>
  </Section>
);

export default ContactSection;
