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

      <main className="flex-1 flex flex-col px-6 pt-12 pb-32 max-w-lg mx-auto w-full relative z-10">
        <header className="mb-10 animate-soft-in flex justify-between items-start">
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
          <div className="glass-card p-6 animate-soft-in shadow-xl">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="一次記多筆也可以喔！&#10;例：昨天早餐50 捷運20 晚餐100"
              className="w-full min-h-[140px] bg-transparent border-none outline-none text-lg font-bold placeholder:opacity-30 resize-none"
              style={{ color: "var(--text-primary)" }}
            />

            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setInputText("午餐150")}
                  className="px-3 py-1.5 bg-[var(--bg-soft)] text-[var(--accent)] text-[11px] font-black rounded-full hover:bg-[var(--accent)] hover:text-white transition-colors"
                >
                  午餐150
                </button>
                <button
                  onClick={() => setInputText("昨天看醫生200")}
                  className="px-3 py-1.5 bg-[var(--bg-soft)] text-[var(--status-blue)] text-[11px] font-black rounded-full hover:bg-[var(--status-blue)] hover:text-white transition-colors"
                >
                  補記昨天
                </button>
              </div>

              <button
                onClick={handleParse}
                disabled={parsing || !inputText.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
              >
                {parsing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            <div className="space-y-4 animate-soft-in">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <span className="w-2 h-5 bg-[var(--accent)] rounded-full" />
                  即將種下的消費種子 ({previews.length})
                </h3>
              </div>

              <div className="space-y-3">
                {previews.map((item, idx) => (
                  <div key={idx} className="glass-card p-5 group animate-soft-in" style={{ borderBottomWidth: "6px" }}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[var(--bg-soft)] text-[var(--accent)] text-[10px] font-black rounded-md">
                          {item.date}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-500 text-[10px] font-black rounded-md">
                          {item.category}
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex justify-between items-end">
                      <h4 className="text-xl font-black truncate max-w-[65%]" style={{ color: "var(--text-primary)" }}>
                        {item.item}
                      </h4>
                      <p className="text-2xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>
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
                className="w-full py-5 bg-[var(--accent)] hover:bg-[#74b036] text-white font-black text-lg rounded-[28px] shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:grayscale"
              >
                {saving ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "🌱"}
                {saving ? "正在播種..." : "全部種下 (儲存到試算表)"}
              </button>

              <button
                onClick={() => setPreviews([])}
                className="w-full text-[11px] font-black opacity-40 hover:opacity-100 py-2 transition-opacity"
              >
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
