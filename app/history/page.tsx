"use client";

import { useEffect, useState, useMemo } from "react";
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

interface DayGroup {
    date: string;
    items: ExpenseRow[];
    total: number;
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

function formatDateLabel(dateStr: string): string {
    // 處理可能出現的 2026/3/4 或 2026-3-4 格式，將其轉為標準 YYYY-MM-DD
    const normalizedDate = dateStr.replace(/\//g, "-");
    const parts = normalizedDate.split("-");
    let isoDate = normalizedDate;

    if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1].padStart(2, "0");
        const d = parts[2].padStart(2, "0");
        isoDate = `${y}-${m}-${d}`;
    }

    const date = new Date(isoDate + "T00:00:00");

    // 如果日期依然無效，直接回傳原始字串
    if (isNaN(date.getTime())) {
        return dateStr;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    const w = weekdays[date.getDay()];
    const m = date.getMonth() + 1;
    const d = date.getDate();

    if (diff === 0) return `今天（週${w}）`;
    if (diff === 1) return `昨天（週${w}）`;
    return `${m}/${d}（週${w}）`;
}

export default function HistoryPage() {
    const [allData, setAllData] = useState<ExpenseRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [userId, setUserId] = useState<string>("");
    const [editingItem, setEditingItem] = useState<ExpenseRow | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // 使用 useMemo 自動計算分組，確保與 allData 永遠同步
    const groups = useMemo(() => {
        const map = new Map<string, ExpenseRow[]>();
        allData.forEach((row) => {
            if (!map.has(row.date)) map.set(row.date, []);
            map.get(row.date)!.push(row);
        });

        const g: DayGroup[] = [];
        map.forEach((items, date) => {
            g.push({
                date,
                items,
                total: items.reduce((s, i) => s + i.amount, 0),
            });
        });
        return g.sort((a, b) => b.date.localeCompare(a.date));
    }, [allData]);

    // 格式化日期範圍顯示
    const getDateRangeLabel = () => {
        if (allData.length === 0) return null;
        const dates = allData.map(d => d.date).sort();
        const start = dates[0].replace(/-/g, "/");
        const end = dates[dates.length - 1].replace(/-/g, "/");
        return `顯示最近 ${allData.length} 筆（${start} - ${end}）`;
    };

    const LIMIT = 50;

    const fetchData = async (isLoadMore = false, isForceRefresh = false) => {
        const savedId = localStorage.getItem("pocket_account_user_id") || "default";
        setUserId(savedId);

        const currentOffset = isLoadMore ? offset + LIMIT : 0;
        if (!isLoadMore) {
            setLoading(true);
            setAllData([]);
        }

        try {
            const res = await fetch(`/api/expense?userId=${savedId}&limit=${LIMIT}&offset=${currentOffset}${isForceRefresh ? "&noCache=true" : ""}`);
            const newData: ExpenseRow[] = await res.json();

            if (newData.length < LIMIT) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            const combinedData = isLoadMore ? [...allData, ...newData] : newData;
            setAllData(combinedData);
            if (isLoadMore) setOffset(currentOffset);
        } catch {
            setError("無法載入記帳記錄");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("確定要刪除這筆紀錄嗎？🌿")) return;

        try {
            const res = await fetch(`/api/expense/${id}?userId=${userId}`, { method: "DELETE" });
            if (res.ok) {
                // 樂觀更新：先從前端 state 移除該筆，lUI 立即響應
                setAllData(prev => prev.filter(item => item.id !== id));
                // 再強制重拉從 Sheets 最新資料，繞過 Vercel 其他實例的舊快取
                fetchData(false, true);
            } else {
                alert("刪除失敗");
            }
        } catch {
            alert("連線出錯");
        }
    };


    const handleEditSave = async (updated: ExpenseRow) => {
        if (!updated.id) return;
        try {
            const res = await fetch(`/api/expense/${updated.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });
            if (res.ok) {
                // 樂觀更新：立即更新本地 state
                setAllData(prev => prev.map(item => item.id === updated.id ? { ...item, ...updated } : item));
                // 強制重拉最新資料
                fetchData(false, true);
                setIsEditOpen(false);
            } else {
                throw new Error("更新失敗");
            }
        } catch (err) {
            alert("儲存失敗");
            throw err;
        }
    };

    const totalAll = groups.reduce((s, g) => s + g.total, 0);

    return (
        <div className="min-h-screen flex flex-col overflow-x-hidden relative" style={{ background: "var(--bg-primary)" }}>
            <div className="decoration-blob w-[300px] h-[300px] bg-green-100 top-[-100px] left-[-100px]" />
            <div className="decoration-blob w-[250px] h-[250px] bg-pink-50 bottom-[10%] right-[-50px]" />

            <main className="flex-1 flex flex-col px-4 pt-16 pb-40 max-w-lg mx-auto w-full relative z-10">
                <header className="mb-6 px-2 animate-soft-in">
                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                                消費紀錄
                            </h1>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                                <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                                    玩家：<span style={{ color: "var(--accent)" }}>{userId}</span>
                                </p>
                            </div>
                        </div>
                    </div>



                </header>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-[var(--bg-soft)] border-t-[var(--accent)] rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="glass-card mx-1 p-8 text-center text-red-500 font-bold bg-red-50/50 border-red-100">
                        ⚠️ {error}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20 animate-soft-in">
                        <div className="text-6xl mb-6">🌱</div>
                        <p className="font-black text-[var(--text-primary)] mb-2">草地上還空空如也</p>
                        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                            去主頁記下第一筆消費吧！
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col animate-soft-in" style={{ gap: "90px" }}>
                        {groups.map((group) => (
                            <div key={group.date}>
                                <div className="flex items-center justify-between w-[96%] max-w-[420px] mx-auto" style={{ marginBottom: "32px" }}>
                                    <span className="text-base font-bold uppercase tracking-widest text-[#9ca3af]">
                                        {formatDateLabel(group.date)}
                                    </span>
                                    <span className="text-lg font-black tracking-tight text-[#9ca3af]">
                                        ${group.total.toLocaleString()}
                                    </span>
                                </div>

                                <div className="bg-white/60 backdrop-blur-md shadow-sm border border-[var(--border)] overflow-hidden rounded-[1.25rem]">
                                    {group.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex overflow-x-auto snap-x snap-mandatory ${idx < group.items.length - 1 ? "border-b-[1.5px] border-dashed border-[#f0f0f0]" : ""
                                                }`}
                                            // 隱藏滾動條的 inline style
                                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                        >
                                            {/* 主要內容區 (滑動前看到的範圍) */}
                                            <div className="w-full flex-shrink-0 snap-center py-5 bg-white/50">
                                                <div className="flex items-center justify-between w-[94%] max-w-[400px] mx-auto gap-3">
                                                    <div 
                                                        className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl flex-shrink-0 mr-2 sm:mr-3 shadow-sm border border-white/60 overflow-hidden"
                                                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || "#F3F4F6" }}
                                                    >
                                                        <img 
                                                            src={CATEGORY_ICONS[item.category] || "/icons/other_icon.png"} 
                                                            alt={item.category}
                                                            className="w-full h-full object-contain p-1"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0 overflow-hidden">
                                                        <p className="text-lg font-semibold truncate mb-1" style={{ color: "var(--text-primary)" }}>
                                                            {item.item}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 pt-0.5">
                                                            <span className={`badge-${item.category} px-3 py-1 rounded-full text-sm font-black`}>
                                                                {item.category}
                                                            </span>
                                                            <span className="text-sm bg-[var(--bg-soft)] px-3 py-1 rounded-full font-black opacity-80" style={{ color: "var(--text-primary)" }}>
                                                                {item.paymentMethod && item.paymentMethod !== "現金" ? `💳 ${item.paymentMethod}` : "💵 現金"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="font-sans text-2xl font-black flex-shrink-0 text-right tracking-tighter text-[#333]">
                                                        <span className="text-base opacity-50 mr-0.5">$</span>{item.amount.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 操作區塊 (向左滑動後出現) */}
                                            <div className="flex shrink-0 snap-end px-3 gap-2.5 items-center bg-transparent border-l border-[#f0f0f0]">
                                                <button
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setIsEditOpen(true);
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-lg shadow-sm hover:scale-105 transition-all"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => item.id && handleDelete(item.id)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:text-red-500 hover:bg-red-100 text-lg shadow-sm hover:scale-105 transition-all"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {hasMore && !loading && (
                            <div className="pt-4 pb-8 flex justify-center">
                                <button
                                    onClick={() => fetchData(true)}
                                    className="px-8 py-3 bg-white border-2 border-[var(--border)] text-[var(--accent)] font-black text-xs rounded-full hover:bg-[var(--bg-soft)] transition-all shadow-sm active:scale-95"
                                >
                                    載入更多歷史種子 🍀
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <EditModal
                isOpen={isEditOpen}
                data={editingItem}
                onClose={() => setIsEditOpen(false)}
                onSave={handleEditSave}
            />

            <Navigation />
        </div>
    );
}
