"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import EditModal from "@/components/EditModal";

interface ExpenseRow {
    date: string;
    item: string;
    amount: number;
    category: string;
    userId: string;
    id?: string;
}

interface DayGroup {
    date: string;
    items: ExpenseRow[];
    total: number;
}

const CATEGORY_ICONS: Record<string, string> = {
    飲食: "🍜",
    交通: "🚇",
    購物: "🛍️",
    娛樂: "🎬",
    醫療: "💊",
    其他: "📌",
};

function formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00");
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
    const [groups, setGroups] = useState<DayGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userId, setUserId] = useState("default");

    // 編輯與刪除狀態
    const [editingItem, setEditingItem] = useState<ExpenseRow | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const fetchData = async () => {
        const savedId = localStorage.getItem("pocket_account_user_id") || "default";
        setUserId(savedId);

        try {
            const res = await fetch(`/api/expense?userId=${savedId}&limit=50`);
            const data: ExpenseRow[] = await res.json();

            const map = new Map<string, ExpenseRow[]>();
            data.forEach((row) => {
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
            g.sort((a, b) => b.date.localeCompare(a.date));
            setGroups(g);
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
            const res = await fetch(`/api/expense/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchData(); // 重新整理
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
                fetchData();
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
        <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
            <div className="decoration-blob w-[300px] h-[300px] bg-green-100 top-[-100px] left-[-100px]" />
            <div className="decoration-blob w-[250px] h-[250px] bg-pink-50 bottom-[10%] right-[-50px]" />

            <main className="flex-1 flex flex-col px-5 pt-16 pb-32 max-w-lg mx-auto w-full relative z-10">
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

                    {!loading && !error && groups.length > 0 && (
                        <div className="flex flex-col items-center justify-center py-8 mt-2 bg-transparent border-t-2 border-b-2 border-dashed border-[var(--border)]">
                            <span className="text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                                － 累積總花費 －
                            </span>
                            <span className="text-5xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>
                                ${totalAll.toLocaleString()}
                            </span>
                        </div>
                    )}
                </header>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-[var(--bg-soft)] border-t-[var(--accent)] rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="glass-card mx-2 p-8 text-center text-red-500 font-bold bg-red-50/50 border-red-100">
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
                    <div className="space-y-8 animate-soft-in">
                        {groups.map((group) => (
                            <div key={group.date}>
                                <div className="flex items-center justify-between px-2 mb-3">
                                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                        {formatDateLabel(group.date)}
                                    </span>
                                    <span className="text-xs font-black px-3 py-1 bg-white border-2 border-[var(--border)] rounded-full shadow-sm" style={{ color: "var(--text-primary)" }}>
                                        ${group.total.toLocaleString()}
                                    </span>
                                </div>

                                <div className="glass-card mx-2 overflow-hidden">
                                    {group.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex overflow-x-auto snap-x snap-mandatory ${idx < group.items.length - 1 ? "border-b-2 border-dashed border-[var(--border)]" : ""
                                                }`}
                                            // 隱藏滾動條的 inline style
                                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                        >
                                            {/* 主要內容區 (滑動前看到的範圍) */}
                                            <div className="w-full flex-shrink-0 snap-center flex items-center gap-3 px-4 py-4 bg-white/50">
                                                <div className="w-11 h-11 rounded-[16px] bg-[var(--bg-soft)] flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                                                    {CATEGORY_ICONS[item.category] ?? "📌"}
                                                </div>
                                                <div className="flex-1 min-w-0 overflow-hidden">
                                                    <p className="text-base font-bold truncate mb-0.5" style={{ color: "var(--text-primary)" }}>
                                                        {item.item}
                                                    </p>
                                                    <span className={`badge-${item.category} px-2.5 py-0.5 rounded-full text-[10px] font-black`}>
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <div className="text-lg font-black flex-shrink-0 text-right min-w-[60px]" style={{ color: "var(--text-primary)" }}>
                                                    ${item.amount.toLocaleString()}
                                                </div>
                                            </div>

                                            {/* 操作區塊 (向左滑動後出現) */}
                                            <div className="flex shrink-0 snap-end px-3 gap-2 items-center bg-[var(--bg-primary)] border-l border-[var(--border)]">
                                                <button
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setIsEditOpen(true);
                                                    }}
                                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-lg shadow-sm hover:scale-105 transition-transform"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => item.id && handleDelete(item.id)}
                                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-50 text-lg shadow-sm hover:scale-105 transition-transform"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
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
