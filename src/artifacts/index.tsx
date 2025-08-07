import { useState, useEffect, useRef } from 'react';
import { OpenAI } from 'openai';

// Type definitions
interface HistoryEntry {
  type: 'input' | 'output';
  content: string;
}

interface AIResponse {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  sources_used: string[];
  follow_up_questions?: string[];
}

// Personal Data Constants
const PERSONAL_DATA = {
  name: "Shivendra Soni",
  title: "Engineering & AI Leader | Highlevel | GenAI Consultant",
  location: "Pune, Maharashtra, India",
  email: "shivendrasoni91@gmail.com",
  linkedin: "linkedin.com/in/shivendrasoni",
  blog: "medium.com/@shivendrasoni",
  topmate: "topmate.io/shivendra",
  summary: "Associate Director of Engineering at AmberStudent, leading 35+ engineers in global student accommodation solutions. 10+ years experience with Phonepe, Flipkart, Mindtickle, SAP Labs. B.Tech from IIIT, passionate about Data Science and fostering collaborative engineering culture.",
  skills: ["Communication", "Technical Design", "Strategic Thinking", "Team Leadership", "System Architecture"],
  experience: [
    {
      company: "HighLevel",
      role: "Associate Director of AI",
      period: "Jan 2025 - Present",
      location: "India"
    },
    {
      company: "Amber",
      role: "Associate Director of Engineering",
      period: "Apr 2024 - Jan 2025",
      highlights: ["AI First initiatives", "Performance dashboards"]
    },
    {
      company: "Amber",
      role: "Senior Software Engineering Manager", 
      period: "Jan 2023 - May 2024",
      highlights: ["Scaled team 5→40 members", "Mobile app: 200k downloads", "China market entry"]
    }
  ],
  education: "B.Tech Information Technology, Indian Institute of Information Technology (2010-2014)",
  awards: ["First Runners Up - What the Hack 2.0", "Intel IoT Roadshow Finalist", "ET Power of Ideas Top 50"]
};

const firstName = PERSONAL_DATA.name.toLowerCase().split(' ')[0].replace(' ', '')

// ASCII Art Constants - Desktop versions
const SHIVENDRA_ASCII_ART = `
    ███████╗██╗  ██╗██╗██╗   ██╗███████╗███╗   ██╗██████╗ ██████╗  █████╗ 
    ██╔════╝██║  ██║██║██║   ██║██╔════╝████╗  ██║██╔══██╗██╔══██╗██╔══██╗
    ███████╗███████║██║██║   ██║█████╗  ██╔██╗ ██║██║  ██║██████╔╝███████║
    ╚════██║██╔══██║██║╚██╗ ██╔╝██╔══╝  ██║╚██╗██║██║  ██║██╔══██╗██╔══██║
    ███████║██║  ██║██║ ╚████╔╝ ███████╗██║ ╚████║██████╔╝██║  ██║██║  ██║
    ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝

                      ███████╗ ██████╗ ███╗   ██╗██╗
                      ██╔════╝██╔═══██╗████╗  ██║██║
                      ███████╗██║   ██║██╔██╗ ██║██║
                      ╚════██║██║   ██║██║╚██╗██║██║
                      ███████║╚██████╔╝██║ ╚████║██║
                      ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝

                    Welcome to ${firstName}'s Terminal Portfolio!
                    Type "help" to see available commands.
                    Type '/portfolio' to see a visual portfolio.
`;

const GENERIC_ASCII_ART = `
████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗     
╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║     
   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║     
   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║     
   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝

██████╗  ██████╗ ██████╗ ████████╗███████╗ ██████╗ ██╗     ██╗ ██████╗ 
██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██║     ██║██╔═══██╗
██████╔╝██║   ██║██████╔╝   ██║   █████╗  ██║   ██║██║     ██║██║   ██║
██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══╝  ██║   ██║██║     ██║██║   ██║
██║     ╚██████╔╝██║  ██║   ██║   ██║     ╚██████╔╝███████╗██║╚██████╔╝
╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ 

                    Welcome to Terminal Portfolio!
                    Type "help" to see available commands.
                    Type '/portfolio' to see a visual portfolio.
`;

