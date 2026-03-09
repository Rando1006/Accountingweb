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
    飲食: "🍜",
    交通: "🚇",
    購物: "🛍️",
    居家: "🏠",
    娛樂: "🎬",
    醫療: "💊",
    其他: "📌",
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
        <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
            <div className="decoration-blob w-[300px] h-[300px] bg-green-100 top-[-100px] left-[-100px]" />
            <div className="decoration-blob w-[250px] h-[250px] bg-blue-50 bottom-[10%] right-[-50px]" />

            <main className="flex-1 flex flex-col px-4 pt-16 pb-32 max-w-lg mx-auto w-full relative z-10">
                <header className="mb-6 px-2 animate-soft-in">
                    <h1 className="text-3xl font-black tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
                        搜尋紀錄
                    </h1>

                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-xl opacity-50">🔍</span>
                        </div>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="尋找什麼？項目、分類或備註..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-[var(--accent)]/20 transition-all font-bold shadow-sm"
                            style={{
                                background: "var(--card-bg)",
                                border: "1px solid var(--border)",
                                color: "var(--text-primary)"
                            }}
                        />
                    </div>

                    {/* 進階篩選區塊 */}
                    <div className="glass-card p-4 rounded-2xl space-y-4">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-[10px] font-black uppercase tracking-widest pl-1 mb-1.5" style={{ color: "var(--text-muted)" }}>開始日期</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg-soft)] rounded-xl outline-none text-xs font-bold"
                                    style={{ color: "var(--text-primary)" }}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-black uppercase tracking-widest pl-1 mb-1.5" style={{ color: "var(--text-muted)" }}>結束日期</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg-soft)] rounded-xl outline-none text-xs font-bold"
                                    style={{ color: "var(--text-primary)" }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-[10px] font-black uppercase tracking-widest pl-1 mb-1.5" style={{ color: "var(--text-muted)" }}>分類</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-[var(--bg-soft)] rounded-xl outline-none text-xs font-bold appearance-none"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    <option value="全部">所有分類</option>
                                    {Object.keys(CATEGORY_ICONS).map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-black uppercase tracking-widest pl-1 mb-1.5" style={{ color: "var(--text-muted)" }}>付款方式</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-[var(--bg-soft)] rounded-xl outline-none text-xs font-bold appearance-none"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    <option value="全部">所有方式</option>
                                    <option value="現金">💵 現金</option>
                                    <option value="信用卡/行動支付">💳 信用卡 / 行動支付</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="w-10 h-10 border-4 border-[var(--bg-soft)] border-t-[var(--accent)] rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="glass-card mx-4 p-8 text-center text-red-500 font-bold bg-red-50/50 border-red-100">
                            ⚠️ {error}
                        </div>
                    ) : !hasSearched ? (
                        <div className="flex flex-col items-center justify-center text-center py-20 opacity-50 animate-soft-in">
                            <div className="text-5xl mb-4">👀</div>
                            <p className="font-bold" style={{ color: "var(--text-primary)" }}>輸入關鍵字或選擇條件開始尋寶吧</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-20 opacity-50 animate-soft-in">
                            <div className="text-5xl mb-4">🍃</div>
                            <p className="font-bold" style={{ color: "var(--text-primary)" }}>找不到符合的紀錄</p>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-soft-in">
                            <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-2 border-dashed border-[var(--accent)]">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                        符合條件共 {results.length} 筆
                                    </span>
                                    <span className="text-xs font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                                        搜尋結果總計
                                    </span>
                                </div>
                                <div className="text-2xl font-black" style={{ color: "var(--accent)" }}>
                                    ${totalAmount.toLocaleString()}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {results.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="glass-card flex items-center gap-3 pl-4 pr-5 py-4 cursor-pointer hover:scale-[1.02] transition-transform"
                                        onClick={() => setEditData(item)}
                                    >
                                        <div className="w-11 h-11 rounded-[16px] bg-[var(--bg-soft)] flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                                            {CATEGORY_ICONS[item.category] ?? "📌"}
                                        </div>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <p className="text-base font-bold truncate mb-0.5" style={{ color: "var(--text-primary)" }}>
                                                {item.item}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={`badge-${item.category} px-2.5 py-0.5 rounded-full text-[10px] font-black`}>
                                                    {item.category}
                                                </span>
                                                <span className="text-[10px] bg-[var(--bg-soft)] px-2 py-0.5 rounded-full font-black opacity-80" style={{ color: "var(--text-primary)" }}>
                                                    {item.paymentMethod && item.paymentMethod !== "現金" ? `💳 ${item.paymentMethod}` : "💵 現金"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end flex-shrink-0">
                                            <div className="text-lg font-black" style={{ color: "var(--text-primary)" }}>
                                                ${item.amount.toLocaleString()}
                                            </div>
                                            <span className="text-[10px] font-bold mt-0.5" style={{ color: "var(--text-muted)" }}>
                                                {item.date}
                                            </span>
                                        </div>
                                    </div>
                                ))}
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
