import React, { useEffect, useRef, useState } from 'react';
import { generateChat, generateChatStream, getWebLLMStatus, initWebLLM, onWebLLMStatusChange } from '../lib/webllm';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Linkedin, Briefcase, Code, Zap, Users, TrendingUp,
  Globe, MessageCircle, Terminal, ArrowRight, Mail,
  MessageSquare, X, Send, Loader2, Github, Instagram
} from 'lucide-react';
import DotGrid from '../components/jsrepo/DotGrid';

// Simple hook for intersection observer animations
const useOnScreen = (ref: React.RefObject<HTMLElement>, rootMargin = '0px') => {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [ref, rootMargin]);
  return isIntersecting;
};

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref, "-50px");

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

interface ChatPersonalData {
  name: string;
  [key: string]: unknown;
}

const ChatWidget = ({ personalData }: { personalData: ChatPersonalData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hi! I'm an AI assistant. Ask me anything about Shivendra's background." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState(getWebLLMStatus());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = onWebLLMStatusChange(setModelStatus);
    return () => {
      unsubscribe();
    };
  }, []);


  useEffect(() => {
    if (!isOpen) return;
    if (modelStatus.state === 'idle' || modelStatus.state === 'error') {
      initWebLLM().catch((error) => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Model failed to load: ${error?.message || 'Unknown error'}`
        }]);
      });
    }
  }, [isOpen, modelStatus.state]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || modelStatus.state !== 'ready') return;

    const userMessage = input;
    setInput('');
    const conversation: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...messages,
      { role: 'user', content: userMessage }
    ];
    setMessages(prev => [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: '' }]);
    setIsLoading(true);

    const updateLastAssistant = (content: string) => {
      setMessages(prev => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const lastIndex = next.length - 1;
        if (next[lastIndex].role === 'assistant') {
          next[lastIndex] = { ...next[lastIndex], content };
        }
        return next;
      });
    };

    try {
      const systemPrompt = `You are an AI assistant for ${personalData.name}'s portfolio. 
      Answer questions about their background based on this data: ${JSON.stringify(personalData)}.
      Keep answers concise, professional, and friendly. If the response is long, use short paragraphs,
      bullet lists, and blank lines between sections for readability.`;

      let answer = "";
      try {
        const stream = await generateChatStream({
          messages: [{ role: "system", content: systemPrompt }, ...conversation],
          temperature: 0.7,
        });

        for await (const chunk of stream) {
          const delta = chunk?.choices?.[0]?.delta?.content || "";
          if (delta) {
            answer += delta;
            updateLastAssistant(answer);
          }
        }
      } catch (streamError) {
        const response = await generateChat({
          messages: [{ role: "system", content: systemPrompt }, ...conversation],
          temperature: 0.7,
        });

        answer = response.choices[0]?.message?.content || "I couldn't generate a response.";
        updateLastAssistant(answer);
      }

      if (!answer.trim()) {
        updateLastAssistant("I couldn't generate a response.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sorry, I encountered an error. Please try again.";
      updateLastAssistant(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Bar */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        {/* Chat Window */}
        {hasOpened && (
          <div
            data-state={isOpen ? 'open' : 'closed'}
            className={`w-80 md:w-96 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[500px] mb-2 origin-bottom-right duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 ${!isOpen ? 'pointer-events-none' : ''}`}
          >
            {/* Header */}
            <div className="p-4 bg-[#FFE66D] border-b-2 border-black flex justify-between items-center">
              <h3 className="font-black uppercase tracking-tight">Ask AI Assistant</h3>
              <button onClick={() => setIsOpen(false)} className="hover:text-[#FF6B6B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F4F4F0] min-h-[300px] max-h-[400px]">
              {modelStatus.state === 'loading' && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-2 text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>
                      Agent is loading
                      {typeof modelStatus.progress === 'number' ? ` · ${Math.round(modelStatus.progress * 100)}%` : ''}
                    </span>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex animate-in fade-in-0 slide-in-from-bottom-1 duration-150 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 text-sm font-medium border-2 border-black ${
                    msg.role === 'user'
                      ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(100,100,100,1)]'
                      : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  } whitespace-pre-wrap`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t-2 border-black flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={modelStatus.state === 'ready' ? "Ask about my experience..." : "Please wait for the agent to be ready..."}
                disabled={modelStatus.state !== 'ready'}
                className="flex-1 p-2 border-2 border-black font-mono text-sm focus:outline-none focus:bg-[#E0E7FF] disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || modelStatus.state !== 'ready'}
                className="p-2 bg-[#4ECDC4] border-2 border-black hover:bg-[#3dbdb4] disabled:opacity-50 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons Group */}
        <div className="flex shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <a 
            href="/terminal" 
            className="bg-white hover:bg-[#FF6B6B] text-black hover:text-white border-2 border-black border-r-0 p-3 md:p-4 font-bold font-mono flex items-center gap-2 transition-colors"
            title="Switch to Terminal Mode"
          >
            <Terminal className="w-5 h-5" />
            <span className="hidden md:inline">DEV_MODE</span>
          </a>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`text-white border-2 border-black p-3 md:p-4 font-bold font-mono flex items-center gap-2 transition-colors ${
              isOpen ? 'bg-[#FF6B6B] text-black' : 'bg-black hover:bg-[#4ECDC4] hover:text-black'
            }`}
          >
            {isOpen ? (
              <>
                <X className="w-5 h-5" />
                <span className="hidden md:inline">CLOSE</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5" />
                <span>ASK AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

const SOCIAL_LINKS = [
  { icon: Github, href: 'https://github.com/shivendrasoni', label: 'GitHub', hoverClass: 'hover:bg-black hover:text-white' },
  { icon: Linkedin, href: 'https://linkedin.com/in/shivendrasoni', label: 'LinkedIn', hoverClass: 'hover:bg-[#0077b5] hover:text-white' },
  { icon: X, href: 'https://x.com/oyegpt', label: 'X (Twitter)', hoverClass: 'hover:bg-black hover:text-white' },
  { icon: Instagram, href: 'https://instagram.com/oyegpt', label: 'Instagram', hoverClass: 'hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white' },
  { icon: Globe, href: 'https://medium.com/@shivendrasoni', label: 'Blog', hoverClass: 'hover:bg-[#FF6B6B] hover:text-white' },
  { icon: MessageCircle, href: 'https://topmate.io/shivendra', label: 'Topmate', hoverClass: 'hover:bg-[#4ECDC4] hover:text-white' },
];

const SocialRail = () => (
  <div className="fixed left-4 md:left-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex">
    <div className="flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {SOCIAL_LINKS.map((social, idx) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          title={social.label}
          className={`p-3 bg-white border-2 border-black text-black transition-colors duration-200 ${idx !== 0 ? 'border-t-0' : ''} ${social.hoverClass}`}
        >
          <social.icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  </div>
);

const Portfolio = () => {
  useEffect(() => {
    let cancelled = false;
    const startDownload = () => {
      if (cancelled) return;
      initWebLLM().catch(() => undefined);
    };

    const frameId = window.requestAnimationFrame(() => {
      window.setTimeout(startDownload, 0);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const personalData = {
    name: "Shivendra Soni",
    title: "ENGINEERING & AI LEADER",
    currentRole: "Associate Director of AI at HighLevel",
    location: "Pune, Maharashtra, India",
    email: "shivendrasoni91@gmail.com",
    linkedin: "https://linkedin.com/in/shivendrasoni",
    github: "https://github.com/shivendrasoni",
    blog: "https://medium.com/@shivendrasoni",
    topmate: "https://topmate.io/shivendra",
    summary: "Associate Director of AI at HighLevel, leading a team of around 10 brilliant engineers in AI initiatives. Previously led 35+ engineers at AmberStudent in global student accommodation solutions. Experienced with Phonepe, Flipkart, Mindtickle, SAP Labs. B.Tech from IIIT, passionate about AI, Data Science, LLM development, and fostering collaborative engineering culture. Active researcher in AI transparency and agent identification protocols.",
    
    skills: {
      leadership: ["Team Leadership", "Strategic Thinking", "Technical Design", "Communication", "Mentoring"],
      technical: ["AI/ML", "LLM Development", "Vector Databases", "System Architecture", "Data Science", "Cloud Computing", "Microservices"],
      domains: ["FinTech", "E-commerce", "EdTech", "PropTech", "SaaS", "AI Security"],
    },
    
    experience: [
      {
        company: "HighLevel",
        role: "Associate Director of AI",
        period: "Jan 2025 - Present",
        location: "India",
        type: "current",
        highlights: [
          "Leading AI initiatives and strategy for the platform",
          "Building AI-powered marketing automation solutions",
          "Driving innovation in customer engagement technologies"
        ]
      },
      {
        company: "Amber (AmberStudent)",
        role: "Associate Director of Engineering",
        period: "Apr 2024 - Jan 2025",
        location: "Pune, India",
        type: "past",
        highlights: [
          "Led AI-first initiatives across the platform",
          "Built comprehensive performance dashboards",
          "Managed cross-functional engineering teams",
          "Drove technical strategy for global expansion"
        ]
      },
      {
        company: "Amber (AmberStudent)",
        role: "Senior Software Engineering Manager",
        period: "Jan 2023 - May 2024",
        location: "Pune, India", 
        type: "past",
        highlights: [
          "Scaled engineering team from 5 to 40+ members",
          "Led mobile app development with 200k+ downloads",
          "Spearheaded China market entry technical initiatives",
          "Implemented agile processes and engineering best practices"
        ]
      },
      {
        company: "Previous Experience",
        role: "Senior Engineering Roles",
        period: "2014 - 2023",
        location: "India",
        type: "past",
        highlights: [
          "PhonePe - Led payment processing systems",
          "Flipkart - E-commerce platform development",
          "Mindtickle - SaaS platform engineering",
          "SAP Labs - Enterprise software solutions"
        ]
      }
    ],
    
    projects: [
      {
        title: "Infrajam.com",
        company: "SaaS",
        description: "Architect cloud infrastructure visually with AI. Design diagrams, generate cost estimates, and provision resources via Terraform in a unified, intelligent workflow.",
        technologies: ["AI", "Terraform", "Cloud Architecture", "Cost Optimization"],
        impact: "Accelerates infrastructure delivery from design to deployment with AI-driven automation"
      },
      {
        title: "Nuum.online",
        company: "SaaS",
        description: "The ultimate command center for social media growth. Research trends, generate high-impact content, and orchestrate multi-channel publishing across Twitter, LinkedIn, and Instagram.",
        technologies: ["Social Intelligence", "Content AI", "Multi-channel Orchestration"],
        impact: "Empowers creators to scale their digital presence through data-driven content lifecycles",
        link: "https://nuum.online"
      },
      {
        title: "PostOracle.com",
        company: "SaaS",
        description: "Put your professional growth on autopilot. An intelligent LinkedIn automation suite that handles networking and engagement while maintaining a human-like presence.",
        technologies: ["LinkedIn Automation", "Growth Engineering", "AI Engagement"],
        impact: "Drives consistent professional visibility and network expansion with zero manual effort",
        link: "https://postoracle.com"
      },
      {
        title: "Vibeward.dev",
        company: "SaaS",
        description: "Pioneering 'Vibe Security' for the AI era. A preventive security layer that analyzes and secures the intent of AI-generated code before the first file is even created.",
        technologies: ["AI Security", "Vibe Coding", "Preventive Analysis", "LLM Safety"],
        impact: "Establishes a new paradigm of security-by-design for AI-assisted development",
        link: "https://vibeward.dev"
      },
      {
        title: "Medbot (Working Title)",
        company: "HealthTech",
        description: "Transform personal health records into actionable insights. Ingests blood work and medical reports into a private RAG pipeline for longitudinal trend analysis and natural language querying.",
        technologies: ["RAG", "Health Data Science", "Private AI", "Trend Analytics"],
        impact: "Democratizes personal health data, allowing users to converse with their medical history"
      },
      {
        title: "Vector Cache",
        company: "Open Source",
        description: "A streamlined Python library that enhances LLM query performance through semantic caching, making responses faster and more cost-effective.",
        technologies: ["Python", "LLM", "Semantic Caching", "Vector Databases"],
        impact: "Reduces LLM costs and response times through semantic similarity caching",
        link: "https://github.com/shivendrasoni/vector-cache"
      },
      {
        title: "AI Transparency Markup (AITM)",
        company: "Self Research",
        description: "A protocol for AI Agent self-identification in text and voice interactions, promoting transparency in AI communications.",
        technologies: ["AI/ML", "Protocol Design", "Voice Recognition", "NLP"],
        impact: "Published research on AI transparency and agent identification",
        link: "https://www.linkedin.com/pulse/ai-transparency-markup-aitm-protocol-agent-text-voice-shivendra-soni-rawef"
      }
    ],
    
    education: {
      degree: "B.Tech in Information Technology",
      institution: "Indian Institute of Information Technology",
      period: "2010-2014",
      location: "India"
    },
    
    awards: [
      "First Runners Up - What the Hack 2.0",
      "Won 1st prize at Go-hack '17 - Gojek",
      "Intel IoT Roadshow Finalist", 
      "ET Power of Ideas Top 50",
      "Won .Net Idea Innovation Challenge - IIT Delhi",
      "Multi-Dimensional Visual Analytics Patent - US 20170039741"
    ]
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-black font-sans selection:bg-[#FF6B6B] selection:text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 pt-20 pb-16 border-b-4 border-black bg-[#FFE66D] overflow-hidden">
        {/* DotGrid Background */}
        <div className="absolute inset-0 w-full h-full">
          <DotGrid
            dotSize={5}
            gap={70}
            baseColor="#271E37"
            activeColor="#5227FF"
            proximity={120}
            shockRadius={360}
            shockStrength={15}
            resistance={750}
            returnDuration={5}
          />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-[#4ECDC4] border-2 border-black rounded-full animate-bounce delay-700 hidden md:block" />
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-[#FF6B6B] border-2 border-black rotate-12 hidden md:block" />
        <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-black rotate-45 hidden md:block" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <FadeIn delay={100}>
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-black translate-x-3 translate-y-3 rounded-full"></div>
              <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-black bg-white">
                <img 
                  src="https://github.com/shivendrasoni.png" 
                  alt={personalData.name}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
          </FadeIn>
          
          <FadeIn delay={200}>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-black mb-4 uppercase leading-[0.9]">
              {personalData.name.split(' ').map((word, i) => (
                <span key={i} className="block">{word}</span>
              ))}
            </h1>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="inline-block bg-white border-2 border-black px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
              <p className="text-xl md:text-2xl font-bold font-mono tracking-tight">
                {personalData.title}
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={400}>
            <div className="max-w-3xl mx-auto bg-white border-2 border-black p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-black mt-2 flex-shrink-0" />
                  <p className="text-base md:text-lg font-semibold leading-relaxed">
                    <span className="font-black text-xl">Associate Director of AI at HighLevel</span>, leading a team of around <span className="font-black">10 brilliant engineers</span> in AI initiatives.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-black mt-2 flex-shrink-0" />
                  <p className="text-base md:text-lg font-medium leading-relaxed">
                    Previously led <span className="font-bold">35+ engineers at AmberStudent</span> in global student accommodation solutions.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-black mt-2 flex-shrink-0" />
                  <p className="text-base md:text-lg font-medium leading-relaxed">
                    Experienced with <span className="font-bold">Phonepe, Flipkart, Mindtickle, SAP Labs</span>. B.Tech from <span className="font-bold">IIIT</span>.
                  </p>
                </div>
                
                <div className="border-t-2 border-dashed border-black pt-4 mt-4">
                  <p className="text-sm md:text-base font-medium leading-relaxed text-gray-700">
                    Passionate about <span className="font-bold text-black">AI, Data Science, LLM development</span>, and fostering collaborative engineering culture. Active researcher in <span className="font-bold text-black">AI transparency and agent identification protocols</span>.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={500}>
            <div className="flex flex-col items-center gap-12">
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="bg-black text-white hover:bg-[#4ECDC4] hover:text-black border-2 border-black rounded-none h-14 px-8 text-lg font-bold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200">
                  <a href={`mailto:${personalData.email}`}>
                    LET'S TALK <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 md:gap-12 w-full max-w-3xl">
                {[
                  { label: "YEARS EXP.", value: "10+" },
                  { label: "ENGINEERS LED", value: "40+" },
                  { label: "PRODUCTS SCALED", value: "5+" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white border-2 border-black p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-3xl md:text-4xl font-black mb-1">{stat.value}</div>
                    <div className="text-xs md:text-sm font-mono font-bold">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-24 px-4 border-b-4 border-black bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-5xl md:text-7xl font-black mb-16 text-center uppercase tracking-tighter">
              Technical <span className="text-[#FF6B6B] underline decoration-4 decoration-black underline-offset-4">Arsenal</span>
            </h2>
          </FadeIn>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "LEADERSHIP", icon: Users, skills: personalData.skills.leadership, bg: "bg-[#FFE66D]" },
              { title: "TECHNICAL", icon: Code, skills: personalData.skills.technical, bg: "bg-[#4ECDC4]" },
              { title: "DOMAINS", icon: Globe, skills: personalData.skills.domains, bg: "bg-[#FF6B6B]" }
            ].map((category, idx) => (
              <FadeIn key={idx} delay={idx * 100}>
                <div className="h-full border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 bg-white">
                  <div className={`p-4 border-b-2 border-black ${category.bg} flex items-center gap-3`}>
                    <category.icon className="w-6 h-6" />
                    <h3 className="text-xl font-bold font-mono uppercase">{category.title}</h3>
                  </div>
                  <div className="p-6 flex flex-wrap gap-3">
                    {category.skills.map((skill, sIdx) => (
                      <span key={sIdx} className="px-3 py-1 text-sm font-bold border-2 border-black bg-white hover:bg-black hover:text-white transition-colors cursor-default shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-24 px-4 border-b-4 border-black bg-[#4ECDC4]">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-5xl md:text-7xl font-black mb-20 text-center uppercase tracking-tighter bg-white border-2 border-black inline-block px-8 py-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-1 mx-auto block w-fit">
              The Journey
            </h2>
          </FadeIn>

          <div className="space-y-12">
            {personalData.experience.map((exp, index) => (
              <FadeIn key={index} delay={index * 100}>
                <div className="relative bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200">
                  <div className="absolute -top-4 -left-4 bg-black text-white px-4 py-1 font-mono font-bold border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                    {exp.period}
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 mt-2">
                    <div>
                      <h3 className="text-2xl font-black uppercase">{exp.role}</h3>
                      <div className="flex items-center gap-2 text-lg font-bold mt-1">
                        <Briefcase className="w-5 h-5" />
                        <span className="underline decoration-2 underline-offset-2">{exp.company}</span>
                      </div>
                    </div>
                    {exp.type === 'current' && (
                      <Badge className="bg-[#FF6B6B] text-black border-2 border-black rounded-none px-3 py-1 font-bold animate-pulse">
                        CURRENT
                      </Badge>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {exp.highlights.map((highlight, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-3 text-base font-medium">
                        <span className="mt-1.5 w-2 h-2 bg-black flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="mb-20 text-center">
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
                Selected <span className="bg-[#FFE66D] px-2">Works</span>
              </h2>
              <p className="text-xl font-mono font-bold max-w-2xl mx-auto border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Innovation in AI, SaaS, and Infrastructure
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {personalData.projects.map((project, index) => {
              const card = (
                <div className="group h-full flex flex-col bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200">
                  <div className="p-6 border-b-2 border-black bg-slate-50 flex justify-between items-start">
                    <div className="p-2 bg-black text-white">
                      <Zap className="w-6 h-6" />
                    </div>
                    <Badge variant="outline" className="border-2 border-black rounded-none text-xs font-bold uppercase bg-[#FF6B6B] text-white">
                      {project.company}
                    </Badge>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-2xl font-black mb-3 uppercase leading-none">
                      {project.title}
                    </h3>
                    
                    <p className="text-sm font-medium leading-relaxed mb-6 flex-1">
                      {project.description}
                    </p>

                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.slice(0, 3).map((tech, tIdx) => (
                          <span key={tIdx} className="px-2 py-1 text-[10px] font-bold uppercase border border-black bg-[#E0E7FF]">
                            {tech}
                          </span>
                        ))}
                      </div>
                      
                      <div className="pt-4 border-t-2 border-black border-dashed">
                        <p className="text-xs font-bold flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {project.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );

              return (
                <FadeIn key={index} delay={index * 50}>
                  {project.link ? (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      aria-label={`Open ${project.title}`}
                    >
                      {card}
                    </a>
                  ) : (
                    card
                  )}
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t-4 border-black bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
              Let's Build <span className="text-[#4ECDC4]">Something</span> Cool
            </h2>
            <div className="flex gap-6 mt-4">
              <a href={`mailto:${personalData.email}`} className="hover:text-[#FF6B6B] transition-colors"><Mail className="w-8 h-8" /></a>
              <a href={personalData.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-[#4ECDC4] transition-colors"><Linkedin className="w-8 h-8" /></a>
              <a href={personalData.github} target="_blank" rel="noopener noreferrer" className="hover:text-[#FFE66D] transition-colors"><Code className="w-8 h-8" /></a>
            </div>
            <p className="text-sm font-mono mt-8 text-gray-400">
              © {new Date().getFullYear()} {personalData.name}. NO COOKIES. JUST CODE.
            </p>
          </div>
        </div>
      </footer>
      
      <SocialRail />
      <ChatWidget personalData={personalData} />
    </div>
  );
};

export default Portfolio;
