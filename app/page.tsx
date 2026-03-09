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
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* 裝飾性背景元素 */}
      <div className="decoration-blob w-[300px] h-[300px] bg-green-50 top-[-100px] left-[-100px] opacity-60" />
      <div className="decoration-blob w-[250px] h-[250px] bg-blue-50 bottom-[20%] right-[-50px] opacity-40" />

      <main className="flex-1 flex flex-col px-6 pt-16 pb-32 max-w-lg mx-auto w-full relative z-10">
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
              placeholder="一次記多筆也可以喔！&#10;例：昨天早馇50 捷運20 晚馇50"
              className="w-full min-h-[100px] p-3 bg-transparent border-none outline-none text-lg font-bold placeholder:opacity-30 resize-none"
              style={{ color: "var(--text-primary)" }}
            />

            {/* 快捷按鈕列 */}
            <div className="flex gap-2.5 mt-2 mb-5">
              <button
                onClick={() => setInputText("午餐150")}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-soft)] text-[var(--accent)] text-sm font-black rounded-full hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm border border-[var(--accent)]/10"
              >
                🍜 午餐 150
              </button>
              <button
                onClick={() => setInputText("昨天看醫生200")}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-soft)] text-[var(--status-blue)] text-sm font-black rounded-full hover:bg-[var(--status-blue)] hover:text-white transition-all shadow-sm border border-[var(--status-blue)]/10"
              >
                🗓 補記昨天
              </button>
            </div>

            {/* 解析按鈕——全寬置底，符合向下視線流動 */}
            <button
              onClick={handleParse}
              disabled={parsing || !inputText.trim()}
              className="w-full py-8 mt-2 bg-[var(--accent)] hover:bg-[#74b036] text-white font-black text-2xl rounded-[32px] shadow-md shadow-green-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-40 disabled:grayscale"
            >
              {parsing ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "✨"}
              {parsing ? "正在通靈..." : "解析記帳"}
            </button>
          </div>

          {statusMsg && (
            <div className="animate-soft-in p-4 text-center rounded-2xl bg-white/40 border border-[var(--border)] text-xs font-black" style={{ color: "var(--accent)" }}>
              {statusMsg}
            </div>
          )}

          {previews.length > 0 && (
            <div className="space-y-4 animate-soft-in">
              <div className="flex items-center justify-between px-4">
                <h3 className="text-sm font-black flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <span className="w-2 h-5 bg-[var(--accent)] rounded-full" />
                  即將種下的消費種子 ({previews.length})
                </h3>
              </div>

              <div className="space-y-4">
                {previews.map((item, idx) => (
                  <div key={idx} className="glass-card mx-2 px-6 py-5 group animate-soft-in" style={{ borderBottomWidth: "6px" }}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-[var(--bg-soft)] text-[var(--accent)] text-xs font-black rounded-lg">
                          {item.date}
                        </span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-500 text-xs font-black rounded-lg">
                          {item.category}
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-sm font-black"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex justify-between items-end pb-1">
                      <h4 className="text-xl font-black truncate max-w-[65%]" style={{ color: "var(--text-primary)" }}>
                        {item.item}
                      </h4>
                      <p className="text-2xl font-black tracking-tighter pr-2" style={{ color: "var(--text-primary)" }}>
                        <span className="text-sm opacity-50 mr-0.5">$</span>
                        {item.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="w-full py-9 mb-6 bg-[var(--accent)] hover:bg-[#74b036] text-white font-black text-3xl rounded-[36px] shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:grayscale"
              >
                {saving ? (
                  <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "🌱"}
                {saving ? "正在播種..." : "全部種下"}
              </button>

              <button
                onClick={() => { setPreviews([]); setInputText(""); }}
                className="w-full py-6 text-xl font-black rounded-[28px] border-2 border-dashed border-[var(--border)] hover:border-red-300 hover:text-red-400 transition-all text-center"
                style={{ color: "var(--text-muted)" }}
              >
                🗑 清空並重新輸入
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
