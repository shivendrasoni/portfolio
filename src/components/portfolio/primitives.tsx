import React, { useEffect, useRef, useState } from 'react';
import { Sparkle } from 'lucide-react';

export type BackdropVariant = 'aurora' | 'pulse' | 'grid';

const AuroraLayers = () => (
  <>
    <div className="absolute left-[-15%] top-[-20%] h-[75%] w-[85%] animate-drift-a rounded-full bg-[radial-gradient(circle_at_center,rgba(62,166,150,0.8),transparent_66%)]" />
    <div className="absolute bottom-[-25%] right-[-20%] h-[80%] w-[80%] animate-drift-b rounded-full bg-[radial-gradient(circle_at_center,rgba(44,92,150,0.72),transparent_66%)]" />
    <div className="absolute bottom-[8%] left-[18%] h-[55%] w-[55%] animate-drift-c rounded-full bg-[radial-gradient(circle_at_center,rgba(176,120,64,0.45),transparent_68%)]" />
  </>
);

const PULSE_RINGS = [0, 1, 2];

const PulseLayers = () => (
  <>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(52,126,116,0.42),transparent_62%)]" />
    {PULSE_RINGS.map((ring) => (
      <div
        key={ring}
        className="absolute left-1/2 top-1/2 h-[340px] w-[340px] animate-ring-pulse rounded-full border border-white/25"
        style={{ animationDelay: `${ring * 2.33}s` }}
      />
    ))}
  </>
);

const GridLayers = () => (
  <>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(44,110,104,0.45),transparent_65%)]" />
    <div className="absolute inset-0 [perspective:420px]">
      <div className="absolute inset-[-40%] [transform:rotateX(62deg)]">
        <div className="backdrop-grid animate-grid-drift absolute inset-0" />
      </div>
    </div>
    <div className="absolute inset-x-0 top-0 h-16 animate-scan-sweep bg-[linear-gradient(to_bottom,transparent,rgba(170,236,224,0.16),transparent)]" />
  </>
);

export const CardBackdrop = ({ variant }: { variant: BackdropVariant }) => (
  <div className="noise-overlay absolute inset-0 overflow-hidden bg-[#05080a]" aria-hidden="true">
    {variant === 'aurora' ? <AuroraLayers /> : null}
    {variant === 'pulse' ? <PulseLayers /> : null}
    {variant === 'grid' ? <GridLayers /> : null}
  </div>
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
