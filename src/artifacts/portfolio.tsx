import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Linkedin, Briefcase, Code, Zap, Users, TrendingUp, 
  Globe, MessageCircle, Terminal, ChevronDown, ArrowRight
} from 'lucide-react';

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
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Portfolio = () => {
  const personalData = {
    name: "Shivendra Soni",
    title: "Engineering & AI Leader",
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
        impact: "Empowers creators to scale their digital presence through data-driven content lifecycles"
      },
      {
        title: "PostOracle.com",
        company: "SaaS",
        description: "Put your professional growth on autopilot. An intelligent LinkedIn automation suite that handles networking and engagement while maintaining a human-like presence.",
        technologies: ["LinkedIn Automation", "Growth Engineering", "AI Engagement"],
        impact: "Drives consistent professional visibility and network expansion with zero manual effort"
      },
      {
        title: "Vibeward.dev",
        company: "SaaS",
        description: "Pioneering 'Vibe Security' for the AI era. A preventive security layer that analyzes and secures the intent of AI-generated code before the first file is even created.",
        technologies: ["AI Security", "Vibe Coding", "Preventive Analysis", "LLM Safety"],
        impact: "Establishes a new paradigm of security-by-design for AI-assisted development"
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
        impact: "Reduces LLM costs and response times through semantic similarity caching"
      },
      {
        title: "AI Transparency Markup (AITM)",
        company: "Self Research",
        description: "A protocol for AI Agent self-identification in text and voice interactions, promoting transparency in AI communications.",
        technologies: ["AI/ML", "Protocol Design", "Voice Recognition", "NLP"],
        impact: "Published research on AI transparency and agent identification"
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
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-sans relative">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
           style={{ 
             backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, 
             backgroundSize: '40px 40px' 
           }}>
      </div>
      
      {/* Radial Gradient Glow */}
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none z-0"></div>

      {/* Fixed Dev Mode Button */}
      <div className="fixed top-6 right-6 z-50">
        <Button 
          asChild 
          className="bg-slate-900/80 hover:bg-indigo-600 text-slate-200 border border-slate-700 hover:border-indigo-500 backdrop-blur-md transition-all duration-300 rounded-full px-6 py-2 shadow-2xl group"
        >
          <a href="/" title="Switch to Terminal Mode" className="flex items-center gap-2">
            <Terminal className="w-4 h-4 group-hover:text-white transition-colors" />
            <span className="font-medium tracking-wide">Dev Mode</span>
          </a>
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 pt-20 pb-16 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <FadeIn delay={100}>
            <div className="inline-block p-1 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 mb-6 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]">
              <div className="bg-slate-950 rounded-full p-1">
                 <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-900">
                   <img 
                     src="https://github.com/shivendrasoni.png" 
                     alt={personalData.name}
                     className="w-full h-full object-cover"
                   />
                 </div>
              </div>
            </div>
          </FadeIn>
          
          <FadeIn delay={200}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400">
              {personalData.name}
            </h1>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="flex flex-col items-center gap-4">
              <p className="text-2xl md:text-3xl text-indigo-400 font-light tracking-wide">
                {personalData.title}
              </p>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                {personalData.currentRole}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={400}>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
              {personalData.summary}
            </p>
          </FadeIn>

          <FadeIn delay={500}>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-white text-slate-950 hover:bg-slate-200 font-semibold rounded-full px-8 h-12 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.4)] transition-all">
                <a href={`mailto:${personalData.email}`}>
                  Contact Me <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
              <div className="flex gap-3">
                {[
                  { icon: Linkedin, href: personalData.linkedin, label: "LinkedIn" },
                  { icon: Globe, href: personalData.blog, label: "Blog" },
                  { icon: MessageCircle, href: personalData.topmate, label: "Topmate" }
                ].map((social, idx) => (
                  <a 
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-300"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-slate-600">
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px bg-slate-800 flex-1"></div>
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center">Technical Arsenal</h2>
              <div className="h-px bg-slate-800 flex-1"></div>
            </div>
          </FadeIn>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Leadership", icon: Users, skills: personalData.skills.leadership, color: "text-blue-400", bg: "bg-blue-500/10" },
              { title: "Technical", icon: Code, skills: personalData.skills.technical, color: "text-indigo-400", bg: "bg-indigo-500/10" },
              { title: "Domains", icon: Globe, skills: personalData.skills.domains, color: "text-purple-400", bg: "bg-purple-500/10" }
            ].map((category, idx) => (
              <FadeIn key={idx} delay={idx * 100}>
                <div className="h-full p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-sm hover:border-indigo-500/30 hover:bg-slate-900/80 transition-all duration-300 group">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl ${category.bg} ${category.color} group-hover:scale-110 transition-transform duration-300`}>
                      <category.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-100">{category.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.skills.map((skill, sIdx) => (
                      <span key={sIdx} className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-800 hover:border-indigo-500/30 transition-colors cursor-default">
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
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-4 mb-16">
              <div className="h-px bg-slate-800 flex-1"></div>
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center">Journey</h2>
              <div className="h-px bg-slate-800 flex-1"></div>
            </div>
          </FadeIn>

          <div className="space-y-8 relative">
            {/* Continuous Line */}
            <div className="absolute left-[28px] md:left-[50%] top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500 via-slate-800 to-slate-900 md:-translate-x-1/2" />

            {personalData.experience.map((exp, index) => (
              <FadeIn key={index} delay={index * 100}>
                <div className={`relative flex flex-col md:flex-row gap-8 md:gap-0 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-[28px] md:left-1/2 w-4 h-4 rounded-full bg-slate-950 border-4 border-indigo-500 md:-translate-x-1/2 mt-1.5 z-10 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />

                  {/* Content Card */}
                  <div className="ml-16 md:ml-0 md:w-1/2 md:px-12">
                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 group hover:shadow-xl hover:shadow-indigo-500/5">
                      <div className="flex flex-col gap-1 mb-4">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{exp.role}</h3>
                          <span className="md:hidden text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">{exp.period}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Briefcase className="w-4 h-4 text-indigo-500" />
                          <span className="font-medium">{exp.company}</span>
                        </div>
                      </div>
                      <ul className="space-y-3">
                        {exp.highlights.map((highlight, hIdx) => (
                          <li key={hIdx} className="flex items-start gap-3 text-slate-400 text-sm leading-relaxed">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Date Label (Desktop) */}
                  <div className={`hidden md:flex md:w-1/2 md:px-12 items-start pt-2 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <span className="text-indigo-400 font-mono text-sm tracking-wider bg-indigo-500/5 px-3 py-1 rounded border border-indigo-500/10">
                      {exp.period}
                    </span>
                  </div>

                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-4 mb-16">
              <div className="h-px bg-slate-800 flex-1"></div>
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center">Selected Works</h2>
              <div className="h-px bg-slate-800 flex-1"></div>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalData.projects.map((project, index) => (
              <FadeIn key={index} delay={index * 50}>
                <div className="group h-full rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col relative">
                  {/* Decorative Gradient Blob */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-500" />
                  
                  <div className="p-8 relative z-10 flex flex-col h-full">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-lg">
                          <Zap className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" className="border-slate-700 bg-slate-900/50 text-slate-400 text-[10px] uppercase tracking-wider px-2 py-0.5">
                          {project.company}
                        </Badge>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors">
                        {project.title}
                      </h3>
                      
                      <p className="text-slate-400 leading-relaxed text-sm mb-6">
                        {project.description}
                      </p>
                    </div>

                    <div className="mt-auto">
                      <div className="flex flex-wrap gap-2 mb-6">
                        {project.technologies.slice(0, 3).map((tech, tIdx) => (
                          <span key={tIdx} className="px-2 py-1 text-[10px] uppercase font-semibold tracking-wide rounded bg-slate-800/50 text-slate-300 border border-slate-700/50">
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 3 && (
                          <span className="px-2 py-1 text-[10px] rounded bg-slate-800/30 text-slate-500 border border-slate-800">
                            +{project.technologies.length - 3}
                          </span>
                        )}
                      </div>
                      
                      <div className="pt-4 border-t border-slate-800/50">
                        <p className="text-xs font-medium text-indigo-300 flex items-start gap-2">
                          <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {project.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800 bg-slate-950 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
            <span>© {new Date().getFullYear()} {personalData.name}</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="text-slate-600">Built with React & Tailwind</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;