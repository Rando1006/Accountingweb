"use client";

interface ParsedExpense {
    item: string;
    amount: number;
    category: string;
    date: string;
    paymentMethod: "現金" | "信用卡";
}

interface PreviewCardProps {
    data: ParsedExpense;
    onSave: () => void;
    onReset: () => void;
    saving: boolean;
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

export default function PreviewCard({
    data,
    onSave,
    onReset,
    saving,
}: PreviewCardProps) {
    const icon = CATEGORY_ICONS[data.category] ?? "📌";

    // 格式化日期：YYYY-MM-DD → MM/DD（週幾）
    const formatDate = (d: string) => {
        const date = new Date(d + "T00:00:00");
        const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
        const m = date.getMonth() + 1;
        const day = date.getDate();
        const w = weekdays[date.getDay()];
        return `${m}/${day}（週${w}）`;
    };

    return (
        <div className="glass-card p-5 animate-slide-up">
            <p
                className="text-xs font-semibold mb-4 tracking-wider uppercase"
                style={{ color: "var(--accent-light)" }}
            >
                ✨ AI 解析結果
            </p>

            {/* 金額主視覺 */}
            <div className="text-center mb-6">
                <div className="text-5xl mb-2">{icon}</div>
                <div
                    className="text-4xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                >
                    ${data.amount.toLocaleString()}
                </div>
                <div className="text-lg mt-1" style={{ color: "var(--text-muted)" }}>
                    {data.item}
                </div>
            </div>

            {/* 詳細資訊 */}
            <div
                className="rounded-2xl p-4 mb-6 space-y-3"
                style={{ background: "rgba(255,255,255,0.04)" }}
            >
                <InfoRow label="日期" value={formatDate(data.date)} />
                <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                        分類
                    </span>
                    <span className={`badge-${data.category} text-sm px-3 py-1 rounded-full font-medium`}>
                        {data.category}
                    </span>
                </div>
                <InfoRow label="付款方式" value={data.paymentMethod === "信用卡" ? "💳 信用卡" : "💵 現金"} />
            </div>

            <p
                className="text-xs text-center mb-5"
                style={{ color: "var(--text-muted)" }}
            >
                資訊是否正確？確認後將儲存至雲端試算表
            </p>

            {/* 操作按鈕 */}
            <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={onReset} disabled={saving}>
                    重新輸入
                </button>
                <button
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    onClick={onSave}
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <svg
                                className="animate-spin-slow"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                            儲存中...
                        </>
                    ) : (
                        <>✅ 確認儲存</>
                    )}
                </button>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {label}
            </span>
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {value}
            </span>
        </div>
    );
}
