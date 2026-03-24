"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, MessageSquarePlus, History, Star, Trash2, X, Square } from "lucide-react";
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

const DEFAULT_GREETING: Message = { 
  role: "assistant", 
  content: "**안녕하세요!** CEUM AI Assistant 비서입니다.\n\n교회 설교 자료나 행정 서류에 대해 궁금한 점을 편하게 물어봐 주세요. 자료를 학습한 상태라면 더 정확한 답변이 가능합니다." 
};

export default function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fontLevel, setFontLevel] = useState(1); // 0=14px, 1=16px, 2=18px, 3=20px
  const FONT_CLASSES = ["text-[14px]", "text-[16px]", "text-[18px]", "text-[20px]"];
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Load font level
  useEffect(() => {
    const savedFont = localStorage.getItem("ceum_font_level");
    if (savedFont) setFontLevel(Number(savedFont));
  }, []);

  const changeFont = (delta: number) => {
    setFontLevel(prev => {
      const newVal = Math.max(0, Math.min(3, prev + delta));
      localStorage.setItem("ceum_font_level", String(newVal));
      return newVal;
    });
  };

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ceum_chat_sessions");
    if (saved) {
        try {
            setSessions(JSON.parse(saved));
        } catch (e) {}
    }
  }, []);

  // Save sessions to localStorage whenever it changes
  useEffect(() => {
    if (sessions.length > 0) {
        localStorage.setItem("ceum_chat_sessions", JSON.stringify(sessions));
    } else {
        localStorage.removeItem("ceum_chat_sessions");
    }
  }, [sessions]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleNewChat = () => {
    setCurrentId(null);
    setMessages([DEFAULT_GREETING]);
    setShowHistory(false);
  };

  const loadSession = (id: string) => {
    const s = sessions.find(x => x.id === id);
    if (s) {
      setCurrentId(s.id);
      setMessages(s.messages);
      setShowHistory(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(x => x.id !== id);
    setSessions(updated);
    if (currentId === id) handleNewChat();
  };

  const toggleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.map(s => s.id === id ? { ...s, bookmarked: !s.bookmarked } : s));
  };

  const currentIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentIdRef.current = currentId;
  }, [currentId]);

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
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    const updatedMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    abortControllerRef.current = new AbortController();
    let fullContent = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
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

      // Save complete session safely outside the state updater!
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

  return (
    <div className="flex flex-col h-full w-full min-h-0 relative">
      
      {/* Top Header Controls */}
      <div className="shrink-0 p-3 px-6 border-b border-white/5 flex items-center justify-between bg-black/20">
         <button onClick={handleNewChat} className="flex items-center gap-1.5 text-xs font-bold text-[#007aff] hover:text-blue-400 transition-colors px-3 py-1.5 rounded-full hover:bg-[#007aff]/10">
            <MessageSquarePlus size={16} /> <span>새대화</span>
         </button>
         
         <div className="flex items-center gap-1">
           <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-1 py-0.5 mr-1 sm:mr-3">
             <button onClick={() => changeFont(-1)} className="px-2 py-1 text-[#8e8e93] hover:text-white font-bold text-xs" title="글자 작게">A-</button>
             <div className="w-px h-3 bg-white/10 mx-0.5"></div>
             <button onClick={() => changeFont(1)} className="px-2 py-1 text-[#8e8e93] hover:text-white font-bold text-sm" title="글자 크게">A+</button>
           </div>
           <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 text-xs font-bold text-[#8e8e93] hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/10">
              <History size={16} /> <span>대화목록</span>
           </button>
         </div>
      </div>

      {/* History Sidebar Panel (Overlay) */}
      {showHistory && (
        <div className="absolute right-0 top-0 bottom-0 w-[300px] sm:w-[350px] bg-[#1c1c1e]/95 backdrop-blur-xl border-l border-white/10 z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col animate-slide-left">
           <div className="shrink-0 p-5 flex items-center justify-between border-b border-white/5 bg-black/20">
             <h3 className="text-sm font-bold text-white flex items-center gap-2"><History size={16}/> 이전 대화 기록</h3>
             <button onClick={() => setShowHistory(false)} className="text-[#8e8e93] hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"><X size={18}/></button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
              {sessions.length === 0 ? (
                 <div className="text-center text-xs text-[#8e8e93] mt-10">저장된 대화가 없습니다.</div>
              ) : (
                // Group bookmarks first, then regular
                [...sessions].sort((a,b) => (b.bookmarked ? 1 : 0) - (a.bookmarked ? 1 : 0)).map(s => (
                   <div key={s.id} onClick={() => loadSession(s.id)} className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${currentId === s.id ? "bg-[#007aff]/10 border-[#007aff]/30" : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-medium text-white/90 line-clamp-2 leading-snug flex-1">{s.title}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
                        <span className="text-[10px] text-[#8e8e93] font-medium">{new Date(s.updatedAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={(e) => toggleBookmark(e, s.id)} className={`p-1.5 rounded-lg transition-all ${s.bookmarked ? "text-amber-400 bg-amber-400/10 shadow-sm shadow-amber-500/20" : "text-[#8e8e93] hover:bg-white/10 hover:text-white"}`}>
                            <Star size={14} fill={s.bookmarked ? "currentColor" : "none"} />
                          </button>
                          <button onClick={(e) => deleteSession(e, s.id)} className="p-1.5 rounded-lg text-[#8e8e93] hover:bg-red-500/20 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                   </div>
                ))
              )}
           </div>
        </div>
      )}

      {/* Scrollable Messages Area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-8 space-y-8 custom-scrollbar relative z-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 group ${m.role === "assistant" ? "" : "flex-row-reverse"}`}>
            
            {/* Avatar */}
            <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center border shadow-sm ${
              m.role === "assistant" 
                ? "bg-transparent border-none text-white mt-1" 
                : "bg-[#2c2c2e] border-[#3c3c3e] text-white"
            }`}>
              {m.role === "assistant" ? (
                 <div className="w-9 h-9 bg-gradient-to-br from-[#007aff] to-[#00c6ff] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,122,255,0.4)]">
                   <Sparkles size={16} className="text-white" />
                 </div>
              ) : <User size={18} />}
            </div>

            {/* Bubble or Text block */}
            <div className={
              m.role === "assistant" 
                ? `flex-1 py-1 ${FONT_CLASSES[fontLevel]} leading-relaxed text-white/90 markdown-content overflow-x-auto transition-all` 
                : `message-bubble message-user ${FONT_CLASSES[fontLevel]} transition-all`
            }>
              {m.role === "assistant" ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content || "..."}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-4">
            <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[#007aff] mt-1">
               <div className="w-9 h-9 bg-gradient-to-br from-[#007aff] to-[#00c6ff] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,122,255,0.4)]">
                 <Sparkles size={16} className="text-white animate-pulse" />
               </div>
            </div>
            <div className="flex-1 py-1 flex items-center">
              <div className="flex gap-1.5 pl-2">
                <div className="w-2 h-2 bg-[#007aff] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-[#007aff] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-[#007aff] rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-5 mt-auto border-t border-white/5 bg-[#1c1c1e]/50 backdrop-blur-md relative z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3 bg-black/40 border border-white/10 p-2 pl-5 rounded-full focus-within:border-[#007aff]/50 focus-within:bg-black/80 transition-all shadow-inner">
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
            placeholder="인공지능 비서에게 무엇이든 물어보세요..."
            className="flex-1 bg-transparent border-none focus:outline-none text-[0.95rem] text-white placeholder:text-[#8e8e93]"
          />
          <button 
            onClick={loading ? stopGeneration : handleSend}
            disabled={!loading && !input.trim()}
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${
              loading 
                ? "bg-red-500 text-white hover:scale-105 shadow-md shadow-red-500/30"
                : input.trim() 
                  ? "bg-gradient-to-br from-[#007aff] to-[#00c6ff] text-white hover:scale-105 shadow-md shadow-blue-500/30" 
                  : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            {loading ? <Square size={14} fill="currentColor" /> : <Send size={16} className={input.trim() ? "translate-x-0.5" : ""} />}
          </button>
        </div>
        <div className="text-center mt-3">
          <p className="text-[10px] text-[#8e8e93] uppercase font-semibold tracking-wider">
            Powered by Google Gemini 2.5 Flash
          </p>
        </div>
      </div>
      
    </div>
  );
}
