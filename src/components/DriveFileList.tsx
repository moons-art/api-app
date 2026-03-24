"use client";

import { useEffect, useState } from "react";
import { FileText, Folder, ChevronLeft, ChevronDown, CheckCircle, Loader2, Plus, HardDrive, Trash2, FolderPlus, X, Box, LucideIcon } from "lucide-react";

export default function DriveFileList({ accessToken }: { accessToken: string }) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [indexing, setIndexing] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [indexedFiles, setIndexedFiles] = useState<string[]>([]);
  const [folderHistory, setFolderHistory] = useState<{ id: string, name: string }[]>([]);
  const [currentFolder, setCurrentFolder] = useState({ id: "root", name: "최상위" });
  const [storageUsage, setStorageUsage] = useState<{ totalBytes: number, limitBytes: number, fileCount: number } | null>(null);
  const [registeredFolders, setRegisteredFolders] = useState<{fileId: string, name: string}[]>([]);
  const [indexedInfo, setIndexedInfo] = useState<{ folders: any[], files: any[] }>({ folders: [], files: [] });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const res = await fetch("/api/rag/storage");
        const data = await res.json();
        setStorageUsage(data);
      } catch (err) { console.error(err); }
    };
    const fetchRegisteredFolders = async () => {
      try {
        const res = await fetch("/api/rag/folder");
        const data = await res.json();
        setRegisteredFolders(data.folders || []);
      } catch (err) { console.error(err); }
    };
    const fetchInfo = async () => {
      try {
        const res = await fetch("/api/rag/info");
        const data = await res.json();
        setIndexedInfo(data);
        if (data.files) {
          setIndexedFiles(data.files.map((f: any) => f.fileId));
        }
      } catch (err) { console.error(err); }
    };

    fetchStorage();
    fetchRegisteredFolders();
    fetchInfo();
  }, [indexedFiles.length]); // Refresh info when indexedFiles changes

  useEffect(() => {
    if (!isPickerOpen) return;
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/drive/list?folderId=${currentFolder.id}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Google Drive에서 폴더 목록을 불러오지 못했습니다.");
        }
        setFiles(data.files || []);
      } catch (err: any) {
        console.error("Failed to fetch files:", err);
        setErrorMsg(err.message || "오류가 발생했습니다. 로그아웃 후 다시 로그인해보세요.");
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [currentFolder, isPickerOpen]);

  const handleIndex = async (fileId: string) => {
    setIndexing(fileId);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/rag/index", {
        method: "POST",
        body: JSON.stringify({ fileId }),
      });
      const data = await res.json();
      if (res.ok) {
        setIndexedFiles(prev => [...prev, fileId]);
      } else {
        setErrorMsg(data.error || "학습 실패");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "학습 중 오류 발생");
    } finally {
      setIndexing(null);
    }
  };

  const handleUnindex = async (fileId: string) => {
    setIndexing(fileId);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/rag/delete", {
        method: "POST",
        body: JSON.stringify({ fileId }),
      });
      if (res.ok) {
        setIndexedFiles(prev => prev.filter(id => id !== fileId));
        setIndexedInfo(prev => ({...prev, files: prev.files.filter(f => f.fileId !== fileId)}));
      }
    } catch (err: any) {
      setErrorMsg(err.message || "삭제 중 오류 발생");
    } finally {
      setIndexing(null);
    }
  };

  const registerFolder = async (folderId: string, name: string) => {
    try {
      const res = await fetch("/api/rag/folder", {
        method: "POST",
        body: JSON.stringify({ folderId, name }),
      });
      if (res.ok) {
        setRegisteredFolders(prev => [...prev, { fileId: folderId, name }]);
        setIsPickerOpen(false);
      }
    } catch (err) { console.error(err); }
  };

  const unregisterFolder = async (folderId: string) => {
    try {
      const res = await fetch("/api/rag/folder/delete", {
        method: "POST",
        body: JSON.stringify({ folderId }),
      });
      if (res.ok) {
        setRegisteredFolders(prev => prev.filter(f => f.fileId !== folderId));
      }
    } catch (err) { console.error(err); }
  };

  const handleBatchIndex = async () => {
    const unindexed = files.filter(f => f.mimeType !== "application/vnd.google-apps.folder" && !indexedFiles.includes(f.id));
    for (const file of unindexed) {
      await handleIndex(file.id);
    }
  };

  const navigateToFolder = (id: string, name: string) => {
    setFolderHistory(prev => [...prev, currentFolder]);
    setCurrentFolder({ id, name });
  };

  const goBack = () => {
    const prev = folderHistory[folderHistory.length - 1];
    if (prev) {
      setFolderHistory(prevHistory => prevHistory.slice(0, -1));
      setCurrentFolder(prev);
    }
  };

  return (
    <div className="flex flex-col h-full animate-slide-up">
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold flex items-center justify-between">
          <p>{errorMsg}</p>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-red-500/20 rounded-full"><X size={12} /></button>
        </div>
      )}

      {storageUsage && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl shadow-sm">
          <div className="flex justify-between text-[10px] text-secondary mb-2 font-bold uppercase tracking-[0.1em]">
            <span>Storage Usage</span>
            <span>{Math.round(storageUsage.totalBytes / 1024 / 1024 * 10) / 10} MB / 20 GB</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-apple-blue transition-all duration-1000 ease-out" 
              style={{ width: `${Math.max(2, (storageUsage.totalBytes / storageUsage.limitBytes) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {!isPickerOpen ? (
        <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
          <button 
            onClick={() => setIsPickerOpen(true)}
            className="group w-full p-6 border border-white/5 bg-white/5 rounded-3xl flex items-center justify-between hover:bg-white/[0.08] transition-all shrink-0"
          >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-apple-blue/10 rounded-2xl flex items-center justify-center text-apple-blue group-hover:scale-105 transition-transform">
                <FolderPlus size={20} />
                </div>
                <div className="text-left">
                <p className="font-bold text-sm">자료 폴더 연결</p>
                <p className="text-[10px] text-secondary">구글 드라이브 자료 연동</p>
                </div>
            </div>
            <Plus size={16} className="text-secondary group-hover:text-white transition-colors" />
          </button>

          <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar">
            {/* Indexed Materials Accordion */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-apple-light-gray/30 hover:bg-white/5 border border-white/5 rounded-2xl transition-all shadow-sm"
              >
                <div className="text-[0.9rem] font-bold text-white flex items-center gap-2">학습된 자료 목차 보기</div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-apple-blue/20 text-apple-blue px-2 py-0.5 rounded-full font-bold">{indexedInfo.files.length}</span>
                  {isExpanded ? <ChevronDown size={14} className="text-[#007aff]" /> : <ChevronLeft className="rotate-180 text-secondary" size={14} />}
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-2 animate-slide-up pl-1">
                  {indexedInfo.files.length > 0 ? indexedInfo.files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[0.85rem]">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-1.5 bg-apple-blue/10 text-apple-blue rounded-lg shrink-0">
                          <FileText size={14} />
                        </div>
                        <span className="truncate text-white/90 font-medium">{f.name}</span>
                      </div>
                      <button 
                          onClick={() => handleUnindex(f.fileId)}
                          disabled={indexing === f.fileId}
                          className="p-1.5 hover:bg-red-500/20 text-red-400/50 hover:text-red-400 rounded-lg transition-colors shrink-0"
                          title="문서 삭제 (Unindex)"
                      >
                          {indexing === f.fileId ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </button>
                    </div>
                  )) : (
                    <div className="p-4 text-center text-secondary text-xs opacity-50">학습된 문서가 없습니다.</div>
                  )}
                </div>
              )}
            </div>

            {/* Registered Folders */}
            <div>
              <h3 className="text-[10px] uppercase font-bold text-[#8e8e93] px-2 tracking-widest mb-3">연동 진행된 구글 폴더</h3>
              <div className="space-y-3">
            {registeredFolders.map(folder => (
              <div 
                key={folder.fileId} 
                className="group flex items-center justify-between p-4 rounded-3xl bg-apple-light-gray/40 border border-white/5 hover:border-apple-blue/30 transition-all cursor-pointer"
                onClick={() => {
                    setCurrentFolder({ id: folder.fileId, name: folder.name });
                    setIsPickerOpen(true);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-apple-blue/10 rounded-xl flex items-center justify-center text-apple-blue">
                    <Folder size={18} />
                  </div>
                  <span className="text-[0.9rem] font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{folder.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            unregisterFolder(folder.fileId);
                        }}
                        className="p-1.5 hover:bg-red-500/20 text-red-400/50 hover:text-red-400 rounded-lg transition-colors shrink-0"
                        title="폴더 연동 해제"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
              </div>
            ))}
              {registeredFolders.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center text-center opacity-30 grayscale italic">
                      <Box size={24} className="mb-2" />
                      <p className="text-[10px]">No folders connected</p>
                  </div>
              )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden animate-slide-up">
          <div className="mb-4 flex items-center justify-between">
            <button 
                onClick={() => {
                    if (folderHistory.length > 0) goBack();
                    else setIsPickerOpen(false);
                }} 
                className="flex items-center gap-1 text-[11px] font-bold text-secondary hover:text-white transition-colors uppercase tracking-widest"
            >
                <ChevronLeft size={16} />
                Back
            </button>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-white/5 rounded-full text-secondary max-w-[80px] truncate">{currentFolder.name}</span>
                {currentFolder.id !== "root" && !registeredFolders.find(f => f.fileId === currentFolder.id) ? (
                    <button 
                    onClick={() => registerFolder(currentFolder.id, currentFolder.name)}
                    className="text-[9px] font-black tracking-tighter uppercase px-3 py-1 bg-apple-blue text-white rounded-full shadow-sm"
                    >
                        Register
                    </button>
                ) : registeredFolders.find(f => f.fileId === currentFolder.id) && (
                    <button 
                    onClick={handleBatchIndex}
                    className="text-[9px] font-black tracking-tighter uppercase px-3 py-1 bg-apple-blue/20 text-apple-blue rounded-full border border-apple-blue/30"
                    >
                        Sync All
                    </button>
                )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar min-h-[350px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
                <Loader2 className="animate-spin text-apple-blue w-6 h-6" />
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-30">Loading Cloud Files</span>
              </div>
            ) : (
              files.map((file) => (
                <div key={file.id} className="group flex items-center justify-between p-3 py-2.5 rounded-2xl hover:bg-white/5 transition-all text-[0.85rem]">
                  <div 
                    className={`flex items-center gap-3 overflow-hidden flex-1 ${file.mimeType === "application/vnd.google-apps.folder" ? "cursor-pointer" : ""}`}
                    onClick={() => file.mimeType === "application/vnd.google-apps.folder" && navigateToFolder(file.id, file.name)}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${file.mimeType === "application/vnd.google-apps.folder" ? "text-amber-400" : "text-apple-blue"}`}>
                      {file.mimeType === "application/vnd.google-apps.folder" ? <Folder size={18} fill="currentColor" fillOpacity={0.2} /> : <FileText size={18} />}
                    </div>
                    <span className="truncate font-medium">{file.name}</span>
                  </div>
                  
                  {file.mimeType !== "application/vnd.google-apps.folder" && (
                    <div className="flex items-center gap-2">
                        {indexedFiles.includes(file.id) ? (
                            <div className="flex items-center gap-1 animate-slide-up">
                                <span className="text-[9px] font-black tracking-tighter uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LEARNED</span>
                                <button 
                                    onClick={() => handleUnindex(file.id)}
                                    disabled={indexing === file.id}
                                    className="p-1 hover:bg-red-500/20 text-red-400/50 hover:text-red-400 rounded-lg transition-colors"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => handleIndex(file.id)}
                                disabled={indexing === file.id}
                                className="text-[9px] font-black tracking-tighter uppercase px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-secondary"
                            >
                                {indexing === file.id ? <Loader2 size={10} className="animate-spin" /> : "Index"}
                            </button>
                        )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
