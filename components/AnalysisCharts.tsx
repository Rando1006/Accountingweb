"use client";

import { Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface AnalysisChartsProps {
    data: {
        labels: string[];
        datasets: {
            data: number[];
            backgroundColor: string[];
            borderColor: string[];
            borderWidth: number;
        }[];
    };
}

export default function AnalysisCharts({ data }: AnalysisChartsProps) {
    const total = data.datasets[0]?.data.reduce((a, b) => a + b, 0) || 1;

    // 找出占比最大的分類，顯示在圓心
    const maxIndex = data.datasets[0]?.data.indexOf(Math.max(...data.datasets[0].data));
    const topLabel = data.labels[maxIndex] ?? "";
    const topPct = ((data.datasets[0]?.data[maxIndex] ?? 0) / total * 100).toFixed(0);

    const options: ChartOptions<"doughnut"> = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
            legend: {
                display: false, // 隱藏圖例：下方清單已提供完整資訊
            },
            tooltip: {
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                titleColor: "#3d4a2a",
                titleFont: { weight: "bold", size: 14 },
                bodyColor: "#7a8a66",
                bodyFont: { weight: "bold" },
                borderColor: "#dee6cc",
                borderWidth: 2,
                padding: 14,
                displayColors: true,
                cornerRadius: 16,
                boxPadding: 8,
                callbacks: {
                    label: (context) => {
                        const value = context.parsed || 0;
                        const percentage = ((value / total) * 100).toFixed(1);
                        return ` $${value.toLocaleString()} (${percentage}%)`;
                    },
                },
            },
            // Segment 上的 % 標籤
            datalabels: {
                display: (context) => {
                    // 只顯示佔比 >= 5% 的項目，避免小塊擠在一起
                    const value = context.dataset.data[context.dataIndex] as number;
                    return (value / total) * 100 >= 5;
                },
                color: "#fff",
                font: {
                    size: 12,
                    weight: "bold",
                    family: "'Noto Sans TC', sans-serif",
                },
                formatter: (value: number) => {
                    const pct = ((value / total) * 100).toFixed(0);
                    return `${pct}%`;
                },
                textShadowColor: "rgba(0,0,0,0.25)",
                textShadowBlur: 4,
            } as any,
        },
        animation: {
            duration: 1000,
            easing: "easeOutQuart",
        },
    };

    return (
        <div className="relative w-full h-[280px] flex items-center justify-center">
            <Doughnut data={data} options={options} />
            {/* 圓心資訊：最高佔比分類 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: "0px" }}>
                <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>最多</span>
                <span className="text-base font-black leading-tight" style={{ color: "var(--text-primary)" }}>{topLabel}</span>
                <span className="text-2xl font-black" style={{ color: "var(--accent)" }}>{topPct}%</span>
            </div>
        </div>
    );
}
