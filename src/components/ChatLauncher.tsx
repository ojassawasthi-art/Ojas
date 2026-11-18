import {Loader2, MessageSquare} from 'lucide-react';
import {lazy, Suspense, useRef, useState} from 'react';

const ChatWidget = lazy(() => import('./ChatWidget'));

export function ChatLauncher() {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    setHasLoaded(true);
    setIsOpen(true);
  };

  return (
    <>
      {!isOpen && (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpen}
          aria-label="Ask about Ojas"
          aria-expanded={isOpen}
          aria-controls="ojas-chat-panel"
          className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-[45] inline-flex h-11 items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[#0A0A0A] px-4 text-xs font-medium whitespace-nowrap text-[#FAFAF8] shadow-[0_10px_30px_rgba(10,10,10,0.18)] transition-colors hover:border-[#C8A97E] sm:right-6 sm:bottom-6 dark:bg-[#F5F5F2] dark:text-[#0A0A0A] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
        >
          <MessageSquare className="h-4 w-4 text-[#C8A97E]" aria-hidden="true" />
          <span>Ask about Ojas</span>
        </button>
      )}

      {hasLoaded && (
        <Suspense
          fallback={
            isOpen ? (
              <div
                aria-label="Loading chat assistant"
                className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-[45] inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-medium text-[var(--text)] shadow-lg sm:right-6 sm:bottom-6"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C8A97E]" />
                <span>Opening assistant...</span>
              </div>
            ) : null
          }
        >
          <ChatWidget
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            triggerRef={buttonRef}
          />
        </Suspense>
      )}
    </>
  );
}
