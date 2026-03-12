"use client";

import { useState, useRef, useEffect } from "react";
import { Doughnut, Line } from "react-chartjs-2";
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
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    ChartDataLabels,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler
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

export default function AnalysisCharts({ data }: AnalysisChartsProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 監聽捲動位置來更新指示點
    const handleScroll = () => {
        if (!scrollRef.current) return;
        const scrollLeft = scrollRef.current.scrollLeft;
        const width = scrollRef.current.offsetWidth;
        const index = Math.round(scrollLeft / width);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    // 點擊指示點切換
    const scrollTo = (index: number) => {
        if (!scrollRef.current) return;
        const width = scrollRef.current.offsetWidth;
        scrollRef.current.scrollTo({
            left: index * width,
            behavior: "smooth",
        });
        setActiveIndex(index);
    };

    const doughnutTotal = data.doughnutData.datasets[0]?.data.reduce((a: number, b: number) => a + b, 0) || 1;
    const maxIndex = data.doughnutData.datasets[0]?.data.indexOf(Math.max(...data.doughnutData.datasets[0].data));
    const topLabel = data.doughnutData.labels[maxIndex] ?? "";
    const topPct = ((data.doughnutData.datasets[0]?.data[maxIndex] ?? 0) / doughnutTotal * 100).toFixed(0);

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
                display: (context) => {
                    const value = context.dataset.data[context.dataIndex] as number;
                    return (value / doughnutTotal) * 100 >= 8; // 門檻提高一點，避免太擠
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
                    label: (context) => ` $${context.parsed.y.toLocaleString()}`,
                },
            },
        },
    };

    return (
        <div className="w-full">
            {/* 滑動容器 */}
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-[300px]"
                style={{ scrollbarWidth: "none", "-ms-overflow-style": "none" } as any}
            >
                {/* 第一張：圓餅圖 */}
                <div className="snap-center flex-shrink-0 w-full h-full flex items-center justify-center relative p-2">
                    <Doughnut data={data.doughnutData} options={doughnutOptions} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>最大宗</span>
                        <span className="text-base font-black leading-tight" style={{ color: "var(--text-primary)" }}>{topLabel}</span>
                        <span className="text-2xl font-black text-[var(--accent)]">{topPct}%</span>
                    </div>
                </div>

                {/* 第二張：趨勢圖 */}
                <div className="snap-center flex-shrink-0 w-full h-full flex flex-col p-4 pt-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] mb-4 pl-1">
                        支出趨勢變動
                    </h4>
                    <div className="flex-1 min-h-0">
                        <Line data={data.lineData} options={lineOptions} />
                    </div>
                </div>
            </div>

            {/* 指示點 */}
            <div className="flex justify-center gap-2 mt-2 pb-2">
                {[0, 1].map((i) => (
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
