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

const CATEGORY_COLORS: Record<string, string> = {
    飲食: "#85c242", // 蘋果綠
    交通: "#6db5e2", // 天空藍
    購物: "#f5a0c1", // 櫻花粉
    娛樂: "#fbd66e", // 活力黃
    醫療: "#ff8282", // 珊瑚紅
    居家: "#4A90E2", // 靛藍 (新增/深色)
    教育: "#9B51E0", // 紫色 (新增/深色)
    通訊: "#F2994A", // 橙色 (新增/深色)
    其他: "#a3d964",
};

export default function AnalysisPage() {
    const [data, setData] = useState<ExpenseRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>("month");
    const [userId, setUserId] = useState("default");
    const [error, setError] = useState("");

    const [analyzingAI, setAnalyzingAI] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiAdvice, setAiAdvice] = useState("");

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

    const chartData = useMemo(() => {
        const stats: Record<string, number> = {};
        filteredData.forEach((item) => {
            stats[item.category] = (stats[item.category] || 0) + item.amount;
        });

        const rawLabels = Object.keys(stats);
        // 按金額由大到小排序
        const labels = rawLabels.sort((a, b) => stats[b] - stats[a]);
        const amounts = labels.map(l => stats[l]);
        const backgroundColors = labels.map((l) => CATEGORY_COLORS[l] || `hsl(${Math.random() * 360}, 70%, 60%)`);

        return {
            labels,
            datasets: [
                {
                    data: amounts,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(() => "#ffffff"),
                    borderWidth: 4,
                },
            ],
        };
    }, [filteredData]);

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
        <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
            <div className="decoration-blob w-[400px] h-[400px] bg-blue-50 top-[-200px] right-[-150px]" />
            <div className="decoration-blob w-[300px] h-[300px] bg-green-50 bottom-[10%] left-[-100px]" />

            <main className="flex-1 flex flex-col px-6 pt-16 pb-32 max-w-lg mx-auto w-full relative z-10">
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
                            <h2 className="text-5xl font-black tracking-tighter flex items-center justify-center gap-2" style={{ color: "var(--text-primary)" }}>
                                <span className="text-3xl opacity-60 mt-2" style={{ transform: "translateY(2px)" }}>$</span>
                                {totalAmount.toLocaleString()}
                            </h2>

                            <button
                                onClick={handleAIAnalysis}
                                disabled={analyzingAI}
                                className="mt-8 px-12 py-5 bg-[var(--bg-soft)] hover:bg-[var(--accent)] hover:text-white text-[var(--accent)] text-lg font-black rounded-full transition-all border-2 border-transparent hover:shadow-xl inline-flex items-center gap-3"
                            >
                                {analyzingAI ? (
                                    <div className="w-5 h-5 border-3 border-[var(--accent)] border-t-white rounded-full animate-spin" />
                                ) : "✨"}
                                {analyzingAI ? "正在生成建議..." : "查看 AI 理財建議"}
                            </button>
                        </div>

                        <div className="glass-card mx-2 p-6" style={{ borderBottomWidth: "6px" }}>
                            <h3 className="text-sm font-black mb-6 flex items-center gap-3 px-1" style={{ color: "var(--text-muted)" }}>
                                <span className="w-2 h-5 bg-[var(--status-pink)] rounded-full flex-shrink-0" />
                                各類別占比
                            </h3>
                            <AnalysisCharts data={chartData} />
                        </div>

                        <div className="space-y-3">
                            {chartData.labels.map((label, idx) => {
                                const amount = chartData.datasets[0].data[idx];
                                const percentage = ((amount / totalAmount) * 100).toFixed(1);
                                return (
                                    <div key={label} className="flex items-center justify-between p-5 glass-card mx-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: CATEGORY_COLORS[label] }} />
                                            <span className="text-base font-black" style={{ color: "var(--text-primary)" }}>{label}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black" style={{ color: "var(--text-primary)" }}>${amount.toLocaleString()}</p>
                                            <p className="text-[10px] font-bold opacity-60" style={{ color: "var(--text-muted)" }}>{percentage}%</p>
                                        </div>
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
