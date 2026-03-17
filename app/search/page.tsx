"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import EditModal from "@/components/EditModal";

interface ExpenseRow {
    date: string;
    item: string;
    amount: number;
    category: string;
    userId: string;
    id?: string;
    paymentMethod?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
    飲食: "/icons/food_icon.png",
    交通: "/icons/transport_icon.png",
    購物: "/icons/shopping_icon.png",
    居家: "/icons/home_icon.png",
    娛樂: "/icons/entertainment_icon.png",
    醫療: "/icons/medical_icon.png",
    治裝: "/icons/apparel_icon.png",
    其他: "/icons/other_icon.png",
};

const CATEGORY_COLORS: Record<string, string> = {
    飲食: "#FFE8D6", // 桃子色
    交通: "#E0F2FE", // 淺藍色
    購物: "#FCE7F3", // 淺粉色
    居家: "#DCFCE7", // 淺綠色
    娛樂: "#F3E8FF", // 淺紫色
    醫療: "#FEE2E2", // 淺紅色
    治裝: "#F5F3FF", // 淺粉紫色
    其他: "#F3F4F6", // 淺灰色
};

export default function SearchPage() {
    const [userId, setUserId] = useState("");
    const [keyword, setKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");

    // 進階篩選 State
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [category, setCategory] = useState("全部");
    const [paymentMethod, setPaymentMethod] = useState("全部");

    const [results, setResults] = useState<ExpenseRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasSearched, setHasSearched] = useState(false);

    // 編輯 Modal 狀態
    const [editData, setEditData] = useState<ExpenseRow | null>(null);

    useEffect(() => {
        // 使用首頁與歷史頁面相同的 key: pocket_account_user_id
        const storedId = localStorage.getItem("pocket_account_user_id");
        if (storedId) {
            setUserId(storedId);
        } else {
            window.location.href = "/login";
        }
    }, []);

    // Debounce 輸入
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword.trim());
        }, 500);

        return () => clearTimeout(timer);
    }, [keyword]);

    // 觸發搜尋
    useEffect(() => {
        // 沒有任何輸入與條件時不搜尋
        if (!userId || (!debouncedKeyword && !startDate && !endDate && category === "全部" && paymentMethod === "全部")) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setHasSearched(true);

        async function fetchResults() {
            setLoading(true);
            setError("");
            try {
                const query = new URLSearchParams({
                    userId: userId,
                    keyword: debouncedKeyword,
                    startDate: startDate,
                    endDate: endDate,
                    category: category,
                    paymentMethod: paymentMethod,
                    limit: "100"
                });

                const res = await fetch(`/api/expense?${query.toString()}`);
                if (res.status === 401) {
                    window.location.href = "/login";
                    return;
                }
                if (!res.ok) throw new Error("搜尋失敗");
                const data = await res.json();
                setResults(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchResults();
    }, [debouncedKeyword, startDate, endDate, category, paymentMethod, userId]);

    const handleSaveEdit = async (updated: ExpenseRow) => {
        const res = await fetch(`/api/expense/${updated.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
        });

        if (!res.ok) throw new Error("更新失敗");

        setResults((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
        );
    };

    // 計算總金額
    const totalAmount = results.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="min-h-screen flex flex-col overflow-x-hidden relative" style={{ background: "var(--bg-primary)" }}>
            <div className="decoration-blob w-[300px] h-[300px] bg-green-100 top-[-100px] left-[-100px]" />
            <div className="decoration-blob w-[250px] h-[250px] bg-blue-50 bottom-[10%] right-[-50px]" />

            <main className="flex-1 flex flex-col px-4 pt-16 pb-40 max-w-lg mx-auto w-full relative z-10">
                <header className="mb-6 px-2 animate-soft-in">
                    <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                        搜尋紀錄
                    </h1>
                    {/* 標題與搜尋框之間的間距 */}
                    <div className="h-12" />

                    <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                            <span className="text-xl opacity-40">🔍</span>
                        </div>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="尋找什麼？項目、分類或備註..."
                            className="w-full pr-4 rounded-[20px] outline-none focus:ring-4 focus:ring-[var(--accent)]/20 transition-all font-bold shadow-sm"
                            style={{
                                height: "56px",
                                paddingLeft: "52px",
                                background: "var(--card-bg)",
                                border: "1px solid var(--border)",
                                color: "var(--text-primary)",
                                fontSize: "16px"
                            }}
                        />
                    </div>

                    {/* 進階篩選區塊 */}
                    <div className="glass-card p-5 rounded-[24px] space-y-5 shadow-sm mb-6">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-[12px] font-black uppercase tracking-widest pl-1 mb-2" style={{ color: "var(--text-muted)" }}>開始日期</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 bg-[var(--bg-soft)] rounded-2xl outline-none font-bold border-2 border-transparent focus:border-[var(--accent)]/30 transition-all"
                                    style={{ color: "var(--text-primary)", height: "52px", fontSize: "15px" }}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[12px] font-black uppercase tracking-widest pl-1 mb-2" style={{ color: "var(--text-muted)" }}>結束日期</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 bg-[var(--bg-soft)] rounded-2xl outline-none font-bold border-2 border-transparent focus:border-[var(--accent)]/30 transition-all"
                                    style={{ color: "var(--text-primary)", height: "52px", fontSize: "15px" }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-[12px] font-black uppercase tracking-widest pl-1 mb-2" style={{ color: "var(--text-muted)" }}>分類</label>
                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 bg-[var(--bg-soft)] rounded-2xl outline-none font-bold appearance-none border-2 border-transparent focus:border-[var(--accent)]/30 transition-all cursor-pointer"
                                        style={{ color: "var(--text-primary)", height: "52px", fontSize: "15px" }}
                                    >
                                        <option value="全部">所有分類</option>
                                        {Object.keys(CATEGORY_ICONS).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-[12px] font-black uppercase tracking-widest pl-1 mb-2" style={{ color: "var(--text-muted)" }}>付款方式</label>
                                <div className="relative">
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-4 bg-[var(--bg-soft)] rounded-2xl outline-none font-bold appearance-none border-2 border-transparent focus:border-[var(--accent)]/30 transition-all cursor-pointer"
                                        style={{ color: "var(--text-primary)", height: "52px", fontSize: "15px" }}
                                    >
                                        <option value="全部">所有方式</option>
                                        <option value="現金">💵 現金</option>
                                        <option value="信用卡/行動支付">💳 信用卡 / 行動支付</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-[var(--bg-soft)] border-t-[var(--accent)] rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="glass-card mx-2 p-10 text-center animate-soft-in">
                            <div className="text-5xl mb-4">⚠️</div>
                            <p className="text-lg font-black text-red-500 mb-2">搜尋失敗</p>
                            <p className="text-sm font-bold text-[var(--text-muted)]">{error}</p>
                        </div>
                    ) : !hasSearched ? (
                        <div className="flex flex-col items-center justify-center text-center py-24 opacity-40 animate-soft-in">
                            <div className="text-7xl mb-6">🔍</div>
                            <h3 className="text-xl font-black mb-2" style={{ color: "var(--text-primary)" }}>準備好尋寶了嗎？</h3>
                            <p className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>輸入關鍵字或選擇條件開始搜尋紀錄</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-24 opacity-40 animate-soft-in">
                            <div className="text-7xl mb-6">🍃</div>
                            <h3 className="text-xl font-black mb-2" style={{ color: "var(--text-primary)" }}>查無相關紀錄</h3>
                            <p className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>換個關鍵字再試試看吧！</p>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-soft-in">
                            <div className="glass-card py-8 px-5 rounded-[24px] flex flex-col items-center justify-center text-center border-2 border-dashed border-[var(--accent)]/30 bg-white/40 mb-6">
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60 mb-2" style={{ color: "var(--text-muted)" }}>
                                    🎯 符合條件共 {results.length} 筆
                                </span>
                                <span className="text-lg font-black tracking-widest mb-3" style={{ color: "var(--text-primary)" }}>
                                    搜尋結果總花費
                                </span>
                                <div className="text-5xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>
                                    <span className="text-2xl mr-1 opacity-50">$</span>{totalAmount.toLocaleString()}
                                </div>
                            </div>

                            <div className="space-y-4 pb-8 mt-2 animate-soft-in mx-0.5 sm:mx-2">
                                <div className="bg-white/60 backdrop-blur-md shadow-sm border border-[var(--border)] overflow-hidden rounded-[24px]">
                                    {results.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex overflow-hidden ${idx < results.length - 1 ? "border-b-[1.5px] border-dashed border-[#f0f0f0]" : ""}`}
                                        >
                                            <div 
                                                className="w-full py-4 px-4 sm:px-6 bg-white/50 cursor-pointer hover:bg-white/80 transition-colors"
                                                onClick={() => setEditData(item)}
                                            >
                                                <div className="flex items-start justify-between w-[92%] max-w-[380px] mx-auto gap-3">
                                                    {/* 左側大 Icon */}
                                                    <div 
                                                        className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl flex-shrink-0 mr-2 sm:mr-3 shadow-sm border border-white/60 mt-0.5 overflow-hidden"
                                                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || "#F3F4F6" }}
                                                    >
                                                        <img 
                                                            src={CATEGORY_ICONS[item.category] || "/icons/other_icon.png"} 
                                                            alt={item.category}
                                                            className="w-full h-full object-contain p-1"
                                                        />
                                                    </div>
                                                    
                                                    {/* 中間文字區塊：允許被截斷與換行 */}
                                                    <div className="flex-1 min-w-0 overflow-hidden">
                                                        <p className="text-[1.05rem] font-semibold truncate mb-1" style={{ color: "var(--text-primary)" }}>
                                                            {item.item}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 pt-0.5 overflow-hidden">
                                                            <span className={`badge-${item.category} px-2.5 py-0.5 rounded-full text-[10px] font-black flex-shrink-0`}>
                                                                {item.category}
                                                            </span>
                                                            <span className="text-[10px] bg-[var(--bg-soft)] px-2 py-0.5 rounded-full font-black opacity-80 flex-shrink-0 truncate" style={{ color: "var(--text-primary)" }}>
                                                                {item.paymentMethod && item.paymentMethod !== "現金" ? `💳 ${item.paymentMethod}` : "💵 現金"}
                                                            </span>
                                                            <span className="text-[10px] font-bold opacity-40 flex-shrink-0" style={{ color: "var(--text-primary)" }}>
                                                                {item.date.replace(/-/g, "/")}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* 右側金額 (獨立區塊不動如山) */}
                                                    <div className="text-xl font-black flex-shrink-0 text-right tracking-tighter pt-1" style={{ color: "var(--text-primary)" }}>
                                                        <span className="text-sm opacity-50 mr-0.5">$</span>{item.amount.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <EditModal
                isOpen={!!editData}
                data={editData}
                onClose={() => setEditData(null)}
                onSave={handleSaveEdit}
            />
            <Navigation />
        </div >
    );
}
