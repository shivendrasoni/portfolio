import React from 'react';
import { ArrowUpRight, MessageSquare, Sparkle } from 'lucide-react';
import { CardBackdrop, MarqueeRow, SectionLabel } from './primitives';
import { LINKS, PROFILE, SOCIALS, STACK_ICONS, TIMELINE } from './data';

const BackgroundCard = () => (
  <article className="relative min-h-[460px] overflow-hidden rounded-2xl bg-black lg:min-h-0">
    <CardBackdrop variant="aurora" />
    <img
      src="/portrait.webp"
      alt={`${PROFILE.name}, ${PROFILE.currentRole}`}
      className="absolute bottom-0 left-1/2 h-[80%] w-auto -translate-x-1/2 object-contain opacity-95 [mask-image:linear-gradient(to_bottom,black_46%,transparent_84%)]"
    />
    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0)_28%,rgba(0,0,0,0.6)_60%,rgba(0,0,0,0.94)_100%)]" />
    <div className="relative flex h-full flex-col justify-between p-5 md:p-6">
      <SectionLabel>Background</SectionLabel>
      <div className="grid grid-cols-[auto_auto_1fr_auto] items-start gap-x-3 gap-y-3 text-[13px]">
        {TIMELINE.map(({ years, role, company }) => (
          <React.Fragment key={years}>
            <span className="whitespace-nowrap text-white/60">{years}</span>
            <Sparkle className="mt-1 h-3 w-3 text-white/60" strokeWidth={1.5} />
            <span className="leading-[1.35] text-white/90">{role}</span>
            <span className="whitespace-nowrap text-right leading-[1.35] text-white/60">{company}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  </article>
);

const StatementCard = () => (
  <article className="noise-overlay relative overflow-hidden rounded-2xl bg-[#324444] p-5 md:p-6">
    <SectionLabel align="start">What I Do</SectionLabel>
    <p className="relative mt-4 text-[13px] leading-[1.6] text-white/85 sm:text-[13.5px]">
      &ldquo;{PROFILE.statement}&rdquo;
    </p>
    <p className="relative mt-4 text-[13px] text-white/60">
      <span className="font-medium text-white">{PROFILE.name}</span>, {PROFILE.currentRole}
    </p>
  </article>
);

const StatCard = () => (
  <article className="relative min-h-[220px] overflow-hidden rounded-2xl bg-black">
    <CardBackdrop variant="pulse" />
    <div className="absolute inset-0 bg-black/25" />
    <div className="relative flex h-full flex-col items-center justify-center gap-3 p-5 md:p-6">
      <span className="text-5xl font-light tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] sm:text-6xl md:text-7xl lg:text-[80px]">
        40+
      </span>
      <span className="text-center text-[13px] text-white/85">
        Engineers led across HighLevel &amp; Amber
      </span>
    </div>
  </article>
);

const StackCard = () => (
  <article className="relative min-h-[260px] overflow-hidden rounded-2xl bg-black">
    <CardBackdrop variant="grid" />
    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/70" />
    <div className="relative flex h-full flex-col justify-between gap-6 p-5 md:p-6">
      <SectionLabel>Daily Stack</SectionLabel>
      <div className="-mx-5 flex flex-col gap-3 md:-mx-6">
        <MarqueeRow direction="left">
          {[...STACK_ICONS, ...STACK_ICONS].map((Icon, index) => (
            <div
              key={`top-${index}`}
              className="liquid-glass flex h-14 w-14 shrink-0 items-center justify-center rounded-xl md:h-16 md:w-16"
            >
              <Icon className="h-5 w-5 text-white/85 md:h-6 md:w-6" strokeWidth={1.5} />
            </div>
          ))}
        </MarqueeRow>
        <MarqueeRow direction="right">
          {[...STACK_ICONS].reverse().concat([...STACK_ICONS].reverse()).map((Icon, index) => (
            <div
              key={`bottom-${index}`}
              className="liquid-glass flex h-14 w-14 shrink-0 items-center justify-center rounded-xl md:h-16 md:w-16"
            >
              <Icon className="h-5 w-5 text-white/85 md:h-6 md:w-6" strokeWidth={1.5} />
            </div>
          ))}
        </MarqueeRow>
      </div>
    </div>
  </article>
);

const AskAiCard = () => (
  <article className="noise-overlay relative overflow-hidden rounded-2xl bg-[#324444] p-5 md:p-6">
    <div className="relative flex items-start justify-between gap-4">
      <SectionLabel align="start">Ask my AI</SectionLabel>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event('portfolio:open-chat'))}
        aria-label="Open the AI assistant"
        className="liquid-glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      >
        <ArrowUpRight className="h-4 w-4 text-white" strokeWidth={1.5} />
      </button>
    </div>
    <p className="relative mt-4 text-[13px] leading-[1.6] text-white/70">
      A small language model runs entirely in your browser &mdash; no server, no tracking. Ask it
      anything about my work.
    </p>
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('portfolio:open-chat'))}
      className="liquid-glass relative mt-4 flex h-10 items-center gap-2 rounded-full px-4 text-[13px] text-white"
    >
      <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
      Start a conversation
    </button>
  </article>
);

const HeroSection = () => (
  <section className="px-4 pb-4 pt-6 sm:px-6 sm:pt-8 md:px-10 md:pb-5 md:pt-10 lg:px-14">
    <div className="mx-auto w-full max-w-[1400px]">
      <header className="mb-6 flex flex-col gap-5 md:mb-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="max-w-3xl">
          <h1 className="text-[28px] font-normal leading-[1.15] tracking-tight sm:text-3xl md:text-4xl lg:text-[44px]">
            Hi, I&rsquo;m {PROFILE.firstName}!
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-[1.6] text-white/60 md:text-[15px]">
            {PROFILE.intro}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {SOCIALS.map(({ icon: Icon, href, label, hoverClass }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-9 items-center gap-2 rounded-full border border-white/12 px-3.5 text-[12.5px] text-white/70 transition-colors hover:text-white ${hoverClass}`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {label}
              </a>
            ))}
          </div>
        </div>
        <a
          href={LINKS.topmate}
          target="_blank"
          rel="noopener noreferrer"
          className="liquid-glass shrink-0 self-start rounded-full px-5 py-2.5 text-sm text-white sm:px-6 sm:py-3"
        >
          Let&rsquo;s Team Up Today
        </a>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
        <BackgroundCard />
        <div className="grid grid-rows-[auto_auto] gap-4 md:grid-rows-[auto_1fr] md:gap-5">
          <StatementCard />
          <StatCard />
        </div>
        <div className="grid grid-rows-[auto_auto] gap-4 md:grid-rows-[1fr_auto] md:gap-5">
          <StackCard />
          <AskAiCard />
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
