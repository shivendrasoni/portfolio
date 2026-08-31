import { useEffect } from 'react';
import ChatWidget from '../components/portfolio/ChatWidget';
import ContactSection from '../components/portfolio/ContactSection';
import ExperienceSection from '../components/portfolio/ExperienceSection';
import HeroSection from '../components/portfolio/HeroSection';
import WorkSection from '../components/portfolio/WorkSection';
import { PERSONAL_DATA } from '../components/portfolio/data';
import { initWebLLM } from '../lib/webllm';

const Portfolio = () => {
  useEffect(() => {
    let cancelled = false;
    const frameId = window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        if (cancelled) return;
        initWebLLM().catch(() => undefined);
      }, 0);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <main className="font-inter min-h-screen bg-[#0a0a0a] text-white antialiased">
      <HeroSection />
      <WorkSection />
      <ExperienceSection />
      <ContactSection />
      <ChatWidget personalData={PERSONAL_DATA} />
    </main>
  );
};

export default Portfolio;
