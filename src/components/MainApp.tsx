"use client";

import { useState, useEffect } from "react";
import { Moon, LogOut, Globe, Unlock, Lock, Menu, X } from "lucide-react";
import DriveFileList from "@/components/DriveFileList";
import ChatInterface from "@/components/ChatInterface";
import PublicSidebar from "@/components/PublicSidebar";

export default function MainApp({ session, signInAction, signOutAction }: any) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPwdInput, setShowPwdInput] = useState(false);
  const [pwd, setPwd] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (localStorage.getItem("moon_admin") === "true") {
      setIsAdmin(true);
    }
  }, []);

  const handleAdminToggle = () => {
    if (isAdmin) {
      localStorage.removeItem("moon_admin");
      setIsAdmin(false);
      setShowPwdInput(false);
    } else {
      setShowPwdInput(true);
    }
  };

  const handlePwdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === "8395") {
      localStorage.setItem("moon_admin", "true");
      setIsAdmin(true);
      setShowPwdInput(false);
      setPwd("");
    } else {
      alert("비밀번호가 일치하지 않습니다.");
      setPwd("");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="absolute inset-4 md:inset-6 flex flex-col gap-4 font-sans overflow-hidden">
      
      {/* 1. Header */}
      <header className="shrink-0 h-[72px] apple-card apple-glass flex justify-between items-center px-4 md:px-6 transition-all relative z-40">
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            className="md:hidden p-2 text-white/80 hover:text-white"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div 
            className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors cursor-pointer shrink-0 ${
              isAdmin ? "bg-amber-500 shadow-amber-500/20" : "bg-[#007aff] shadow-blue-500/20 hover:scale-105"
            }`}
            onClick={handleAdminToggle}
            title={isAdmin ? "관리자 모드 종료" : "관리자 모드 로그인"}
          >
            {isAdmin ? <Unlock size={18} className="md:w-5 md:h-5" /> : <Moon size={20} className="md:w-5 md:h-5" />}
          </div>

          {showPwdInput && !isAdmin && (
            <form onSubmit={handlePwdSubmit} className="flex items-center gap-2 bg-white/10 p-1.5 rounded-lg border border-white/20 animate-in fade-in slide-in-from-left-2 duration-300">
              <input 
                type="password"
                placeholder="Password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoFocus
                className="bg-transparent text-white text-xs outline-none px-2 w-24 md:w-32"
              />
              <button type="submit" className="bg-[#007aff] text-white text-[10px] font-bold px-3 py-1 rounded-md">확인</button>
              <button type="button" onClick={() => setShowPwdInput(false)} className="text-white/40 hover:text-white"><X size={14} /></button>
            </form>
          )}

          {!showPwdInput && (
            <div className="flex flex-col justify-center">
              <h1 className="text-[1.05rem] md:text-lg font-bold text-white leading-tight flex items-center gap-2">
                CEUM AI Assistant
              </h1>
              <p className="text-[#8e8e93] text-[9px] md:text-[10px] uppercase tracking-widest font-bold">
                CEUM MINISTRY
                {isAdmin && <span className="ml-1.5 text-amber-500 tracking-normal">(관리자 모드)</span>}
              </p>
            </div>
          )}
        </div>
        
        {isAdmin ? (
          session ? (
            <div className="flex items-center gap-3 md:gap-5">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#2c2c2e] flex items-center justify-center text-[10px] font-bold border border-white/10 text-white">
                  {session.user?.name?.charAt(0)}
                </div>
                <span className="text-sm font-medium text-white/90">{session.user?.name}님</span>
              </div>
              <div className="w-px h-4 bg-white/10 hidden sm:block"></div>
              <button 
                onClick={() => signOutAction()}
                className="text-[#8e8e93] hover:text-white text-[10px] md:text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="구글 로그아웃"
              >
                <LogOut size={16} /> <span className="hidden sm:inline">구글 로그아웃</span>
              </button>
              <button 
                onClick={handleAdminToggle}
                className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1.5 md:px-3 rounded-full text-[10px] md:text-xs font-bold hover:bg-red-500/20 transition-colors shrink-0"
              >
                종료
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={handleAdminToggle}
                className="text-[#8e8e93] hover:text-white px-2 py-2 text-[10px] md:text-xs font-bold transition-colors"
              >
                관리자 종료
              </button>
              <button 
                onClick={() => signInAction()}
                className="bg-white text-black px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold shadow-lg hover:bg-gray-200 transition-colors"
              >
                Google 로그인
              </button>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 hidden sm:flex">
            <span className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-widest px-3 py-1.5 bg-white/5 border border-white/5 rounded-full">
              User Mode
            </span>
          </div>
        )}
      </header>

      {/* 2. Main Body */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 relative">
        
        {/* Mobile Backdrop Overlay */}
        {showMobileMenu && (
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
            onClick={() => setShowMobileMenu(false)}
          />
        )}

        {/* Left Sidebar (Drawer on Mobile) */}
        <aside className={`
          absolute md:relative z-30 flex-col shrink-0 overflow-hidden apple-card apple-glass transition-all duration-300
          ${showMobileMenu ? "flex" : "hidden md:flex"}
          w-[280px] md:w-[320px] lg:w-[380px]
          h-[calc(100vh-120px)] md:h-auto
          left-0 top-0 md:left-auto md:top-auto
          shadow-2xl md:shadow-none
        `}>
          <div className="shrink-0 p-4 md:p-5 px-5 md:px-6 border-b border-white/5 flex items-center justify-between bg-black/20">
            <h2 className="text-xs font-bold text-[#8e8e93] uppercase tracking-widest flex items-center gap-2">
              <Globe size={14} className={isAdmin ? "text-amber-500" : "text-[#007aff]"} /> 
              {isAdmin ? "Admin Control" : "Church Knowledge"}
            </h2>
            <button className="md:hidden text-white/50 hover:text-white" onClick={() => setShowMobileMenu(false)}>
              <X size={16} />
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
              <PublicSidebar />
            )}
          </div>
        </aside>

        {/* Right Chat Area */}
        <main className="flex-1 flex flex-col apple-card apple-glass overflow-hidden min-w-0 shadow-lg shadow-black/50 relative z-10 w-full">
          <ChatInterface />
        </main>
        
      </div>
    </div>
  );
}
