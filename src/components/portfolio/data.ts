import {
  Cloud, TrendingUp, Linkedin, ShieldCheck, Database, BadgeCheck, HeartPulse,
  BrainCircuit, Bot, Terminal, Code2, GitBranch, Cpu, Server, Workflow, Boxes,
  Container, Zap, Layers, Braces, Github, X, Instagram, BookOpen, MessageCircle,
  type LucideIcon,
} from 'lucide-react';

export const VIDEOS = {
  background: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_150203_44a5bd32-516a-47ce-a077-8acbf9aa8991.mp4',
  stat: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_154543_d5b83fc1-9cea-44f3-b5e8-8f325935211a.mp4',
  stack: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_153148_d7a3e1dd-e5d0-4ce6-8306-00d7522ecc44.mp4',
} as const;

export const PROFILE = {
  name: 'Shivendra Soni',
  firstName: 'Shivendra',
  title: 'Engineering & AI Leader',
  currentRole: 'Associate Director of AI at HighLevel',
  location: 'Pune, Maharashtra — India',
  email: 'shivendrasoni91@gmail.com',
  intro:
    'A Pune-based engineering and AI leader building agentic systems, LLM infrastructure, and the teams that ship them. A decade across PhonePe, Flipkart, Mindtickle and SAP Labs, now leading AI at HighLevel — and shipping products on the side.',
  statement:
    'I build AI products end to end — LLM pipelines, vector search, and agent tooling — and lead the engineering teams behind them. Most of my time goes into making AI systems reliable enough to trust in production.',
} as const;

export const LINKS = {
  github: 'https://github.com/shivendrasoni',
  linkedin: 'https://linkedin.com/in/shivendrasoni',
  x: 'https://x.com/oyegpt',
  instagram: 'https://instagram.com/oyegpt',
  blog: 'https://medium.com/@shivendrasoni',
  topmate: 'https://topmate.io/shivendra',
} as const;

export type Social = {
  icon: LucideIcon;
  href: string;
  label: string;
  handle: string;
  hoverClass: string;
};

export const SOCIALS: Social[] = [
  { icon: Github, href: LINKS.github, label: 'GitHub', handle: '@shivendrasoni', hoverClass: 'hover:border-white/45' },
  { icon: Linkedin, href: LINKS.linkedin, label: 'LinkedIn', handle: 'in/shivendrasoni', hoverClass: 'hover:border-[#0a66c2]/70' },
  { icon: X, href: LINKS.x, label: 'X', handle: '@oyegpt', hoverClass: 'hover:border-white/45' },
  { icon: Instagram, href: LINKS.instagram, label: 'Instagram', handle: '@oyegpt', hoverClass: 'hover:border-[#dc2743]/70' },
  { icon: BookOpen, href: LINKS.blog, label: 'Medium', handle: '@shivendrasoni', hoverClass: 'hover:border-white/45' },
  { icon: MessageCircle, href: LINKS.topmate, label: 'Topmate', handle: 'Book a 1:1', hoverClass: 'hover:border-[#4ECDC4]/70' },
];

export type Project = {
  name: string;
  tag: string;
  icon: LucideIcon;
  description: string;
  tech: string[];
  href?: string;
  featured?: boolean;
};

export const PROJECTS: Project[] = [
  {
    name: 'Infrajam',
    tag: 'SaaS',
    icon: Cloud,
    description:
      'Architect cloud infrastructure visually with AI. Design diagrams, generate cost estimates, and provision resources via Terraform in one workflow.',
    tech: ['AI', 'Terraform', 'Cloud Architecture', 'Cost Optimization'],
    href: 'https://infrajam.com',
    featured: true,
  },
  {
    name: 'Vibeward',
    tag: 'AI Security',
    icon: ShieldCheck,
    description:
      "Pioneering 'Vibe Security' for the AI era. A preventive layer that analyzes and secures the intent of AI-generated code before the first file is created.",
    tech: ['AI Security', 'Vibe Coding', 'LLM Safety'],
    href: 'https://vibeward.dev',
  },
  {
    name: 'Nuum',
    tag: 'SaaS',
    icon: TrendingUp,
    description:
      'A command center for social media growth. Research trends, generate high-impact content, and orchestrate publishing across X, LinkedIn and Instagram.',
    tech: ['Social Intelligence', 'Content AI', 'Multi-channel'],
    href: 'https://nuum.online',
  },
  {
    name: 'PostOracle',
    tag: 'SaaS',
    icon: Linkedin,
    description:
      'Professional growth on autopilot. An intelligent LinkedIn automation suite handling networking and engagement while keeping a human-like presence.',
    tech: ['LinkedIn Automation', 'Growth Engineering', 'AI Engagement'],
    href: 'https://postoracle.com',
  },
  {
    name: 'Vector Cache',
    tag: 'Open Source',
    icon: Database,
    description:
      'A streamlined Python library that speeds up LLM queries through semantic caching — faster responses at a fraction of the token cost.',
    tech: ['Python', 'LLM', 'Semantic Caching', 'Vector DBs'],
    href: 'https://github.com/shivendrasoni/vector-cache',
  },
  {
    name: 'AITM Protocol',
    tag: 'Research',
    icon: BadgeCheck,
    description:
      'AI Transparency Markup — a protocol for AI agent self-identification across text and voice interactions, published as independent research.',
    tech: ['Protocol Design', 'Voice', 'NLP'],
    href: 'https://www.linkedin.com/pulse/ai-transparency-markup-aitm-protocol-agent-text-voice-shivendra-soni-rawef',
  },
  {
    name: 'Medbot',
    tag: 'HealthTech · WIP',
    icon: HeartPulse,
    description:
      'Turns personal health records into insight. Ingests blood work and medical reports into a private RAG pipeline for trend analysis and natural language querying.',
    tech: ['RAG', 'Private AI', 'Health Data'],
    featured: true,
  },
];

