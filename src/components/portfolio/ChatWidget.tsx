import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare, Send, Sparkle, Terminal, X } from 'lucide-react';
import {
  generateChat,
  generateChatStream,
  getWebLLMStatus,
  initWebLLM,
  onWebLLMStatusChange,
} from '../../lib/webllm';

type Message = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'What does he do at HighLevel?',
  'Tell me about Vibeward',
  'How big were the teams he led?',
];

const ChatWidget = ({ personalData }: { personalData: Record<string, unknown> & { name: string } }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm a small language model running entirely in your browser. Ask me anything about ${personalData.name}'s work.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState(getWebLLMStatus());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Keep the panel mounted through its exit animation, then drop it from the DOM.
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      return;
    }
    const timeout = window.setTimeout(() => setIsMounted(false), 200);
    return () => window.clearTimeout(timeout);
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
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Model failed to load: ${error?.message || 'Unknown error'}` },
        ]);
      });
    }
  }, [isOpen, modelStatus.state]);

  useEffect(() => {
    const onOpen = () => setIsOpen(true);
    window.addEventListener('portfolio:open-chat', onOpen);
    return () => window.removeEventListener('portfolio:open-chat', onOpen);
  }, []);

  const send = async (text: string) => {
    if (!text.trim() || isLoading || modelStatus.state !== 'ready') return;

    setInput('');
    const conversation: Message[] = [...messages, { role: 'user', content: text }];
    setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setIsLoading(true);

    const updateLastAssistant = (content: string) => {
      setMessages((prev) => {
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

      let answer = '';
      try {
        const stream = await generateChatStream({
          messages: [{ role: 'system', content: systemPrompt }, ...conversation],
          temperature: 0.7,
        });

        for await (const chunk of stream) {
          const delta = chunk?.choices?.[0]?.delta?.content || '';
          if (delta) {
            answer += delta;
            updateLastAssistant(answer);
          }
        }
      } catch {
        const response = await generateChat({
          messages: [{ role: 'system', content: systemPrompt }, ...conversation],
          temperature: 0.7,
        });
        answer = response.choices[0]?.message?.content || "I couldn't generate a response.";
        updateLastAssistant(answer);
      }

      if (!answer.trim()) updateLastAssistant("I couldn't generate a response.");
    } catch (error) {
      updateLastAssistant(
        error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const ready = modelStatus.state === 'ready';

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {isMounted && (
        <div
          data-state={isOpen ? 'open' : 'closed'}
          className={`flex max-h-[520px] w-[calc(100vw-2rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1212]/95 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:w-96 ${
            isOpen ? '' : 'pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 bg-[#324444]/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkle className="h-3.5 w-3.5 text-white/70" strokeWidth={1.5} />
              <span className="text-[11px] uppercase tracking-[0.22em] text-white/80">Ask my AI</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>

          <div className="min-h-[280px] flex-1 space-y-3 overflow-y-auto p-4">
            {modelStatus.state === 'loading' && (
              <div className="flex justify-center">
                <div className="liquid-glass flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/70">
                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
                  <span>
                    Loading model
                    {typeof modelStatus.progress === 'number'
                      ? ` · ${Math.round(modelStatus.progress * 100)}%`
                      : ''}
                  </span>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex duration-150 animate-in fade-in-0 slide-in-from-bottom-1 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-[1.55] ${
                    message.role === 'user'
                      ? 'bg-white/90 text-black'
                      : 'border border-white/10 bg-[#324444]/70 text-white/85'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-[#324444]/70 px-3.5 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-white/70" strokeWidth={1.5} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {ready && messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 px-4 pb-3">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => send(suggestion)}
                  className="rounded-full border border-white/12 px-3 py-1.5 text-[11px] text-white/65 transition-colors hover:border-white/30 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 border-t border-white/10 p-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && send(input)}
              placeholder={ready ? 'Ask about my experience…' : 'Waiting for the model…'}
              disabled={!ready}
              className="flex-1 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[13px] text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              onClick={() => send(input)}
              disabled={isLoading || !ready}
              aria-label="Send message"
              className="liquid-glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-opacity disabled:opacity-40"
            >
              <Send className="h-4 w-4 text-white" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <a
          href="/terminal"
          title="Switch to terminal mode"
          className="liquid-glass flex h-11 items-center gap-2 rounded-full px-4 text-[13px] text-white/85 transition-colors hover:text-white"
        >
          <Terminal className="h-4 w-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">Dev mode</span>
        </a>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="liquid-glass flex h-11 items-center gap-2 rounded-full bg-white/[0.06] px-4 text-[13px] text-white"
        >
          {isOpen ? (
            <>
              <X className="h-4 w-4" strokeWidth={1.5} />
              <span>Close</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
