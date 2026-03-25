"use client";

import { useState, useEffect } from "react";
import { Moon, LogOut, Globe, Unlock, Lock, Menu, X, Minimize2, MessageSquarePlus, History, Star, Trash2, Plus, Minus } from "lucide-react";
import DriveFileList from "@/components/DriveFileList";
import ChatInterface from "@/components/ChatInterface";
import PublicSidebar from "@/components/PublicSidebar";

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

export default function MainApp({ session, signInAction, signOutAction }: any) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPwdInput, setShowPwdInput] = useState(false);
  const [pwd, setPwd] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMasterOn, setIsMasterOn] = useState(true);

  // --- Lifted Chat States ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_GREETING]);
  const [showHistory, setShowHistory] = useState(false);
  const [fontLevel, setFontLevel] = useState(1);

  // Fetch initial master switch state
  useEffect(() => {
    fetch("/api/rag/info")
      .then(res => res.json())
      .then(data => {
        if (data.settings) setIsMasterOn(data.settings.isMasterSwitchOn);
      })
      .catch(err => console.error("Failed to fetch settings:", err));
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const adminStatus = localStorage.getItem("moon_admin") === "true";
    setIsAdmin(adminStatus);

    // Load chat states
    const savedFont = localStorage.getItem("ceum_font_level");
    if (savedFont) setFontLevel(Number(savedFont));

    const savedSessions = localStorage.getItem("ceum_chat_sessions");
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
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

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
      localStorage.removeItem("moon_admin");
    } else {
      setShowPwdInput(true);
    }
  };

  const handlePwdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === "8395") {
      setIsAdmin(true);
      localStorage.setItem("moon_admin", "true");
      setShowPwdInput(false);
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
    setPwd("");
  };

  const toggleMasterSwitch = async () => {
    const newState = !isMasterOn;
    setIsMasterOn(newState);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMasterSwitchOn: newState }),
      });
    } catch (err) {
      console.error("Failed to update settings:", err);
    }
  };

  // --- Lifted Chat Handlers ---
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

  const changeFont = (delta: number) => {
    setFontLevel(prev => {
      const newVal = Math.max(0, Math.min(3, prev + delta));
      localStorage.setItem("ceum_font_level", String(newVal));
      return newVal;
    });
  };

  if (!isMounted) return null;

  return (
    <div className="absolute inset-0 md:p-6 flex flex-col gap-1 md:gap-4 font-sans overflow-hidden h-[100dvh]">
      
      {/* 1. Header (Consolidated) */}
      <header className="shrink-0 h-[72px] apple-card apple-glass flex justify-between items-center px-2 md:px-6 transition-all relative z-[100] bg-black/40">
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          <button 
            className="p-2 text-white/80 hover:text-white transition-all hover:bg-white/5 rounded-xl"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="relative">
            <div 
              className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all cursor-pointer ${
                isAdmin ? "bg-amber-500 shadow-amber-500/20" : "bg-[#007aff] shadow-blue-500/20 hover:scale-105"
              }`}
              onClick={handleAdminToggle}
              title={isAdmin ? "관리자 모드 종료" : "관리자 모드 로그인"}
            >
              {isAdmin ? <Unlock size={18} className="md:w-5 md:h-5" /> : <Moon size={20} className="md:w-5 md:h-5" />}
            </div>

            {showPwdInput && !isAdmin && (
              <form onSubmit={handlePwdSubmit} className="absolute left-0 top-[48px] flex items-center gap-2 bg-[#1c1c1e] p-2 rounded-xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 z-50 w-max">
                <input 
                  type="password"
                  placeholder="Admin Pwd"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  autoFocus
                  className="bg-white/5 text-white text-xs outline-none px-3 py-1.5 w-24 md:w-32 rounded-lg border border-white/5"
                />
                <button type="submit" className="bg-[#007aff] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">확인</button>
                <button type="button" onClick={() => setShowPwdInput(false)} className="text-white/40 hover:text-white p-1"><X size={14} /></button>
              </form>
            )}
          </div>

          <div className="hidden lg:flex flex-col justify-center border-l border-white/10 pl-4 ml-1">
            <h1 className="text-[0.95rem] font-bold text-white leading-tight">CEUM AI</h1>
            <p className="text-[#8e8e93] text-[9px] uppercase tracking-widest font-bold">
              {isAdmin ? "Admin Mode" : "Ministry Assistant"}
            </p>
          </div>
        </div>

        {/* Global Chat Controls */}
        <div className="flex-1 flex justify-center items-center gap-1.5 md:gap-4 px-2">
           <button 
             onClick={handleNewChat} 
             className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#007aff]/10 text-[#007aff] hover:bg-[#007aff]/20 transition-all text-[11px] md:text-xs font-bold whitespace-nowrap shadow-sm border border-[#007aff]/20"
           >
             <MessageSquarePlus size={16} /> <span className="hidden md:inline">새 대화</span>
           </button>

           <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5 sm:px-1 shadow-inner">
             <button onClick={() => changeFont(-1)} className="p-2 text-[#8e8e93] hover:text-white transition-colors" title="글자 작게"><Minus size={14}/></button>
             <div className="w-px h-3 bg-white/10 mx-0.5"></div>
             <button onClick={() => changeFont(1)} className="p-2 text-[#8e8e93] hover:text-white transition-colors" title="글자 크게"><Plus size={14}/></button>
           </div>

           <button 
             onClick={() => setShowHistory(true)} 
             className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 text-[#8e8e93] hover:text-white hover:bg-white/10 transition-all text-[11px] md:text-xs font-bold whitespace-nowrap border border-white/10"
           >
             <History size={16} /> <span className="hidden md:inline">기록</span>
           </button>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {isAdmin && (
            <>
              <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <span className={`w-1.5 h-1.5 rounded-full ${isMasterOn ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"}`}></span>
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-tighter">Public {isMasterOn ? "On" : "Off"}</span>
                <button 
                  onClick={toggleMasterSwitch}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${isMasterOn ? "bg-[#007aff]" : "bg-white/20"}`}
                >
                  <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${isMasterOn ? "translate-x-3.5" : "translate-x-1"}`} />
                </button>
              </div>

              {session ? (
                <button onClick={() => signOutAction()} className="p-2 text-[#8e8e93] hover:text-white transition-colors" title={session.user?.name + "님 로그아웃"}>
                  <LogOut size={20} />
                </button>
              ) : (
                <button onClick={() => signInAction()} className="hidden sm:block bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors">
                  Login
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* 2. Main Body */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 relative">
        
        {/* Sidebar Overlay */}
        <aside className={`
          fixed md:absolute z-50 flex-col shrink-0 overflow-hidden apple-card apple-glass transition-all duration-500 ease-in-out
          ${showMobileMenu ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"}
          w-[280px] md:w-[320px] lg:w-[380px]
          h-[100dvh]
          left-0 top-0
          shadow-2xl
        `}>
          <div className="shrink-0 p-4 md:p-5 px-5 md:px-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md">
            <h2 className="text-xs font-bold text-[#8e8e93] uppercase tracking-widest flex items-center gap-2">
              <Globe size={14} className={isAdmin ? "text-amber-500" : "text-[#007aff]"} /> 
              {isAdmin ? "Admin Control" : "Church Knowledge"}
            </h2>
            <button className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/5 transition-all" onClick={() => setShowMobileMenu(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden outline-none">
            {isAdmin ? (
              <div className="h-full overflow-y-auto custom-scrollbar">
                {session ? (
                  <DriveFileList accessToken={(session as any).accessToken} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#8e8e93] opacity-60 p-8 text-center gap-3">
                    <Lock size={32} className="mb-2 text-white/20" />
                    <p className="text-sm">관리자 구글 계정으로 로그인해야 폴더를 연동할 수 있습니다.</p>
                  </div>
                )}
              </div>
            ) : (
              <PublicSidebar session={session} />
            )}
          </div>
        </aside>

        {/* Backdrop for Sidebar */}
        {showMobileMenu && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-500"
            onClick={() => setShowMobileMenu(false)}
          />
        )}

        {/* Chat Area (Empty header, full width messages) */}
        <main className="flex-1 flex flex-col apple-card apple-glass overflow-hidden min-w-0 shadow-lg shadow-black/50 relative z-10 w-full animate-fade-in">
          <ChatInterface 
            sessions={sessions}
            setSessions={setSessions}
            currentId={currentId}
            setCurrentId={setCurrentId}
            messages={messages}
            setMessages={setMessages}
            fontLevel={fontLevel}
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            loadSession={loadSession}
            deleteSession={deleteSession}
            toggleBookmark={toggleBookmark}
            handleNewChat={handleNewChat}
          />
        </main>

        {/* History Sidebar Panel (Overlay) - Now part of MainApp */}
        {showHistory && (
          <div className="absolute right-0 top-0 bottom-0 w-[300px] sm:w-[350px] bg-[#1c1c1e]/98 backdrop-blur-2xl border-l border-white/10 z-[60] shadow-[-20px_0_40px_rgba(0,0,0,0.7)] flex flex-col animate-slide-left">
             <div className="shrink-0 p-5 flex items-center justify-between border-b border-white/5 bg-black/40">
               <h3 className="text-sm font-bold text-white flex items-center gap-2"><History size={16}/> 이전 대화 기록</h3>
               <button onClick={() => setShowHistory(false)} className="text-[#8e8e93] hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all"><X size={20}/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {sessions.length === 0 ? (
                   <div className="text-center text-xs text-[#8e8e93] mt-10">저장된 대화가 없습니다.</div>
                ) : (
                  [...sessions].sort((a,b) => (b.bookmarked ? 1 : 0) - (a.bookmarked ? 1 : 0)).map(s => (
                     <div key={s.id} onClick={() => loadSession(s.id)} className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${currentId === s.id ? "bg-[#007aff]/15 border-[#007aff]/40 shadow-lg shadow-[#007aff]/5" : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm font-semibold text-white/95 line-clamp-2 leading-relaxed flex-1">{s.title}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <span className="text-[10px] text-[#8e8e93] font-bold tracking-tight">{new Date(s.updatedAt).toLocaleDateString()}</span>
                          <div className="flex items-center gap-1.5">
                            <button onClick={(e) => toggleBookmark(e, s.id)} className={`p-1.5 rounded-lg transition-all ${s.bookmarked ? "text-amber-400 bg-amber-400/10" : "text-[#8e8e93] hover:bg-white/10"}`}>
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
      </div>
    </div>
  );
}
