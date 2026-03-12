"use client";

import { useState, useRef } from "react";
import { Doughnut, Line, Chart } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartOptions,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
} from "chart.js";
import { TreemapController, TreemapElement } from "chartjs-chart-treemap";
import ChartDataLabels, { Context } from "chartjs-plugin-datalabels";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    ChartDataLabels,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    TreemapController,
    TreemapElement
);

interface ChartData {
    labels: string[];
    datasets: any[];
}

interface AnalysisChartsProps {
    data: {
        doughnutData: ChartData;
        lineData: ChartData;
    };
}

// 系統配色保險絲，若動態抓取失敗則使用此對應
const SYSTEM_COLORS: Record<string, string> = {
    飲食: "#f97316",
    交通: "#38bdf8",
    購物: "#f472b6",
    居家: "#4ade80",
    娛樂: "#a78bfa",
    醫療: "#f87171",
    其他: "#94a3b8",
};

export default function AnalysisCharts({ data }: AnalysisChartsProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 1. Doughnut 資料
    const doughnutTotal = data.doughnutData.datasets[0]?.data.reduce((a: number, b: number) => a + b, 0) || 1;
    const maxIndex = data.doughnutData.datasets[0]?.data.indexOf(Math.max(...data.doughnutData.datasets[0].data));
    const topLabel = data.doughnutData.labels[maxIndex] ?? "";
    const topPct = ((data.doughnutData.datasets[0]?.data[maxIndex] ?? 0) / doughnutTotal * 100).toFixed(0);

    // 2. Treemap 資料轉換與顏色對應
    // 建立一個顏色 Map 確保 Treemap 能正確抓到對應分類的顏色
    const categoryColorMap = Object.fromEntries(
        data.doughnutData.labels.map((label, i) => [label, data.doughnutData.datasets[0].backgroundColor[i]])
    );

    const treemapData = {
        datasets: [{
            tree: data.doughnutData.labels.map((label, i) => ({
                category: label,
                value: data.doughnutData.datasets[0].data[i],
            })),
            key: "value",
            groups: ["category"],
            backgroundColor: (ctx: any) => {
                const item = ctx.raw;
                if (!item) return "#f3f4f6";
                // 修正顏色路徑：在分群模式下類別在 item.g，或是從 _data 抓
                const category = item.g || (item._data && item._data.category) || "其他";
                const color = categoryColorMap[category] || SYSTEM_COLORS[category] || "#94a3b8";
                return color + "BB"; // 70% 透明度
            },
            borderColor: "#ffffff",
            borderWidth: 2,
            borderRadius: 16,
            spacing: 3,
            labels: {
                display: true,
                formatter: (ctx: any) => {
                    const item = ctx.raw;
                    if (!item) return "";
                    const category = item.g || "其他";
                    const val = item.v || 0;
                    const pct = ((val / doughnutTotal) * 100).toFixed(0);
                    return parseInt(pct) >= 8 ? [category, `${pct}%`] : "";
                },
                font: { size: 14, weight: "bold" as const },
                color: "#fff",
            }
        }]
    };

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const scrollLeft = scrollRef.current.scrollLeft;
        const width = scrollRef.current.offsetWidth;
        const index = Math.round(scrollLeft / width);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const scrollTo = (index: number) => {
        if (!scrollRef.current) return;
        const width = scrollRef.current.offsetWidth;
        scrollRef.current.scrollTo({
            left: index * width,
            behavior: "smooth",
        });
        setActiveIndex(index);
    };

    const doughnutOptions: ChartOptions<"doughnut"> = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                titleColor: "#3d4a2a",
                titleFont: { weight: "bold", size: 14 },
                bodyColor: "#7a8a66",
                bodyFont: { weight: "bold" },
                borderColor: "#dee6cc",
                borderWidth: 2,
                padding: 12,
                cornerRadius: 16,
                callbacks: {
                    label: (context) => {
                        const value = context.parsed || 0;
                        const percentage = ((value / doughnutTotal) * 100).toFixed(1);
                        return ` $${value.toLocaleString()} (${percentage}%)`;
                    },
                },
            },
            datalabels: {
                display: (context: Context) => {
                    const value = context.dataset.data[context.dataIndex] as number;
                    return (value / doughnutTotal) * 100 >= 8;
                },
                color: "#fff",
                font: { size: 11, weight: "bold" as const },
                formatter: (value: number) => {
                    const pct = ((value / doughnutTotal) * 100).toFixed(0);
                    return `${pct}%`;
                },
                textShadowColor: "rgba(0,0,0,0.3)",
                textShadowBlur: 4,
            } as any,
        },
    };

    const lineOptions: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: "rgba(0,0,0,0.05)" },
                ticks: {
                    font: { size: 10, weight: "bold" as const },
                    callback: (value) => `$${value}`,
                },
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 10, weight: "bold" as const },
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 7,
                },
            },
        },
        plugins: {
            legend: { display: false },
            datalabels: { display: false } as any,
            tooltip: {
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                titleColor: "#3d4a2a",
                bodyColor: "var(--accent)",
                bodyFont: { weight: "bold" },
                callbacks: {
                    label: (context) => ` $${(context.parsed as any).y?.toLocaleString() || 0}`,
                },
            },
        },
    };

    const treemapOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (ctx: any) => ctx[0].raw?._data?.category,
                    label: (ctx: any) => ` 金額: $${ctx.raw?._data?.value.toLocaleString()}`
                }
            },
            datalabels: { display: false } as any,
        }
    };

    return (
        <div className="w-full">
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-[300px]"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as any}
            >
                {/* 1. 甜甜圈圖 */}
                <div className="snap-center flex-shrink-0 w-full h-full flex items-center justify-center relative p-2">
                    <Doughnut data={data.doughnutData} options={doughnutOptions} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>最大宗</span>
                        <span className="text-base font-black leading-tight" style={{ color: "var(--text-primary)" }}>{topLabel}</span>
                        <span className="text-2xl font-black text-[var(--accent)]">{topPct}%</span>
                    </div>
                </div>

                {/* 2. 矩形樹圖 (移至第二張) */}
                <div className="snap-center flex-shrink-0 w-full h-full flex flex-col p-4 pt-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] mb-4 pl-1">
                        類別矩形分布
                    </h4>
                    <div className="flex-1 min-h-0">
                        <Chart type="treemap" data={treemapData as any} options={treemapOptions} />
                    </div>
                </div>

                {/* 3. 趨勢圖 (移至第三張) */}
                <div className="snap-center flex-shrink-0 w-full h-full flex flex-col p-4 pt-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] mb-4 pl-1">
                        支出趨勢變動
                    </h4>
                    <div className="flex-1 min-h-0">
                        <Line data={data.lineData} options={lineOptions} />
                    </div>
                </div>
            </div>

            {/* 指示點 (改為 3 個) */}
            <div className="flex justify-center gap-2 mt-2 pb-2">
                {[0, 1, 2].map((i) => (
                    <button
                        key={i}
                        onClick={() => scrollTo(i)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            activeIndex === i ? "bg-[var(--accent)] w-6 scale-110" : "bg-gray-200"
                        }`}
                        aria-label={`切換至圖表 ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
