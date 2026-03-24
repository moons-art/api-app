"use client";

import { useEffect, useState } from "react";
import { Database, Folder, FileText, ChevronRight, ChevronDown, Lock } from "lucide-react";

export default function PublicSidebar({ session }: { session: any }) {
  const [storageUsage, setStorageUsage] = useState<any>(null);
  const [info, setInfo] = useState<{ folders: any[], files: any[] }>({ folders: [], files: [] });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch("/api/rag/storage").then(r => r.json()).then(setStorageUsage).catch(console.error);
    fetch("/api/rag/info").then(r => r.json()).then(setInfo).catch(console.error);
  }, [session]);

  if (!session) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center text-[#8e8e93] opacity-60 gap-3">
        <Lock size={32} className="mb-2 text-white/20" />
        <p className="text-xs">학습된 자료 목록은 관리자 로그인 후<br/>확인하실 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 animate-slide-up space-y-6">
      
      {/* Storage Section */}
      {storageUsage && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center text-[10px] text-secondary mb-3 font-bold uppercase tracking-[0.1em]">
            <span className="flex items-center gap-1.5"><Database size={12}/> AI 지식 베이스</span>
            <span>{Math.round(storageUsage.totalBytes / 1024 / 1024 * 10) / 10} MB</span>
          </div>
          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-apple-blue transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,122,255,0.5)]" 
              style={{ width: `${Math.max(2, (storageUsage.totalBytes / storageUsage.limitBytes) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-secondary mt-2 text-right">{storageUsage.fileCount}개의 문서 학습 완료</p>
        </div>
      )}

      {/* Indexed Materials List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full shrink-0 flex items-center justify-between p-4 bg-apple-light-gray/30 hover:bg-white/5 border border-white/5 rounded-2xl transition-all shadow-sm"
        >
          <span className="text-sm font-bold text-white flex items-center gap-2">학습된 자료 목차 보기</span>
          {isExpanded ? <ChevronDown size={16} className="text-[#007aff]" /> : <ChevronRight size={16} className="text-secondary" />}
        </button>

        {isExpanded && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            
            {/* Folders */}
            {info.folders.length > 0 && (
              <div className="space-y-2 animate-slide-up">
                <h3 className="text-[10px] uppercase font-bold text-[#8e8e93] px-2 tracking-widest">연동 진행된 구글 폴더</h3>
                {info.folders.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[0.85rem]">
                    <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                      <Folder size={14} fill="currentColor" fillOpacity={0.2} />
                    </div>
                    <span className="truncate text-white/90">{f.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Files */}
            {info.files.length > 0 && (
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '50ms' }}>
                <h3 className="text-[10px] uppercase font-bold text-[#8e8e93] px-2 pt-2 tracking-widest border-t border-white/5">구체적인 학습 문서</h3>
                {info.files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[0.85rem]">
                    <div className="p-1.5 bg-apple-blue/10 text-apple-blue rounded-lg shrink-0">
                      <FileText size={14} />
                    </div>
                    <span className="truncate text-white/90">{f.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {info.folders.length === 0 && info.files.length === 0 && (
              <div className="p-6 text-center text-secondary text-xs">
                아직 확보된 교회 지식 기반이 없습니다. <br /> 관리자가 자료를 연동해야 합니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
