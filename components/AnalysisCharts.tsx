"use client";

import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

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
    const options: ChartOptions<"pie"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    color: "#7a8a66",
                    padding: 24,
                    usePointStyle: true,
                    pointStyle: "circle",
                    font: {
                        size: 13,
                        weight: "bold",
                        family: "'Noto Sans TC', sans-serif",
                    },
                },
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
                        const label = context.label || "";
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return ` ${label}: $${value.toLocaleString()} (${percentage}%)`;
                    },
                },
            },
        },
        // 動畫 Q 彈感
        animation: {
            duration: 1000,
            easing: "easeOutQuart",
        },
    };

    const isSingleCategory = data.labels.length === 1;

    // 單一分類時改為甜甜圈形狀 (cutout: 60%)
    if (isSingleCategory) {
        options.cutout = "60%";
    }

    return (
        <div className="relative w-full h-[320px] flex items-center justify-center p-2">
            <Pie data={data} options={options} />
            {isSingleCategory && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-black text-[var(--accent)] tracking-tighter">100%</span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] mt-1">{data.labels[0]}</span>
                </div>
            )}
        </div>
    );
}
