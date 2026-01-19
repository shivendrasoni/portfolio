import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Linkedin, Mail, ExternalLink, MapPin, Calendar, Award, Briefcase, GraduationCap, Code, Zap, Users, TrendingUp, Globe, MessageCircle, Terminal } from 'lucide-react';

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
        title: "Vector Cache",
        company: "Open Source",
        description: "A streamlined Python library that enhances LLM query performance through semantic caching, making responses faster and more cost-effective.",
        technologies: ["Python", "LLM", "Semantic Caching", "Vector Databases"],
        impact: "Reduces LLM costs and response times through semantic similarity caching"
      },
      {
        title: "AI Transparency Markup (AITM)",
        company: "Research",
        description: "A protocol for AI Agent self-identification in text and voice interactions, promoting transparency in AI communications.",
        technologies: ["AI/ML", "Protocol Design", "Voice Recognition", "NLP"],
        impact: "Published research on AI transparency and agent identification"
      },
      {
        title: "AI-Powered Marketing Automation",
        company: "HighLevel",
        description: "Leading development of intelligent marketing automation features using machine learning to optimize customer engagement and conversion rates.",
        technologies: ["AI/ML", "Python", "TensorFlow", "AWS", "Microservices"],
        impact: "Improving customer conversion rates and engagement metrics"
      },
      {
        title: "Global Student Housing Platform",
        company: "Amber",
        description: "Built and scaled a comprehensive platform connecting students with accommodation worldwide, serving multiple markets including UK, US, Australia, and China.",
        technologies: ["React", "Node.js", "PostgreSQL", "AWS", "Docker"],
        impact: "200k+ mobile app downloads, expanded to 10+ countries"
      },
      {
        title: "Performance Analytics Dashboard",
        company: "Amber", 
        description: "Designed and implemented real-time performance dashboards providing insights into business metrics, user behavior, and operational efficiency.",
        technologies: ["React", "D3.js", "Python", "Apache Kafka", "Redis"],
        impact: "Enhanced decision-making with real-time business insights"
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
    <div className="min-h-screen bg-gradient-to-br from-[#2B2D42] via-[#1A237E] to-[#2B2D42] relative">
      {/* Dev Mode Button - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <Button asChild className="bg-[#F3C832] hover:bg-[#F3C832]/90 text-[#1A237E] border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold rounded-full px-4 py-2">
          <a href="/" title="Switch to Terminal Mode">
            <Terminal className="w-4 h-4 mr-2" />
            Dev Mode
          </a>
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#F3C832]/10 to-[#1A237E]/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[#F3C832] to-[#1A237E] rounded-full flex items-center justify-center text-4xl font-bold text-white mb-6 shadow-2xl">
                SS
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
                {personalData.name}
              </h1>
              <h2 className="text-2xl md:text-3xl text-[#F3C832] mb-4 font-light">
                {personalData.title}
              </h2>
              <p className="text-xl text-[#F5F6FA] mb-2">
                {personalData.currentRole}
              </p>
              <div className="flex items-center justify-center text-[#F5F6FA]/80 mb-8">
                <MapPin className="w-4 h-4 mr-2" />
                {personalData.location}
              </div>
            </div>
            
            <p className="text-lg text-[#F5F6FA]/90 max-w-3xl mx-auto mb-12 leading-relaxed">
              {personalData.summary}
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-[#F3C832] hover:bg-[#F3C832]/90 text-[#1A237E] border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold">
                <a href={`mailto:${personalData.email}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Get in Touch
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-[#F3C832] text-[#F3C832] hover:bg-[#F3C832] hover:text-[#1A237E] hover:border-[#F3C832] bg-transparent transition-all duration-200 font-semibold">
                <a href={personalData.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-[#F5F6FA] text-[#F5F6FA] hover:bg-[#F5F6FA] hover:text-[#1A237E] hover:border-[#F5F6FA] bg-transparent transition-all duration-200 font-semibold">
                <a href={personalData.blog} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Blog
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 bg-[#F5F6FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1A237E] mb-4">Skills & Expertise</h2>
            <p className="text-xl text-[#2B2D42]">Core competencies across leadership, technology, and business domains</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white border-[#1A237E]/20 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-[#1A237E] flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Leadership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {personalData.skills.leadership.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-[#F3C832]/20 text-[#1A237E] border-[#F3C832]/50 hover:bg-[#F3C832]/30">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-[#1A237E]/20 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-[#1A237E] flex items-center">
                  <Code className="w-5 h-5 mr-2" />
                  Technical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {personalData.skills.technical.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-[#1A237E]/10 text-[#1A237E] border-[#1A237E]/30 hover:bg-[#1A237E]/20">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-[#1A237E]/20 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-[#1A237E] flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Domains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {personalData.skills.domains.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-[#2B2D42]/10 text-[#2B2D42] border-[#2B2D42]/30 hover:bg-[#2B2D42]/20">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-20 bg-[#2B2D42]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Experience</h2>
            <p className="text-xl text-[#F5F6FA]">Building and leading engineering teams at scale</p>
          </div>
          
          <div className="space-y-8">
            {personalData.experience.map((exp, index) => (
              <Card key={index} className={`bg-white border-[#1A237E]/20 shadow-lg hover:shadow-xl transition-shadow duration-200 ${exp.type === 'current' ? 'ring-2 ring-[#F3C832]' : ''}`}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-[#1A237E] flex items-center mb-2">
                        <Briefcase className="w-5 h-5 mr-2 text-[#F3C832]" />
                        {exp.role}
                        {exp.type === 'current' && (
                          <Badge className="ml-2 bg-[#F3C832] text-[#1A237E] font-semibold">Current</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-[#1A237E] text-lg font-medium">
                        {exp.company}
                      </CardDescription>
                    </div>
                    <div className="text-[#2B2D42] flex items-center mt-2 md:mt-0">
                      <Calendar className="w-4 h-4 mr-2" />
                      {exp.period}
                    </div>
                  </div>
                  {exp.location && (
                    <div className="flex items-center text-[#2B2D42] mt-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      {exp.location}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {exp.highlights.map((highlight, idx) => (
                      <li key={idx} className="text-[#2B2D42] flex items-start">
                        <TrendingUp className="w-4 h-4 mr-2 mt-1 text-[#F3C832] flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-20 bg-[#F5F6FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1A237E] mb-4">Key Projects</h2>
            <p className="text-xl text-[#2B2D42]">Impactful solutions across AI, platforms, and analytics</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {personalData.projects.map((project, index) => (
              <Card key={index} className="bg-white border-[#1A237E]/20 hover:border-[#F3C832] transition-colors shadow-lg hover:shadow-xl duration-200">
                <CardHeader>
                  <CardTitle className="text-[#1A237E] flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-[#F3C832]" />
                    {project.title}
                  </CardTitle>
                  <CardDescription className="text-[#1A237E] font-medium">
                    {project.company}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[#2B2D42] leading-relaxed">
                    {project.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, idx) => (
                      <Badge key={idx} variant="outline" className="border-[#1A237E]/30 text-[#1A237E] hover:bg-[#1A237E]/10">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="pt-2 border-t border-[#1A237E]/20">
                    <p className="text-[#F3C832] text-sm font-medium flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {project.impact}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Education & Awards */}
      <section className="py-20 bg-[#2B2D42]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Education */}
            <div>
              <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
                <GraduationCap className="w-8 h-8 mr-3 text-[#F3C832]" />
                Education
              </h3>
              <Card className="bg-white border-[#1A237E]/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#1A237E]">{personalData.education.degree}</CardTitle>
                  <CardDescription className="text-[#1A237E] text-lg font-medium">
                    {personalData.education.institution}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-[#2B2D42]">
                    <Calendar className="w-4 h-4 mr-2" />
                    {personalData.education.period}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Awards */}
            <div>
              <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
                <Award className="w-8 h-8 mr-3 text-[#F3C832]" />
                Recognition
              </h3>
              <div className="space-y-4">
                {personalData.awards.map((award, index) => (
                  <Card key={index} className="bg-white border-[#1A237E]/20 shadow-lg">
                    <CardContent className="p-4">
                      <p className="text-[#1A237E] flex items-center">
                        <Award className="w-4 h-4 mr-2 text-[#F3C832]" />
                        {award}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-r from-[#1A237E] to-[#2B2D42]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Let's Connect</h2>
          <p className="text-xl text-[#F5F6FA] mb-12">
            Interested in collaboration, mentoring, or discussing engineering leadership? Let's talk!
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Button asChild variant="outline" size="lg" className="border-2 border-[#F3C832] text-[#F3C832] hover:bg-[#F3C832] hover:text-[#1A237E] hover:border-[#F3C832] bg-transparent transition-all duration-200 font-semibold">
              <a href={`mailto:${personalData.email}`}>
                <Mail className="w-5 h-5 mr-2" />
                Email
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-2 border-[#F5F6FA] text-[#F5F6FA] hover:bg-[#F5F6FA] hover:text-[#1A237E] hover:border-[#F5F6FA] bg-transparent transition-all duration-200 font-semibold">
              <a href={personalData.linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-5 h-5 mr-2" />
                LinkedIn
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-2 border-[#F3C832] text-[#F3C832] hover:bg-[#F3C832] hover:text-[#1A237E] hover:border-[#F3C832] bg-transparent transition-all duration-200 font-semibold">
              <a href={personalData.topmate} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5 mr-2" />
                Topmate
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-2 border-[#F5F6FA] text-[#F5F6FA] hover:bg-[#F5F6FA] hover:text-[#1A237E] hover:border-[#F5F6FA] bg-transparent transition-all duration-200 font-semibold">
              <a href={personalData.blog} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-5 h-5 mr-2" />
                Blog
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#000000] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Separator className="mb-8 bg-[#2B2D42]" />
          <div className="text-center text-[#F5F6FA]">
            <p>&copy; 2025 {personalData.name}. Building the future, one team at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;