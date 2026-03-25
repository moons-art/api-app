"use client";
import { useState, useEffect, useRef } from "react";
import { Send, User, Sparkles, X, Square, Copy, Edit, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  bookmarked: boolean;
  updatedAt: number;
}

interface ChatInterfaceProps {
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  currentId: string | null;
  setCurrentId: React.Dispatch<React.SetStateAction<string | null>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  fontLevel: number;
  showHistory: boolean;
  setShowHistory: (val: boolean) => void;
  loadSession: (id: string) => void;
  deleteSession: (e: React.MouseEvent, id: string) => void;
  toggleBookmark: (e: React.MouseEvent, id: string) => void;
  handleNewChat: () => void;
}

export default function ChatInterface({ 
  sessions, setSessions, currentId, setCurrentId, messages, setMessages, 
  fontLevel, showHistory, setShowHistory, loadSession, deleteSession, 
  toggleBookmark, handleNewChat 
}: ChatInterfaceProps) {
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const FONT_CLASSES = ["text-[14px]", "text-[16px]", "text-[18px]", "text-[20px]"];
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentIdRef.current = currentId;
  }, [currentId]);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const saveCurrentSession = (newMessages: Message[]) => {
    const title = newMessages.length > 1 ? newMessages[1].content.slice(0, 30) + "..." : "새로운 대화";
    if (!currentIdRef.current) {
      const newId = Date.now().toString();
      setCurrentId(newId);
      currentIdRef.current = newId;
      setSessions(prev => [{ id: newId, title, messages: newMessages, bookmarked: false, updatedAt: Date.now() }, ...prev]);
    } else {
      setSessions(prev => prev.map(s => s.id === currentIdRef.current ? { ...s, messages: newMessages, updatedAt: Date.now() } : s));
    }
  };

  const handleSend = async () => {
    const userMsg = input.trim();
    if (!userMsg) return;

    setInput("");
    const updatedMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(updatedMessages);
    setLoading(true);

    abortControllerRef.current = new AbortController();
    let fullContent = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: updatedMessages }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("API call failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader stream");

      setMessages([...updatedMessages, { role: "assistant", content: "" }]);
      
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        
        setMessages([...updatedMessages, { role: "assistant", content: fullContent }]);
      }

      saveCurrentSession([...updatedMessages, { role: "assistant", content: fullContent }]);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        const finalMessages = [...updatedMessages, { role: "assistant" as const, content: fullContent + " (중단됨)" }];
        setMessages(finalMessages);
        saveCurrentSession(finalMessages);
      } else {
        console.error("Chat streaming error:", error);
        const finalErr = [...updatedMessages, { role: "assistant" as const, content: "서버와 통신하는 중 문제가 발생했습니다. 조금 뒤 다시 시도해주세요." }];
        setMessages(finalErr);
        saveCurrentSession(finalErr);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (index: number) => {
    const msg = messages[index];
    if (msg.role === "user") {
      setInput(msg.content);
      setMessages(messages.slice(0, index));
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0 relative bg-transparent">
      
      {/* Scrollable Messages Area - Maximized Width */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-2 md:px-10 lg:px-20 py-4 md:py-8 space-y-6 md:space-y-8 custom-scrollbar relative z-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 md:gap-6 group ${m.role === "assistant" ? "" : "flex-row-reverse"}`}>
            
            {/* Avatar */}
            <div className={`w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center border shadow-sm ${
              m.role === "assistant" 
                ? "bg-transparent border-none text-white mt-1 font-bold" 
                : "bg-[#2c2c2e] border-[#3c3c3e] text-white"
            }`}>
              {m.role === "assistant" ? (
                 <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-[#007aff] to-[#00c6ff] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,122,255,0.4)]">
                   <Sparkles size={18} className="text-white" />
                 </div>
              ) : <User size={20} />}
            </div>

            {/* Bubble or Text block - Full Width */}
            <div className={
              m.role === "assistant" 
                ? `flex-1 py-1 ${FONT_CLASSES[fontLevel]} leading-relaxed text-white/95 markdown-content transition-all` 
                : `message-bubble message-user ${FONT_CLASSES[fontLevel]} transition-all max-w-[85%]`
            }>
              {m.role === "assistant" ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content || "..."}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              )}
            </div>

            {/* Message Actions */}
            <div className={`flex flex-col gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
              <button 
                onClick={() => handleCopy(m.content, i)} 
                className="p-1.5 rounded-lg bg-white/5 text-[#8e8e93] hover:text-white hover:bg-white/10 transition-all"
                title="복사하기"
              >
                {copiedId === i ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
              {m.role === "user" && (
                <button 
                  onClick={() => handleEdit(i)} 
                  className="p-1.5 rounded-lg bg-white/5 text-[#8e8e93] hover:text-white hover:bg-white/10 transition-all"
                  title="수정하기"
                >
                  <Edit size={14} />
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 md:gap-6">
            <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center">
               <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-[#007aff] to-[#00c6ff] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,122,255,0.4)]">
                 <Sparkles size={18} className="text-white animate-pulse" />
               </div>
            </div>
            <div className="flex-1 py-2 flex items-center">
              <div className="flex gap-1.5 pl-2">
                <div className="w-2 h-2 bg-[#007aff] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-[#007aff] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-[#007aff] rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Full Width Optimization */}
      <div className="shrink-0 p-2 md:p-6 mt-auto border-t border-white/5 bg-[#1c1c1e]/40 backdrop-blur-xl relative z-10 w-full">
        <div className="w-full flex items-center gap-3 bg-black/40 border border-white/10 p-2 pl-4 md:pl-7 rounded-full focus-within:border-[#007aff]/60 focus-within:bg-black/90 transition-all shadow-inner group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="비서에게 무엇이든 물어보세요..."
            className="flex-1 bg-transparent border-none focus:outline-none text-[0.95rem] md:text-base text-white placeholder:text-[#8e8e93]"
          />
          <button 
            onClick={loading ? stopGeneration : handleSend}
            disabled={!loading && !input.trim()}
            className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full flex items-center justify-center transition-all ${
              loading 
                ? "bg-red-500 text-white hover:scale-105 shadow-lg shadow-red-500/20"
                : input.trim() 
                  ? "bg-gradient-to-br from-[#007aff] to-[#00c6ff] text-white hover:scale-105 shadow-lg shadow-blue-500/30" 
                  : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            {loading ? <Square size={16} fill="currentColor" /> : <Send size={20} className={input.trim() ? "translate-x-0.5" : ""} />}
          </button>
        </div>
      </div>
      
    </div>
  );
}
