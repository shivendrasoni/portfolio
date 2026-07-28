import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isTerminal = pathname.startsWith('/terminal');

  useEffect(() => {
    if (isTerminal) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      autoRaf: true,
    });

    return () => {
      lenis.destroy();
    };
  }, [isTerminal]);

  return (
    <>
      {children}
    </>
  );
}