// Mobile-friendly ASCII Art - Smaller and simpler
const SHIVENDRA_ASCII_ART_MOBILE = `
  ███████╗██╗  ██╗██╗██╗   ██╗
  ██╔════╝██║  ██║██║██║   ██║
  ███████╗███████║██║██║   ██║
  ╚════██║██╔══██║██║╚██╗ ██╔╝
  ███████║██║  ██║██║ ╚████╔╝ 
  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝  

    ███████╗ ██████╗ ███╗   ██╗██╗
    ██╔════╝██╔═══██╗████╗  ██║██║
    ███████╗██║   ██║██╔██╗ ██║██║
    ╚════██║██║   ██║██║╚██╗██║██║
    ███████║╚██████╔╝██║ ╚████║██║
    ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝

    Welcome to ${firstName}'s Terminal!
    Type "help" for commands.
`;

const GENERIC_ASCII_ART_MOBILE = `
████████╗███████╗██████╗ ███╗   ███╗
╚══██╔══╝██╔════╝██╔══██╗████╗ ████║
   ██║   █████╗  ██████╔╝██╔████╔██║
   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║
   ██║   ███████╗██║  ██║██║ ╚═╝ ██║
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝

██████╗  ██████╗ ██████╗ ████████╗
██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
██████╔╝██║   ██║██████╔╝   ██║   
██╔═══╝ ██║   ██║██╔══██╗   ██║   
██║     ╚██████╔╝██║  ██║   ██║   
╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   

    Welcome to Terminal Portfolio!
    Type "help" for commands.
`;

