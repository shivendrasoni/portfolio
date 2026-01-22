import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowRight, Terminal, User, Briefcase, Code } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Welcome
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Choose your preferred way to explore Shivendra's professional journey
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Portfolio Page */}
          <Card className="bg-slate-800/80 border-slate-700 hover:border-blue-500/50 transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Portfolio</CardTitle>
              <CardDescription className="text-slate-300 text-lg">
                Modern, visual portfolio experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400 leading-relaxed">
                Beautifully designed portfolio showcasing experience, skills, projects, and achievements in a modern, professional layout.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-900/50 text-blue-200 text-sm">
                  <Briefcase className="w-3 h-3 mr-1" />
                  Experience
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-900/50 text-purple-200 text-sm">
                  <Code className="w-3 h-3 mr-1" />
                  Projects
                </span>
              </div>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <a href="/">
                  View Portfolio
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Terminal Experience */}
          <Card className="bg-slate-800/80 border-slate-700 hover:border-green-500/50 transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Terminal className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Terminal</CardTitle>
              <CardDescription className="text-slate-300 text-lg">
                Interactive command-line experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400 leading-relaxed">
                Unique terminal-style interface where you can explore information using command-line interactions. Perfect for developers!
              </p>
              <div className="bg-slate-900/50 p-3 rounded-md font-mono text-sm text-green-400 mb-4">
                <div className="flex items-center">
                  <span className="text-slate-500">$</span>
                  <span className="ml-2">help</span>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full border-green-600 text-green-400 hover:bg-green-600 hover:text-white">
                <a href="/terminal">
                  Enter Terminal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-500 text-sm">
            Built with React, TypeScript, and Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;