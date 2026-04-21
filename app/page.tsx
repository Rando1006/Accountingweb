"use client";

import { useState, useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";

import UserSetting from "@/components/UserSetting";

interface ParsedExpense {
  item: string;
  amount: number;
  category: string;
  date: string;
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [previews, setPreviews] = useState<ParsedExpense[]>([]);
  const [userId, setUserId] = useState("default");
  const [saving, setSaving] = useState(false);
  const [isPlanting, setIsPlanting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [isUserSettingOpen, setIsUserSettingOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("pocket_account_user_id");
    if (savedId) setUserId(savedId);
  }, []);

  const handleSaveUserId = (newId: string) => {
    const cleanId = newId.trim();
    if (!cleanId) return;
    setUserId(cleanId);
    localStorage.setItem("pocket_account_user_id", cleanId);
  };

  const handleParse = async () => {
    if (!inputText.trim()) return;
    setParsing(true);
    setStatusMsg("");
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (data.expenses && Array.isArray(data.expenses)) {
        setPreviews(data.expenses);
        if (data.expenses.length === 0) setStatusMsg("未能辨別出有效的消費內容...");
      } else {
        setStatusMsg("解析失敗，請換個說法試試看");
      }
    } catch (err) {
      setStatusMsg("伺服器連線故障 🌿");
    } finally {
      setParsing(false);
    }
  };

  const removeItem = (idx: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAll = async () => {
    if (previews.length === 0) return;
    setSaving(true);
    setIsPlanting(true);
    
    // 等待動畫播放 (400ms)
    await new Promise(resolve => setTimeout(resolve, 400));
    
    try {
      const dataToSave = previews.map(p => ({ ...p, userId }));
      const res = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });
      const result = await res.json();
      if (result.success) {
        setStatusMsg(result.message);
        setPreviews([]);
        setInputText("");
      } else {
        setStatusMsg("儲存失敗： " + result.error);
      }
    } catch (err) {
      setStatusMsg("連線中斷，請確認網路 🌸");
    } finally {
      setSaving(false);
      setIsPlanting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* 裝飾性背景元素 */}
      <div className="decoration-blob w-[300px] h-[300px] bg-green-50 top-[-100px] left-[-100px] opacity-60" />
      <div className="decoration-blob w-[250px] h-[250px] bg-blue-50 bottom-[20%] right-[-50px] opacity-40" />

      <main 
        className="flex-1 flex flex-col px-6 pt-16 max-w-lg mx-auto w-full relative z-10"
        style={{ paddingBottom: "var(--nav-spacer)" }}
      >
        <header className="mb-10 px-2 animate-soft-in flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>
              種下今天的<br />
              消費紀錄 🌱
            </h1>
            <p className="text-sm font-bold mt-3" style={{ color: "var(--text-muted)" }}>
              記錄花費，AI 自動幫您分類存入試算表
            </p>
          </div>

          <button
            onClick={() => setIsUserSettingOpen(true)}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-[var(--border)] hover:bg-white transition-colors shrink-0"
          >
            <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">
              {userId.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold max-w-[80px] truncate" style={{ color: "var(--text-primary)" }}>
              {userId}
            </span>
          </button>
        </header>

        <section className="space-y-6">
          <div className="glass-card mx-2 p-6 md:p-7 animate-soft-in shadow-xl">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="一次記多筆也可以喔！&#10;例：昨天早餐50 捷運20 晚餐50"
              className="w-full min-h-[120px] bg-white/70 border border-transparent focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 rounded-2xl outline-none text-lg font-bold placeholder:opacity-40 resize-none transition-all shadow-inner"
              style={{ color: "var(--text-primary)", padding: "12px 16px", lineHeight: "1.5" }}
            />



            {/* 解析按鈕——美甲友善/大熱區滿版設計 */}
            <div style={{ marginTop: "16px" }}>
              <button
                onClick={handleParse}
                disabled={parsing || !inputText.trim()}
                className="w-full py-[18px] bg-[#e8f5e9] text-[#2e7d32] font-black text-xl rounded-[1.25rem] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-40 disabled:grayscale hover:bg-[#c8e6c9]"
              >
                {parsing ? (
                  <div className="w-6 h-6 border-2 border-[#2e7d32]/30 border-t-[#2e7d32] rounded-full animate-spin" />
                ) : "✨"}
                {parsing ? "正在通靈..." : "解析記帳"}
              </button>
            </div>
          </div>

          {statusMsg && (
            <div className="animate-soft-in p-4 text-center rounded-2xl bg-white/40 border border-[var(--border)] text-xs font-black" style={{ color: "var(--accent)" }}>
              {statusMsg}
            </div>
          )}

          {previews.length > 0 && (
            <div className="space-y-5 animate-soft-in" style={{ marginTop: "24px" }}>
              <div className="flex items-center justify-between px-4">
                <h3 className="text-base font-black flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <span className="w-2 h-5 bg-[var(--accent)] rounded-full" />
                  即將種下的消費種子 ({previews.length})
                </h3>
              </div>

              <div className="space-y-0">
                {previews.map((item, idx) => (
                  <div key={idx} className={`border-b border-[#f0f0f0] last:border-b-0 py-6 px-2 group animate-soft-in ${isPlanting ? 'is-planting' : ''}`} style={{ animationDelay: isPlanting ? `${idx * 50}ms` : '0ms' }}>
                    <div className="flex justify-between items-center gap-4">
                      {/* 左：日期與分類 (上下排列) */}
                      <div className="flex flex-col gap-2 shrink-0 w-[100px]">
                        <span className="text-lg text-[#9ca3af] tracking-wider font-bold leading-none">
                          {item.date}
                        </span>
                        <span className="bg-[#e8f5e9] text-[#4caf50] rounded-[16px] px-3.5 py-1.5 text-lg font-black w-fit leading-none">
                          {item.category}
                        </span>
                      </div>
                      
                      {/* 中：品項 */}
                      <div className="flex-1 min-w-0 pl-1">
                         <h4 className="text-lg font-bold truncate" style={{ color: "var(--text-primary)" }}>
                           {item.item}
                         </h4>
                      </div>

                      {/* 右：金額與刪除 */}
                      <div className="flex items-center gap-5 shrink-0">
                        <p className="font-sans font-black text-3xl tracking-tighter text-[#333]">
                          <span className="text-base opacity-50 mr-0.5">$</span>
                          {item.amount.toLocaleString()}
                        </p>
                        <button
                          onClick={() => removeItem(idx)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors text-lg font-black -mr-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="w-full py-7 mb-4 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white font-black text-2xl rounded-[1.5rem] shadow-xl shadow-[var(--accent)]/40 transition-all flex items-center justify-center gap-3 active:scale-95 active:shadow-md disabled:grayscale"
                style={{ marginTop: "16px" }}
              >
                {saving ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "🌱"}
                {saving ? "正在播種..." : "全部種下"}
              </button>

              <div className="h-6" /> {/* 強制拉開與上方按鈕的距離 */}

              <button
                onClick={() => { setPreviews([]); setInputText(""); }}
                className="w-full py-4 text-base font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 rounded-[1.5rem] transition-all text-center"
                style={{ color: "var(--text-muted)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                清空並重新輸入
              </button>
            </div>
          )}
        </section>
      </main>

      <UserSetting
        isOpen={isUserSettingOpen}
        onClose={() => setIsUserSettingOpen(false)}
        onSave={handleSaveUserId}
        currentId={userId}
      />

      <Navigation />
    </div>
  );
}
