import React, { useEffect, useRef, useState } from 'react';
import { Sparkle } from 'lucide-react';

export const CardVideo = ({ src }: { src: string }) => (
  <video
    className="absolute inset-0 h-full w-full object-cover"
    src={src}
    autoPlay
    loop
    muted
    playsInline
  />
);

export const SectionLabel = ({
  children,
  align = 'center',
}: {
  children: React.ReactNode;
  align?: 'center' | 'start';
}) => (
  <div className={`flex items-center gap-2 ${align === 'start' ? 'justify-start' : 'justify-center'}`}>
    <Sparkle className="h-3 w-3 text-white/70" strokeWidth={1.5} />
    <span className="text-[11px] uppercase tracking-[0.22em] text-white/70">{children}</span>
    <Sparkle className="h-3 w-3 text-white/70" strokeWidth={1.5} />
  </div>
);

export const SectionHeading = ({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) => (
  <div className="mb-8 md:mb-10">
    <SectionLabel align="start">{label}</SectionLabel>
    <h2 className="mt-3 text-2xl font-normal leading-[1.15] tracking-tight sm:text-3xl md:text-[34px]">
      {title}
    </h2>
    {description ? (
      <p className="mt-3 max-w-2xl text-sm leading-[1.6] text-white/55 md:text-[15px]">{description}</p>
    ) : null}
  </div>
);

export const Reveal = ({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '-40px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const MarqueeRow = ({
  direction,
  children,
}: {
  direction: 'left' | 'right';
  children: React.ReactNode;
}) => (
  <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
    <div
      className={`flex w-max gap-3 ${
        direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'
      }`}
    >
      {children}
    </div>
  </div>
);

export const Section = ({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    id={id}
    className={`px-4 py-16 sm:px-6 md:px-10 md:py-20 lg:px-14 lg:py-24 ${className}`}
  >
    <div className="mx-auto w-full max-w-[1400px]">{children}</div>
  </section>
);
