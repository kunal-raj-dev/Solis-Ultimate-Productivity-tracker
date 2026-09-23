import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Send, ShieldAlert, Cpu } from 'lucide-react';
import { aiService } from '../../../services/ai/ai.service';
import { dataService } from '../../../services/dataService';
import { MarkdownReadingView } from '../../features/Notes/MarkdownReadingView';
import './AskSolisDrawer.css';

interface MessageSource {
  title: string;
  breadcrumb: string;
  score: number;
}

interface ChatMessage {
  role: 'user' | 'solis';
  text: string;
  sources?: MessageSource[];
  latencyMs?: number;
  isSecurityWarning?: boolean;
}

interface AskSolisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AskSolisDrawer: React.FC<AskSolisDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, isTyping]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isTyping) return;

    const userQ = query.trim();
    setConversation(prev => [...prev, { role: 'user', text: userQ }]);
    setQuery('');
    setIsTyping(true);

    try {
      // Gather context notes
      const allNotes = await dataService.notes.getNotes({});
      const context = allNotes.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        subject: n.subjectName
      }));

      // Hybrid RAG Retrieval (BM25 + Dense Semantic Cosine with RRF k=60)
      const topRanked = aiService.retrieveRelevantNotes(userQ, context, 3);
      const startMs = performance.now();
      const response = await aiService.askSolis(userQ, context);
      const durationMs = Math.round(performance.now() - startMs);

      const isSec = response.includes('Solis Security Policy Enforced');

      setConversation(prev => [
        ...prev,
        {
          role: 'solis',
          text: response,
          sources: !isSec ? topRanked.map(r => ({
            title: r.chunk.title,
            breadcrumb: r.chunk.breadcrumb,
            score: Math.round(r.score * 1000) / 1000
          })) : undefined,
          latencyMs: durationMs,
          isSecurityWarning: isSec
        }
      ]);
    } catch (err: any) {
      setConversation(prev => [
        ...prev,
        {
          role: 'solis',
          text: `Error: ${err.message}. Ensure you have provided a valid API key in settings.`
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="solis-ask-drawer-overlay">
      <div className="solis-ask-drawer">
        <div className="solis-ask-drawer__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--color-coral-500)" />
            <h2 style={{ margin: 0, fontSize: 'var(--text-body-md)', fontWeight: 600 }}>Ask Solis</h2>
          </div>
          <button onClick={onClose} className="solis-ask-drawer__close" aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>

        <div className="solis-ask-drawer__content" ref={scrollRef}>
          {conversation.length === 0 ? (
            <div className="solis-ask-drawer__empty">
              <Sparkles size={32} color="var(--border-subtle)" style={{ marginBottom: '12px' }} />
              <h3>Solis Intelligence</h3>
              <p>Ask anything about your notes, concepts, or past study sessions. Solis uses hybrid BM25 and vector semantic search across your local knowledge base.</p>
              
              <div className="solis-ask-drawer__suggestions">
                <button onClick={() => setQuery('What topics do I struggle with the most?')}>"What topics do I struggle with the most?"</button>
                <button onClick={() => setQuery('Summarize my recent notes on Biology.')}>"Summarize my recent notes on Biology."</button>
              </div>
            </div>
          ) : (
            <div className="solis-ask-drawer__chat">
              {conversation.map((msg, i) => (
                <div key={i} className={`solis-ask-chat-bubble solis-ask-chat-bubble--${msg.role}${msg.isSecurityWarning ? ' solis-ask-chat-bubble--security' : ''}`}>
                  {msg.role === 'solis' ? (
                    <div>
                      {msg.isSecurityWarning && (
                        <div className="solis-ask-security-banner">
                          <ShieldAlert size={14} color="var(--color-warning-500)" />
                          <span>Guardrail Intercept</span>
                        </div>
                      )}
                      <MarkdownReadingView
                        content={msg.text}
                        onWikilinkClick={(target) => {
                          onClose();
                          navigate(`/app/notes?q=${encodeURIComponent(target)}`);
                        }}
                      />
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="solis-ask-citations">
                          <div className="solis-ask-citations__list">
                            {msg.sources.map((src, sIdx) => (
                              <span key={sIdx} className="solis-ask-citation-chip" title={`RRF Score: ${src.score}`}>
                                📖 {src.breadcrumb || src.title}
                              </span>
                            ))}
                          </div>
                          {msg.latencyMs !== undefined && (
                            <span className="solis-ask-telemetry-badge" title="RAG retrieval + LLM round-trip">
                              <Cpu size={10} /> {msg.latencyMs}ms
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="solis-ask-chat-bubble solis-ask-chat-bubble--solis typing-indicator">
                  <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                </div>
              )}
            </div>
          )}
        </div>

        <form className="solis-ask-drawer__footer" onSubmit={handleAsk}>
          <div className="solis-ask-drawer__input-wrapper">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask Solis..."
              className="solis-ask-drawer__input"
              autoFocus
            />
            <button type="submit" disabled={!query.trim() || isTyping} className="solis-ask-drawer__send">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