export type Role = {
  years: string;
  role: string;
  company: string;
  location: string;
  current?: boolean;
  highlights: string[];
};

export const EXPERIENCE: Role[] = [
  {
    years: 'Jan 2025 — Now',
    role: 'Associate Director of AI',
    company: 'HighLevel',
    location: 'India',
    current: true,
    highlights: [
      'Lead AI initiatives and platform strategy with a team of ~10 engineers',
      'Build AI-powered marketing automation used across the platform',
      'Drive innovation in customer engagement technologies',
    ],
  },
  {
    years: 'Apr 2024 — Jan 2025',
    role: 'Associate Director of Engineering',
    company: 'Amber (AmberStudent)',
    location: 'Pune, India',
    highlights: [
      'Led AI-first initiatives across the platform',
      'Built comprehensive performance dashboards',
      'Drove technical strategy for global expansion',
    ],
  },
  {
    years: 'Jan 2023 — May 2024',
    role: 'Senior Software Engineering Manager',
    company: 'Amber (AmberStudent)',
    location: 'Pune, India',
    highlights: [
      'Scaled the engineering team from 5 to 40+ members',
      'Led mobile app development to 200k+ downloads',
      'Spearheaded technical initiatives for China market entry',
    ],
  },
  {
    years: '2014 — 2023',
    role: 'Senior Engineering Roles',
    company: 'PhonePe · Flipkart · Mindtickle · SAP Labs',
    location: 'India',
    highlights: [
      'PhonePe — payment processing systems at scale',
      'Flipkart — e-commerce platform development',
      'Mindtickle — SaaS platform engineering',
      'SAP Labs — enterprise software solutions',
    ],
  },
];

export const TIMELINE: { years: string; role: string; company: string }[] = [
  { years: '2025-Now', role: 'Associate Director of AI', company: 'HighLevel' },
  { years: '2024-2025', role: 'Associate Director, Eng', company: 'Amber' },
  { years: '2023-2024', role: 'Sr. Engineering Manager', company: 'Amber' },
  { years: '2014-2023', role: 'Engineering Roles', company: 'PhonePe · Flipkart' },
  { years: '2010-2014', role: 'B.Tech, Info Tech', company: 'IIIT' },
];

export const EDUCATION = {
  degree: 'B.Tech in Information Technology',
  institution: 'Indian Institute of Information Technology',
  period: '2010 — 2014',
} as const;

export const AWARDS: string[] = [
  'Multi-Dimensional Visual Analytics Patent — US 20170039741',
  'First Runners Up — What the Hack 2.0',
  "1st prize — Go-hack '17, Gojek",
  'Intel IoT Roadshow Finalist',
  'ET Power of Ideas — Top 50',
  '.Net Idea Innovation Challenge — IIT Delhi',
];

export const SKILLS = {
  leadership: ['Team Leadership', 'Strategic Thinking', 'Technical Design', 'Mentoring'],
  technical: ['AI/ML', 'LLM Development', 'Vector Databases', 'System Architecture', 'Data Science', 'Cloud', 'Microservices'],
  domains: ['FinTech', 'E-commerce', 'EdTech', 'PropTech', 'SaaS', 'AI Security'],
} as const;

export const STACK_ICONS: LucideIcon[] = [
  BrainCircuit, Bot, Database, Cloud, Terminal, Code2, GitBranch, Cpu,
  Server, Workflow, Boxes, Container, Zap, Layers, Braces, Github,
];

export const PERSONAL_DATA = {
  name: PROFILE.name,
  title: PROFILE.title,
  currentRole: PROFILE.currentRole,
  location: PROFILE.location,
  email: PROFILE.email,
  summary: PROFILE.statement,
  links: LINKS,
  skills: SKILLS,
  experience: EXPERIENCE,
  projects: PROJECTS.map(({ name, tag, description, tech, href }) => ({ name, tag, description, tech, href })),
  education: EDUCATION,
  awards: AWARDS,
};
