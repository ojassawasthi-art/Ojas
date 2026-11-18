import {ArrowUp, Loader2, Mail, RotateCcw, X} from 'lucide-react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isGreeting?: boolean;
}

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

const INITIAL_GREETING =
  "Hi, I'm the assistant for Ojas Awasthi. Ask me about his work, books or education.";

const SUGGESTION_CHIPS = [
  'Who is Ojas?',
  'What websites has he built?',
  'Tell me about his books',
  'How can I contact him?',
] as const;

const ADMIN_EMAIL = 'ojassawasthi@gmail.com';
const MAX_HISTORY_SEND = 8;

function createGreetingMessage(): ChatMessage {
  return {
    id: 'greeting',
    role: 'assistant',
    content: INITIAL_GREETING,
    isGreeting: true,
  };
}

function renderMessageText(text: string) {
  const tokenRegex = /(https?:\/\/[^\s<>()]+|ojassawasthi@gmail\.com)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part === ADMIN_EMAIL) {
      return (
        <a
          key={idx}
          href={`mailto:${ADMIN_EMAIL}`}
          className="underline decoration-[var(--accent)] underline-offset-2 transition-colors hover:text-[var(--accent-text)]"
        >
          {part}
        </a>
      );
    }

    if (/^https?:\/\//.test(part)) {
      const match = part.match(/^(.*?)([.,!?;:)]*)$/);
      const cleanUrl = match ? match[1] : part;
      const trailing = match ? match[2] : '';
      return (
        <Fragment key={idx}>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline decoration-[var(--accent)] underline-offset-2 transition-colors hover:text-[var(--accent-text)]"
          >
            {cleanUrl}
          </a>
          {trailing}
        </Fragment>
      );
    }

    return <Fragment key={idx}>{part}</Fragment>;
  });
}

export default function ChatWidget({
  isOpen,
  onClose,
  triggerRef,
}: ChatWidgetProps) {
  const prefersReducedMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createGreetingMessage(),
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  const hasUserMessages = messages.some((m) => m.role === 'user');

  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, errorMessage, isOffline, isOpen, scrollToBottom]);

  // Move focus into input when opened, and restore focus to trigger button on close
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const id = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
      wasOpenRef.current = true;
      return () => window.clearTimeout(id);
    }
    if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef.current?.focus();
    }
  }, [isOpen, triggerRef]);

  // Escape to close & Tab/Shift+Tab focus trap while open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panelRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    const cleanQuestion = trimmed.slice(0, 500);
    const historyToSend = messages
      .filter((m) => !m.isGreeting)
      .slice(-MAX_HISTORY_SEND)
      .map((m) => ({role: m.role, content: m.content}));

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: cleanQuestion,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setErrorMessage('');
    setIsOffline(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          message: cleanQuestion,
          history: historyToSend,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };

      if (response.status === 503) {
        setIsOffline(true);
        return;
      }

      if (!response.ok || !data.reply) {
        setErrorMessage(
          data.error ||
            `Unable to get a response right now. You can email ${ADMIN_EMAIL}.`,
        );
        return;
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setErrorMessage(
        `Network error. Please check your connection or email ${ADMIN_EMAIL}.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleReset = () => {
    setMessages([createGreetingMessage()]);
    setInput('');
    setErrorMessage('');
    setIsOffline(false);
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const panelTransition = prefersReducedMotion
    ? {duration: 0}
    : {duration: 0.22, ease: [0.16, 1, 0.3, 1] as const};

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          id="ojas-chat-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-widget-title"
          initial={
            prefersReducedMotion ? {opacity: 0} : {opacity: 0, y: 14, scale: 0.98}
          }
          animate={
            prefersReducedMotion ? {opacity: 1} : {opacity: 1, y: 0, scale: 1}
          }
          exit={
            prefersReducedMotion ? {opacity: 0} : {opacity: 0, y: 10, scale: 0.98}
          }
          transition={panelTransition}
          className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-[45] flex max-h-[min(78vh,560px)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] shadow-[0_20px_60px_rgba(10,10,10,0.16)] sm:right-6 sm:bottom-6 sm:w-[390px] dark:shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 bg-[#C8A97E]"
                />
                <h2
                  id="chat-widget-title"
                  className="truncate font-serif-display text-2xl leading-none text-[var(--text)]"
                >
                  Ask about Ojas
                </h2>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 text-xs font-medium whitespace-nowrap text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)]"
                aria-label="Reset chat"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Reset chat</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close chat"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#0A0A0A] text-[#FAFAF8] dark:bg-[#F5F5F2] dark:text-[#0A0A0A]'
                      : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]'
                  }`}
                >
                  {msg.role === 'assistant'
                    ? renderMessageText(msg.content)
                    : msg.content}
                </div>
              </div>
            ))}

            {/* Suggestion chips shown initially or after reset */}
            {!hasUserMessages && !isLoading && !isOffline && (
              <div className="pt-1">
                <p className="mb-2 text-[11px] font-medium text-[var(--muted)]">
                  Suggested questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => void sendMessage(chip)}
                      className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-left text-xs text-[var(--text)] transition-colors hover:border-[#C8A97E] hover:bg-[var(--surface)]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-xs text-[var(--muted)]">
                  <Loader2
                    className={`h-3.5 w-3.5 text-[#C8A97E] ${
                      prefersReducedMotion ? '' : 'animate-spin'
                    }`}
                    aria-hidden="true"
                  />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            {/* Offline state (503 when GEMINI_API_KEY is missing) */}
            {isOffline && (
              <div
                role="status"
                className="rounded-xl border border-[#C8A97E]/50 bg-[var(--surface)] px-4 py-3 text-xs leading-relaxed text-[var(--text)]"
              >
                <p className="font-medium">
                  Chat is offline, email me at{' '}
                  <a
                    href={`mailto:${ADMIN_EMAIL}`}
                    className="inline-flex items-center gap-1 underline decoration-[#C8A97E] underline-offset-2 hover:text-[var(--accent-text)]"
                  >
                    <Mail className="h-3 w-3" aria-hidden="true" />
                    <span>{ADMIN_EMAIL}</span>
                  </a>
                </p>
              </div>
            )}

            {/* Error state */}
            {errorMessage && !isOffline && (
              <div
                role="alert"
                className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs leading-relaxed text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
              >
                {errorMessage}
              </div>
            )}

            <div ref={listEndRef} />
          </div>

          {/* Input composer */}
          <div className="border-t border-[var(--border)] bg-[var(--bg)] px-4 pt-3 pb-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <label htmlFor="chat-widget-input" className="sr-only">
                Ask a question about Ojas Awasthi
              </label>
              <input
                ref={inputRef}
                id="chat-widget-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                maxLength={500}
                disabled={isLoading}
                className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[#C8A97E] focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A0A0A] text-[#FAFAF8] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#F5F5F2] dark:text-[#0A0A0A]"
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
              <p>
                AI answers may contain mistakes. For anything important, email{' '}
                <a
                  href={`mailto:${ADMIN_EMAIL}`}
                  className="text-[var(--text)] underline underline-offset-2"
                >
                  Ojas
                </a>
                .
              </p>
              {input.length >= 400 && (
                <span className="font-mono-tabular shrink-0 text-[10px]">
                  {input.length}/500
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
