"use client";

import { useEffect, useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import AnalysisCharts from "@/components/AnalysisCharts";
import AIAnalysisModal from "@/components/AIAnalysisModal";

interface ExpenseRow {
    date: string;
    item: string;
    amount: number;
    category: string;
    userId: string;
}

type Period = "day" | "week" | "month" | "quarter" | "year";

// 對齊全站系統配色（需用飽和版讓圖表清晰可辨）
const CATEGORY_COLORS: Record<string, string> = {
    飲食: "#f97316", // 暖橙（對應 pastel #FFE8D6 的飽和版）
    交通: "#38bdf8", // 天藍（對應 pastel #E0F2FE）
    購物: "#f472b6", // 玫瑰粉（對應 pastel #FCE7F3）
    居家: "#4ade80", // 清草綠（對應 pastel #DCFCE7）
    娛樂: "#a78bfa", // 薰衣草紫（對應 pastel #F3E8FF）
    醫療: "#f87171", // 珊瑚紅（對應 pastel #FEE2E2）
    治裝: "#8b5cf6", // 深薰衣草紫（治裝專用固定色）
    其他: "#94a3b8", // 霧灰藍（對應 pastel #F3F4F6）
};

const FALLBACK_COLORS = ["#64748b", "#0f766e", "#7c3aed", "#db2777", "#b45309", "#2563eb"];

function normalizeCategory(category: string) {
    return category.trim() || "其他";
}

function getCategoryColor(category: string) {
    const normalizedCategory = normalizeCategory(category);
    if (CATEGORY_COLORS[normalizedCategory]) return CATEGORY_COLORS[normalizedCategory];

    const colorIndex = Array.from(normalizedCategory).reduce((sum, char) => sum + char.charCodeAt(0), 0) % FALLBACK_COLORS.length;
    return FALLBACK_COLORS[colorIndex];
}

export default function AnalysisPage() {
    const [data, setData] = useState<ExpenseRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>("month");
    const [userId, setUserId] = useState("default");
    const [error, setError] = useState("");

    const [analyzingAI, setAnalyzingAI] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiAdvice, setAiAdvice] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // 新增：時間偏移量，0 代表當期，-1 代表上一期
    const [dateOffset, setDateOffset] = useState(0);

    // 當切換 period 時，重置 offset 為 0
    useEffect(() => {
        setDateOffset(0);
    }, [period]);

    useEffect(() => {
        const savedId = localStorage.getItem("pocket_account_user_id");
        if (savedId) setUserId(savedId);

        fetch(`/api/expense?userId=${savedId || "default"}&limit=5000`)
            .then((r) => r.json())
            .then((res) => {
                if (Array.isArray(res)) {
                    setData(res);
                } else {
                    setError("資料格式錯誤");
                }
            })
            .catch((err) => {
                console.error("載入失敗", err);
                setError("無法連接伺服器");
            })
            .finally(() => setLoading(false));
    }, []);

    const filteredData = useMemo(() => {
        if (!Array.isArray(data)) return [];

        const now = new Date();

        return data.filter((item) => {
            const itemDate = new Date(item.date + "T00:00:00");

            // 計算基準目標日期，根據選擇的維度與偏移量
            const target = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (period === "day") {
                target.setDate(now.getDate() + dateOffset);
                return itemDate.getTime() === target.getTime();
            }

            if (period === "week") {
                // 將 target 設為本週日 (假設週日為一週開始)
                target.setDate(now.getDate() - now.getDay() + (dateOffset * 7));
                const endOfWeek = new Date(target);
                endOfWeek.setDate(target.getDate() + 6);
                return itemDate >= target && itemDate <= endOfWeek;
            }

            if (period === "month") {
                target.setMonth(now.getMonth() + dateOffset);
                return (
                    itemDate.getFullYear() === target.getFullYear() &&
                    itemDate.getMonth() === target.getMonth()
                );
            }

            if (period === "quarter") {
                const currentQuarterBaseMonth = Math.floor(now.getMonth() / 3) * 3;
                target.setMonth(currentQuarterBaseMonth + (dateOffset * 3));
                const targetQuarter = Math.floor(target.getMonth() / 3);
                const itemQuarter = Math.floor(itemDate.getMonth() / 3);
                return (
                    itemDate.getFullYear() === target.getFullYear() &&
                    itemQuarter === targetQuarter
                );
            }

            if (period === "year") {
                target.setFullYear(now.getFullYear() + dateOffset);
                return itemDate.getFullYear() === target.getFullYear();
            }

            return true;
        });
    }, [data, period, dateOffset]);

    const totalAmount = useMemo(() => {
        return filteredData.reduce((sum, item) => sum + item.amount, 0);
    }, [filteredData]);

    // 產生動態時間標籤
    const periodLabelText = useMemo(() => {
        const now = new Date();
        const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (period === "day") {
            if (dateOffset === 0) return "今日";
            if (dateOffset === -1) return "昨日";
            if (dateOffset === -2) return "前天";
            t.setDate(now.getDate() + dateOffset);
            return `${t.getMonth() + 1}/${t.getDate()}`;
        }
        if (period === "week") {
            if (dateOffset === 0) return "本週";
            if (dateOffset === -1) return "上週";
            t.setDate(now.getDate() - now.getDay() + (dateOffset * 7));
            return `${t.getMonth() + 1}/${t.getDate()} 當週`;
        }
        if (period === "month") {
            if (dateOffset === 0) return "本月";
            if (dateOffset === -1) return "上月";
            t.setMonth(now.getMonth() + dateOffset);
            return `${t.getFullYear()}年${t.getMonth() + 1}月`;
        }
        if (period === "quarter") {
            if (dateOffset === 0) return "本季";
            if (dateOffset === -1) return "上一季";
            const q = Math.floor(now.getMonth() / 3) * 3;
            t.setMonth(q + (dateOffset * 3));
            return `${t.getFullYear()}年 第${Math.floor(t.getMonth() / 3) + 1}季`;
        }
        if (period === "year") {
            if (dateOffset === 0) return "今年";
            if (dateOffset === -1) return "去年";
            return `${now.getFullYear() + dateOffset}年`;
        }
        return "";
    }, [period, dateOffset]);

    const chartData = useMemo(() => {
        // 1. 分類占比統計 (Doughnut)
        const stats: Record<string, number> = {};
        filteredData.forEach((item) => {
            const category = normalizeCategory(item.category);
            stats[category] = (stats[category] || 0) + item.amount;
        });

        const rawLabels = Object.keys(stats);
        const categoryLabels = rawLabels.sort((a, b) => stats[b] - stats[a]);
        const categoryAmounts = categoryLabels.map(l => stats[l]);
        const backgroundColors = categoryLabels.map(getCategoryColor);

        const doughnutData = {
            labels: categoryLabels,
            datasets: [
                {
                    data: categoryAmounts,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(() => "#ffffff"),
                    borderWidth: 4,
                },
            ],
        };

        // 2. 消費趨勢統計 (Line Chart)
        const trendStats: Record<string, number> = {};
        
        // 根據週期決定 X 軸標籤
        let trendLabels: string[] = [];
        const now = new Date();
        const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (period === "day") {
            trendLabels = [periodLabelText];
            trendStats[periodLabelText] = totalAmount;
        } else if (period === "week") {
            const startOfWeek = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - baseDate.getDay() + (dateOffset * 7));
            for (let i = 0; i < 7; i++) {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                const label = `${d.getMonth() + 1}/${d.getDate()}`;
                trendLabels.push(label);
                trendStats[label] = 0;
            }
        } else if (period === "month") {
            const targetMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + dateOffset, 1);
            const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const label = `${i}日`;
                trendLabels.push(label);
                trendStats[label] = 0;
            }
        } else if (period === "year" || period === "quarter") {
             const startMonth = period === "year" ? 0 : Math.floor(now.getMonth() / 3) * 3 + (dateOffset * 3);
             const monthCount = period === "year" ? 12 : 3;
             for (let i = 0; i < monthCount; i++) {
                 const m = (startMonth + i + 12) % 12;
                 const label = `${m + 1}月`;
                 trendLabels.push(label);
                 trendStats[label] = 0;
             }
        }

        // 填充趨勢數據
        filteredData.forEach(item => {
            const d = new Date(item.date + "T00:00:00");
            let key = "";
            if (period === "week") key = `${d.getMonth() + 1}/${d.getDate()}`;
            else if (period === "month") key = `${d.getDate()}日`;
            else if (period === "year" || period === "quarter") key = `${d.getMonth() + 1}月`;
            else key = periodLabelText;

            if (trendStats[key] !== undefined) {
                trendStats[key] += item.amount;
            }
        });

        const lineData = {
            labels: trendLabels,
            datasets: [
                {
                    label: "支出金額",
                    data: trendLabels.map(l => trendStats[l]),
                    borderColor: "#f97316",
                    backgroundColor: "rgba(249, 115, 22, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: "#fff",
                    pointBorderWidth: 2,
                },
            ],
        };

        return { doughnutData, lineData };
    }, [filteredData, period, dateOffset, periodLabelText, totalAmount]);

    const categoryDetails = useMemo(() => {
        if (!selectedCategory) return [];

        return filteredData
            .filter((item) => normalizeCategory(item.category) === selectedCategory)
            .sort((a, b) => {
                const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
                return dateDiff || b.amount - a.amount;
            });
    }, [filteredData, selectedCategory]);

    useEffect(() => {
        const labels = chartData.doughnutData.labels;
        if (selectedCategory && !labels.includes(selectedCategory)) {
            setSelectedCategory(null);
        }
    }, [chartData.doughnutData.labels, selectedCategory]);

    const handleAIAnalysis = async () => {
        if (filteredData.length === 0) {
            setAiAdvice("目前還沒有資料可以分析唷，多種下一些消費種子吧！🌸");
            setIsAIModalOpen(true);
            return;
        }

        setAnalyzingAI(true);
        try {
            const res = await fetch("/api/analysis/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    expenses: filteredData.slice(0, 50),
                    period: periodLabelText
                }),
            });
            const data = await res.json();
            setAiAdvice(data.advice || data.error);
            setIsAIModalOpen(true);
        } catch (err) {
            setAiAdvice("AI 好像在森林裡迷路了，稍後再試試看吧！🌿");
            setIsAIModalOpen(true);
        } finally {
            setAnalyzingAI(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col overflow-x-hidden relative" style={{ background: "var(--bg-primary)" }}>
            <div className="decoration-blob w-[400px] h-[400px] bg-blue-50 top-[-200px] right-[-150px]" />
            <div className="decoration-blob w-[300px] h-[300px] bg-green-50 bottom-[10%] left-[-100px]" />

            <main 
                className="flex-1 flex flex-col px-6 pt-16 max-w-lg mx-auto w-full relative z-10"
                style={{ paddingBottom: "var(--nav-spacer)" }}
            >
                <header className="mb-8 px-2 animate-soft-in">
                    <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                        支出分析
                    </h1>
                    <p className="text-sm font-bold mt-1" style={{ color: "var(--text-muted)" }}>
                        來自 <span style={{ color: "var(--accent)" }}>{userId}</span> 的消費報告
                    </p>
                </header>

                <div className="flex bg-white/60 backdrop-blur-sm p-1.5 rounded-[24px] mb-6 border-2 border-[var(--border)] shadow-sm animate-soft-in">
                    {(["day", "week", "month", "quarter", "year"] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 py-4 text-base font-black rounded-[18px] transition-all ${period === p
                                ? "bg-[var(--accent)] text-white shadow-md transform scale-105"
                                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                }`}
                        >
                            {{ day: "日", week: "週", month: "月", quarter: "季", year: "年" }[p]}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between px-2 mb-8 animate-soft-in">
                    <button
                        onClick={() => setDateOffset(prev => prev - 1)}
                        className="w-10 h-10 flex items-center justify-center bg-white border-2 border-[var(--border)] rounded-full text-[var(--accent)] hover:bg-[var(--bg-soft)] transition-all shadow-sm"
                    >
                        ◀
                    </button>
                    <span className="text-sm font-black py-2 px-6 bg-[var(--bg-soft)] rounded-full text-[var(--text-primary)] shadow-sm border border-[var(--bg-soft)]">
                        {periodLabelText}
                    </span>
                    <button
                        onClick={() => setDateOffset(prev => prev + 1)}
                        disabled={dateOffset >= 0}
                        className={`w-10 h-10 flex items-center justify-center border-2 border-[var(--border)] rounded-full transition-all shadow-sm ${dateOffset >= 0 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-white text-[var(--accent)] hover:bg-[var(--bg-soft)]"}`}
                    >
                        ▶
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-[var(--bg-soft)] border-t-[var(--accent)] rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="glass-card mx-2 p-10 text-center animate-soft-in">
                        <div className="text-5xl mb-4">⚠️</div>
                        <p className="text-lg font-black text-red-500 mb-2">出錯了</p>
                        <p className="text-sm font-bold text-[var(--text-muted)]">{error}</p>
                        <button onClick={() => window.location.reload()} className="btn-primary mt-6">重新整理</button>
                    </div>
                ) : filteredData.length > 0 ? (
                    <div className="space-y-8 animate-soft-in">
                        <div className="glass-card mx-2 p-8 text-center relative overflow-hidden" style={{ borderBottomWidth: "6px" }}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 blur-3xl rounded-full" />
                            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                                {periodLabelText}總支出
                            </p>
                            <h2 className="font-sans text-5xl font-black tracking-tighter flex items-center justify-center gap-2 text-[#333]">
                                <span className="text-3xl opacity-60 mt-2" style={{ transform: "translateY(2px)" }}>$</span>
                                {totalAmount.toLocaleString()}
                            </h2>

                            <button
                                onClick={handleAIAnalysis}
                                disabled={analyzingAI}
                                className="mt-8 px-8 py-3.5 bg-[var(--bg-soft)] hover:bg-[var(--accent)] hover:text-white text-[var(--accent)] text-[1.05rem] font-bold rounded-[20px] transition-all border-2 border-transparent hover:shadow-lg inline-flex items-center gap-2.5 active:scale-95"
                            >
                                {analyzingAI ? (
                                    <div className="w-4 h-4 border-[3px] border-[var(--accent)] border-t-white rounded-full animate-spin" />
                                ) : "✨"}
                                {analyzingAI ? "正在生成建議..." : "查看 AI 理財建議"}
                            </button>
                        </div>

                        <div className="glass-card mx-2 p-6" style={{ borderBottomWidth: "6px" }}>
                            <h3 className="text-sm font-black mb-6 flex items-center gap-3 px-1" style={{ color: "var(--text-muted)" }}>
                                <span className="w-2 h-5 bg-[var(--status-pink)] rounded-full flex-shrink-0" />
                                數據分析
                            </h3>
                            <div className="mb-4">
                                <AnalysisCharts data={chartData} />
                            </div>
                        </div>

                        {/* 分類清單 (List-view) */}
                        <div className="mx-2 bg-white/60 backdrop-blur-md rounded-[1.5rem] border border-[var(--border)] shadow-sm overflow-hidden flex flex-col">
                            {chartData.doughnutData.labels.map((label: string, idx: number) => {
                                const amount = chartData.doughnutData.datasets[0].data[idx];
                                const percentage = ((amount / totalAmount) * 100).toFixed(1);
                                const isSelected = selectedCategory === label;
                                const details = isSelected ? categoryDetails : [];

                                return (
                                    <div 
                                        key={label} 
                                        className="border-b border-[#f0f0f0] last:border-b-0"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory(isSelected ? null : label)}
                                            className={`w-full py-4 transition-colors text-left ${isSelected ? "bg-white/75" : "hover:bg-white/55"}`}
                                            aria-expanded={isSelected}
                                            aria-controls={`category-detail-${label}`}
                                        >
                                        <div className="flex items-center justify-between w-[92%] max-w-[400px] mx-auto">
                                            {/* 左側：顏色標記與類別名 */}
                                            <div className="flex items-center gap-3.5">
                                                <div 
                                                    className="w-3.5 h-3.5 rounded-full shadow-inner" 
                                                    style={{ backgroundColor: getCategoryColor(label) }} 
                                                />
                                                <div>
                                                    <span className="text-[1.05rem] font-bold text-[#3d4a2a]">
                                                        {label}
                                                    </span>
                                                    <p className="text-[11px] font-bold text-[#9ca3af] mt-0.5">
                                                        {isSelected ? "收合明細" : "點擊查看明細"}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* 右側：金額與佔比 */}
                                            <div className="flex items-center gap-3 pl-2">
                                                <div className="text-right flex flex-col justify-center items-end">
                                                    <p className="font-sans text-[1.15rem] font-black tracking-tighter text-[#333] leading-tight">
                                                        <span className="text-[11px] opacity-40 font-sans font-bold mr-1">$</span>
                                                        {amount.toLocaleString()}
                                                    </p>
                                                    <p className="text-[11px] font-bold text-[#9ca3af] mt-1">
                                                        {percentage}%
                                                    </p>
                                                </div>
                                                <span className={`text-sm font-black text-[#9ca3af] transition-transform ${isSelected ? "rotate-180" : ""}`}>
                                                    ▾
                                                </span>
                                            </div>
                                        </div>
                                        </button>

                                        {isSelected && (
                                            <div
                                                id={`category-detail-${label}`}
                                                style={{ padding: "0 16px 16px" }}
                                            >
                                                <div className="rounded-2xl bg-[var(--bg-soft)]/70 border border-[var(--border)] overflow-hidden">
                                                    {details.map((item, detailIdx) => (
                                                        <div
                                                            key={`${item.date}-${item.item}-${item.amount}-${detailIdx}`}
                                                            className="border-b border-white/70 last:border-b-0"
                                                            style={{
                                                                display: "grid",
                                                                gridTemplateColumns: "minmax(0, 1fr) max-content",
                                                                alignItems: "start",
                                                                gap: "12px",
                                                                minWidth: 0,
                                                                padding: "12px",
                                                            }}
                                                        >
                                                            <div style={{ minWidth: 0, overflow: "hidden" }}>
                                                                <p
                                                                    className="text-sm font-black text-[#3d4a2a] leading-snug"
                                                                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                                                >
                                                                    {item.item}
                                                                </p>
                                                                <p
                                                                    className="text-[11px] font-bold text-[#7a8a66] mt-0.5"
                                                                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                                                >
                                                                    {item.date}
                                                                </p>
                                                            </div>
                                                            <p
                                                                className="font-sans text-sm font-black text-[#333] tabular-nums"
                                                                style={{
                                                                    maxWidth: "6.5rem",
                                                                    overflow: "hidden",
                                                                    textAlign: "right",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                ${item.amount.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20 animate-soft-in">
                        <div className="text-7xl mb-6 grayscale opacity-30">📊</div>
                        <h3 className="text-xl font-black mb-3" style={{ color: "var(--text-primary)" }}>草地上不見蹤影</h3>
                        <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            這個{periodLabelText}內還沒有發現任何消費種子喔！
                        </p>
                    </div>
                )}
            </main>

            <AIAnalysisModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                advice={aiAdvice}
            />

            <Navigation />
        </div>
    );
}