const TerminalPortfolio = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentPath] = useState('~');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Detect screen size for responsive ASCII art
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // Mobile breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    // Determine which ASCII art to use based on the name and screen size
    const isShivendra = PERSONAL_DATA.name.toLowerCase().includes('shivendra');
    let asciiArt;
    
    if (isMobile) {
      asciiArt = isShivendra ? SHIVENDRA_ASCII_ART_MOBILE : GENERIC_ASCII_ART_MOBILE;
    } else {
      asciiArt = isShivendra ? SHIVENDRA_ASCII_ART : GENERIC_ASCII_ART;
    }
    
    setHistory([
      { type: 'output', content: asciiArt },
      { type: 'output', content: '' }
    ]);
  }, [isMobile]);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isProcessing]);

  const addToHistory = (type: 'input' | 'output', content: string) => {
    setHistory(prev => [...prev, { type, content }]);
  };

  const askAI = async (question: string) => {
    setIsProcessing(true);
    addToHistory('output', 'AI Assistant is thinking...');
  
    try {
              const client = new OpenAI({
          apiKey: import.meta.env.VITE_OPENAI_API_KEY,
          baseURL: "https://openrouter.ai/api/v1",
          dangerouslyAllowBrowser: true
        });
      
      const systemPrompt = `You are an AI assistant helping answer questions about ${PERSONAL_DATA.name}'s professional background. 
  
  You must respond in valid JSON format with this exact structure:
  {
  "answer": "Your detailed response here",
  "confidence": "high|medium|low",
  "sources_used": ["resume_data", "web_search"],
  "follow_up_questions": ["Optional follow-up question 1", "Optional follow-up question 2"]
  }
  
  Guidelines:
  - Use "high" confidence for information directly from resume data
  - Use "medium" confidence for reasonable inferences
  - Use "low" confidence when information is limited
  - Include "resume_data" in sources_used when using provided data
  - Include "web_search" in sources_used if you need to search (but note: actual web search may be limited)
  - Provide 1-3 relevant follow-up questions when appropriate
  - Keep the answer concise but informative`;
  
      const userPrompt = `Here's ${PERSONAL_DATA.name}'s resume data:
  
  Name: ${PERSONAL_DATA.name}
  Title: ${PERSONAL_DATA.title}
  Location: ${PERSONAL_DATA.location}
  Contact: ${PERSONAL_DATA.email}
  Summary: ${PERSONAL_DATA.summary}
  
  Skills: ${PERSONAL_DATA.skills.join(', ')}
  
  Recent Experience:
  ${PERSONAL_DATA.experience.map(exp => 
  `- ${exp.role} at ${exp.company} (${exp.period})${exp.highlights ? ': ' + exp.highlights.join(', ') : ''}`
  ).join('\n')}
  
  Education: ${PERSONAL_DATA.education}
  Awards: ${PERSONAL_DATA.awards.join(', ')}
  
  Question: ${question}`;
  
      const response = await client.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });
  
      const rawResponse = response.choices[0]?.message?.content || "{}";
      
      // Parse the structured response
      let parsedResponse: AIResponse;
      try {
        parsedResponse = JSON.parse(rawResponse) as AIResponse;
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        parsedResponse = {
          answer: rawResponse || "No response received",
          confidence: "low",
          sources_used: ["resume_data"]
        };
      }
      
      // Display the formatted response
      addToHistory('output', '🤖 AI Response:');
      addToHistory('output', parsedResponse.answer);
      
      // Add confidence indicator
      const confidenceEmoji = parsedResponse.confidence === 'high' ? '🟢' : 
                             parsedResponse.confidence === 'medium' ? '🟡' : '🔴';
      addToHistory('output', `\n${confidenceEmoji} Confidence: ${parsedResponse.confidence.toUpperCase()}`);
      
      // Add sources used
      if (parsedResponse.sources_used && parsedResponse.sources_used.length > 0) {
        addToHistory('output', `📚 Sources: ${parsedResponse.sources_used.join(', ')}`);
      }
      
      // Add follow-up questions if available
      if (parsedResponse.follow_up_questions && parsedResponse.follow_up_questions.length > 0) {
        addToHistory('output', '\n💡 Follow-up questions:');
        parsedResponse.follow_up_questions.forEach((question: string, index: number) => {
          addToHistory('output', `  ${index + 1}. ${question}`);
        });
      }
    } catch (error: any) {
      console.error('AI request failed:', error);
      
      // More detailed error messages
      if (error.status === 401) {
        addToHistory('output', '❌ Authentication Error: Please check your OpenRouter API key in the .env file.');
      } else if (error.status === 429) {
        addToHistory('output', '❌ Rate Limit Error: Too many requests. Please try again later.');
      } else if (error.status === 400) {
        addToHistory('output', '❌ Bad Request: Invalid model or parameters.');
      } else {
        addToHistory('output', `❌ Error: ${error.message || 'Unable to process AI request. Please try again.'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const fileSystem: Record<string, string> = {
    'about.md': PERSONAL_DATA.summary,
    'experience.md': PERSONAL_DATA.experience.map(exp => 
      `${exp.company} - ${exp.role} (${exp.period})\n${exp.highlights ? exp.highlights.map(h => `• ${h}`).join('\n') : ''}`
    ).join('\n\n'),
    'skills.md': PERSONAL_DATA.skills.join('\n'),
    'contact.md': `Email: ${PERSONAL_DATA.email}\nLinkedIn: ${PERSONAL_DATA.linkedin}\nBlog: ${PERSONAL_DATA.blog}\nTopmate: ${PERSONAL_DATA.topmate}`,
    'awards.md': PERSONAL_DATA.awards.join('\n'),
    'education.md': PERSONAL_DATA.education,
    'README.md': `# ${PERSONAL_DATA.name}\n${PERSONAL_DATA.title}\n\n${PERSONAL_DATA.summary}`
  };

  const executeCommand = async (cmd: string) => {
    const [command, ...args] = cmd.trim().split(' ');
    const argument = args.join(' ');

    addToHistory('input', `${currentPath} $ ${cmd}`);

    switch (command.toLowerCase()) {
      case 'help':
        addToHistory('output', 'Available commands:');
        addToHistory('output', '  Basic Commands:');
        addToHistory('output', '    help          - Show this help message');
        addToHistory('output', '    clear         - Clear terminal');
        addToHistory('output', '    exit          - Close terminal (refresh page)');
        addToHistory('output', '');
        addToHistory('output', '  File Operations:');
        addToHistory('output', '    ls            - List files');
        addToHistory('output', '    cat <file>    - Display file contents');
        addToHistory('output', '    head <file>   - Show first 10 lines');
        addToHistory('output', '    tail <file>   - Show last 10 lines');
        addToHistory('output', '    wc <file>     - Word count');
        addToHistory('output', '');
        addToHistory('output', '  Search & Filter:');
        addToHistory('output', '    grep <term>   - Search across all files');
        addToHistory('output', '    find <term>   - Find files containing term');
        addToHistory('output', '');
        addToHistory('output', '  System Info:');
        addToHistory('output', '    whoami        - Show current user');
        addToHistory('output', '    pwd           - Show current directory');
        addToHistory('output', '    date          - Show current date/time');
        addToHistory('output', '    uname         - Show system info');
        addToHistory('output', '');
        addToHistory('output', '  Portfolio Commands:');
        addToHistory('output', '    about         - Show summary');
        addToHistory('output', '    experience    - Show work experience');
        addToHistory('output', '    skills        - Show technical skills');
        addToHistory('output', '    education     - Show educational background');
        addToHistory('output', '    awards        - Show honors and awards');
        addToHistory('output', '    contact       - Show contact information');
        addToHistory('output', '');
        addToHistory('output', '  AI Assistant:');
        addToHistory('output', '    /ask [query]  - Ask AI about my background');
        addToHistory('output', '');
        addToHistory('output', '  Navigation:');
        addToHistory('output', '    /portfolio    - Switch to visual portfolio');
        break;

      case 'about':
      case 'summary':
        addToHistory('output', `👨‍💻 ${PERSONAL_DATA.name}`);
        addToHistory('output', `📍 ${PERSONAL_DATA.location}`);
        addToHistory('output', '');
        addToHistory('output', PERSONAL_DATA.summary);
        break;

      case 'experience':
      case 'work':
        addToHistory('output', '💼 Work Experience:');
        addToHistory('output', '');
        PERSONAL_DATA.experience.forEach(exp => {
          addToHistory('output', `🏢 ${exp.company}`);
          addToHistory('output', `   ${exp.role}`);
          addToHistory('output', `   ${exp.period}`);
          if (exp.highlights) {
            exp.highlights.forEach(highlight => {
              addToHistory('output', `   • ${highlight}`);
            });
          }
          addToHistory('output', '');
        });
        break;

      case 'skills':
        addToHistory('output', '🛠️  Technical Skills:');
        addToHistory('output', '');
        PERSONAL_DATA.skills.forEach(skill => {
          addToHistory('output', `  ✓ ${skill}`);
        });
        break;

      case 'education':
        addToHistory('output', '🎓 Education:');
        addToHistory('output', '');
        addToHistory('output', PERSONAL_DATA.education);
        break;

      case 'awards':
        addToHistory('output', '🏆 Honors & Awards:');
        addToHistory('output', '');
        PERSONAL_DATA.awards.forEach(award => {
          addToHistory('output', `  🥇 ${award}`);
        });
        break;

      case 'contact':
        addToHistory('output', '📞 Contact Information:');
        addToHistory('output', '');
        addToHistory('output', `📧 Email: ${PERSONAL_DATA.email}`);
        addToHistory('output', `🔗 LinkedIn: ${PERSONAL_DATA.linkedin}`);
        addToHistory('output', `📝 Blog: ${PERSONAL_DATA.blog}`);
        addToHistory('output', `🎯 Topmate: ${PERSONAL_DATA.topmate}`);
        break;

      case 'clear':
        setHistory([]);
        break;

      case 'whoami':
        addToHistory('output', PERSONAL_DATA.name.toLowerCase().replace(' ', '_'));
        break;

      case 'pwd':
        addToHistory('output', `/home/${firstName}/portfolio`);
        break;

      case '/ask':
        if (!argument) {
          addToHistory('output', 'Usage: /ask [your question about my background]');
          addToHistory('output', 'Example: /ask What is your experience with mobile app development?');
        } else {
          await askAI(argument);
        }
        break;

      case '/portfolio':
        addToHistory('output', '🎨 Switching to visual portfolio...');
        addToHistory('output', '');
        addToHistory('output', '✨ Redirecting to modern portfolio view');
        setTimeout(() => {
          window.location.href = '/portfolio';
        }, 1500);
        break;

      case 'ls':
        if (args.includes('-la') || args.includes('-l')) {
          addToHistory('output', 'total 7');
          Object.keys(fileSystem).forEach(file => {
            const size = fileSystem[file].length.toString().padStart(4);
            const date = 'Aug  6 12:00';
            addToHistory('output', `-rw-r--r-- 1 ${firstName} staff ${size} ${date} ${file}`);
          });
        } else {
          const files = Object.keys(fileSystem).join('  ');
          addToHistory('output', files);
        }
        break;

      case 'cat':
        if (!argument) {
          addToHistory('output', 'cat: missing file operand');
        } else if (fileSystem[argument]) {
          addToHistory('output', fileSystem[argument]);
        } else {
          addToHistory('output', `cat: ${argument}: No such file or directory`);
        }
        break;

      case 'head':
        if (!argument) {
          addToHistory('output', 'head: missing file operand');
        } else if (fileSystem[argument]) {
          const lines = fileSystem[argument].split('\n').slice(0, 10);
          addToHistory('output', lines.join('\n'));
        } else {
          addToHistory('output', `head: ${argument}: No such file or directory`);
        }
        break;

      case 'tail':
        if (!argument) {
          addToHistory('output', 'tail: missing file operand');
        } else if (fileSystem[argument]) {
          const lines = fileSystem[argument].split('\n').slice(-10);
          addToHistory('output', lines.join('\n'));
        } else {
          addToHistory('output', `tail: ${argument}: No such file or directory`);
        }
        break;

      case 'wc':
        if (!argument) {
          addToHistory('output', 'wc: missing file operand');
        } else if (fileSystem[argument]) {
          const content = fileSystem[argument];
          const lines = content.split('\n').length;
          const words = content.split(/\s+/).filter((w: string) => w.length > 0).length;
          const chars = content.length;
          addToHistory('output', `${lines.toString().padStart(8)} ${words.toString().padStart(7)} ${chars.toString().padStart(7)} ${argument}`);
        } else {
          addToHistory('output', `wc: ${argument}: No such file or directory`);
        }
        break;

      case 'grep':
        if (!argument) {
          addToHistory('output', 'grep: missing search term');
        } else {
          const searchTerm = argument.toLowerCase();
          let found = false;
          Object.entries(fileSystem).forEach(([filename, content]) => {
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (line.toLowerCase().includes(searchTerm)) {
                addToHistory('output', `${filename}:${index + 1}:${line}`);
                found = true;
              }
            });
          });
          if (!found) {
            addToHistory('output', `grep: no matches found for "${argument}"`);
          }
        }
        break;

      case 'find':
        if (!argument) {
          addToHistory('output', 'find: missing search term');
        } else {
          const searchTerm = argument.toLowerCase();
          const matchingFiles = Object.keys(fileSystem).filter(filename => 
            filename.toLowerCase().includes(searchTerm) || 
            fileSystem[filename].toLowerCase().includes(searchTerm)
          );
          if (matchingFiles.length > 0) {
            matchingFiles.forEach(file => addToHistory('output', `./${file}`));
          } else {
            addToHistory('output', `find: no files found containing "${argument}"`);
          }
        }
        break;

      case 'date':
        addToHistory('output', new Date().toString());
        break;

      case 'uname':
        if (args.includes('-a')) {
          addToHistory('output', `${firstName}OS 1.0.0 Terminal-Portfolio x86_64`);
        } else {
          addToHistory('output', `${firstName}OS`);
        }
        break;

      case 'history':
        history.filter(entry => entry.type === 'input').forEach((entry, index) => {
          addToHistory('output', `${index + 1}  ${entry.content.split('$ ')[1] || entry.content}`);
        });
        break;

      case 'echo':
        addToHistory('output', argument || '');
        break;

      case 'tree':
        addToHistory('output', '.');
        Object.keys(fileSystem).forEach((file, index, arr) => {
          const isLast = index === arr.length - 1;
          addToHistory('output', `${isLast ? '└──' : '├──'} ${file}`);
        });
        break;

      case 'exit':
        addToHistory('output', 'logout');
        addToHistory('output', 'Connection to portfolio closed.');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        break;

      case '':
        break;

      default:
        addToHistory('output', `bash: ${command}: command not found`);
        addToHistory('output', 'Type "help" for available commands');
        break;
    }
    
    addToHistory('output', '');
  };



  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div 
      className="h-screen bg-black text-green-400 font-mono cursor-text overflow-hidden"
      onClick={handleClick}
    >
      <div className={`w-full ${isMobile ? 'px-2 py-1' : 'px-4 py-2'}`}>
        {/* Terminal Header */}
        <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'} border-b border-green-400 pb-2`}>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} bg-red-500 rounded-full`}></div>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} bg-yellow-500 rounded-full`}></div>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} bg-green-500 rounded-full`}></div>
            </div>
            <span className={`text-white ${isMobile ? 'ml-2 text-sm' : 'ml-4'}`}>{firstName}@portfolio:~</span>
          </div>
          <div className={`text-green-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {isMobile ? new Date().toLocaleTimeString() : new Date().toLocaleString()}
          </div>
        </div>

        {/* Terminal Content */}
        <div 
          ref={historyRef}
          className="h-[67vh] overflow-y-auto mb-4 space-y-1 text-sm overflow-x-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          {history.map((entry, index) => (
            <div key={index} className={`whitespace-pre-wrap ${
              entry.type === 'input' 
                ? 'text-white' 
                : entry.content.includes('🤖') 
                  ? 'text-blue-400' 
                  : 'text-green-400'
            } ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {entry.content}
            </div>
          ))}
        </div>

        {/* Terminal Input */}
        <div className="flex items-center">
          <span className="text-green-300 mr-2">{currentPath} $</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isProcessing && input.trim()) {
                executeCommand(input);
                setInput('');
              }
            }}
            disabled={isProcessing}
            className="flex-1 bg-transparent text-green-400 outline-none font-mono"
            placeholder={isProcessing ? "Processing..." : "Type a command..."}
            autoFocus
          />
          <span className="text-green-400 animate-pulse ml-1">_</span>
        </div>

        {/* Quick Commands */}
        <div className={`${isMobile ? 'mt-4 pt-2' : 'mt-6 pt-4'} border-t border-green-900`}>
          <div className={`text-green-600 ${isMobile ? 'text-xs' : 'text-sm'} mb-2`}>Quick Actions:</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {['about', 'experience', 'skills', 'contact', 'awards'].map(cmd => (
              <button
                key={cmd}
                onClick={() => {
                  setInput(cmd);
                  executeCommand(cmd);
                  setInput('');
                }}
                disabled={isProcessing}
                className={`bg-green-900 hover:bg-green-800 text-green-300 ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} rounded transition-colors disabled:opacity-50`}
              >
                {cmd}
              </button>
            ))}
          </div>
          <div className={`text-green-600 ${isMobile ? 'text-xs' : 'text-sm'} mb-2`}>Shell Commands:</div>
          <div className="flex flex-wrap gap-2">
            {['ls -la', 'grep engineer', 'find mobile', 'tree', 'history'].map(cmd => (
              <button
                key={cmd}
                onClick={() => {
                  setInput(cmd);
                  executeCommand(cmd);
                  setInput('');
                }}
                disabled={isProcessing}
                className={`bg-gray-800 hover:bg-gray-700 text-gray-300 ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} rounded transition-colors disabled:opacity-50`}
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {/* AI Assistant Info */}
        <div className={`${isMobile ? 'mt-2 p-2' : 'mt-4 p-3'} border border-blue-900 bg-blue-950 bg-opacity-30 rounded`}>
          <div className={`text-blue-400 ${isMobile ? 'text-xs' : 'text-sm'} mb-1`}>🤖 AI Assistant Available</div>
          <div className="text-blue-300 text-xs">
            Use "/ask [your question]" to get AI-powered answers about my background and experience.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalPortfolio;