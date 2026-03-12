"use client";

import { useState, useEffect } from "react";

interface ExpenseRow {
    id?: string;
    date: string;
    item: string;
    amount: number;
    category: string;
    userId: string;
    paymentMethod?: string;
}

interface EditModalProps {
    isOpen: boolean;
    data: ExpenseRow | null;
    onClose: () => void;
    onSave: (updated: ExpenseRow) => Promise<void>;
}

// 改 1: 分類圖示卡片 - 整合 icon 路徑
const CATEGORIES = [
    { label: "飲食", icon: "/icons/food_icon.png" },
    { label: "交通", icon: "/icons/transport_icon.png" },
    { label: "購物", icon: "/icons/shopping_icon.png" },
    { label: "居家", icon: "/icons/home_icon.png" },
    { label: "娛樂", icon: "/icons/entertainment_icon.png" },
    { label: "醫療", icon: "/icons/medical_icon.png" },
    { label: "其他", icon: "/icons/other_icon.png" },
];

// 對應背景色
const CATEGORY_COLORS: Record<string, string> = {
    飲食: "#FFE8D6",
    交通: "#E0F2FE",
    購物: "#FCE7F3",
    居家: "#DCFCE7",
    娛樂: "#F3E8FF",
    醫療: "#FEE2E2",
    其他: "#F3F4F6",
};

export default function EditModal({ isOpen, data, onClose, onSave }: EditModalProps) {
    const [formData, setFormData] = useState<ExpenseRow | null>(null);
    const [loading, setLoading] = useState(false);
    // 改 4: Toast 錯誤取代 alert
    const [errorMsg, setErrorMsg] = useState("");
    // 改 5: 信用卡輸入欄位動畫
    const [showCardInput, setShowCardInput] = useState(false);

    useEffect(() => {
        if (data) {
            setFormData({ ...data });
            setErrorMsg("");
            setShowCardInput(data.paymentMethod !== "現金");
        }
    }, [data, isOpen]);

    if (!isOpen || !formData) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        try {
            await onSave(formData);
            onClose();
        } catch {
            // 改 4: inline 錯誤訊息
            setErrorMsg("儲存失敗，請稍後再試。");
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentToggle = (isCash: boolean) => {
        if (isCash) {
            setFormData({ ...formData, paymentMethod: "現金" });
            setShowCardInput(false);
        } else {
            setFormData({ ...formData, paymentMethod: "信用卡/行動支付" });
            setShowCardInput(true);
        }
    };

    const isCash = formData.paymentMethod === "現金" || !formData.paymentMethod;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-green-900/10 backdrop-blur-sm animate-soft-in">
            <div
                className="w-full max-w-sm glass-card p-6 bg-white border-4 animate-soft-in overflow-y-auto"
                style={{ borderBottomWidth: "8px", maxHeight: "92vh" }}
            >
                {/* 標題 */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--bg-soft)] flex items-center justify-center text-xl flex-shrink-0">
                        ✏️
                    </div>
                    <h2 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>修改記帳</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* 日期 */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest pl-1 mb-2" style={{ color: "var(--accent)" }}>日期</label>
                        <input
                            type="date"
                            className="expense-input !py-3 font-bold"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>

                    {/* 項目名稱 */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest pl-1 mb-2" style={{ color: "var(--accent)" }}>項目名稱</label>
                        <input
                            type="text"
                            className="expense-input !py-3 font-bold"
                            value={formData.item}
                            onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                            required
                        />
                    </div>

                    {/* 改 3: 金額加 NT$ 前綴 */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest pl-1 mb-2" style={{ color: "var(--accent)" }}>金額</label>
                        <div className="relative">
                            <span
                                className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm"
                                style={{ color: "var(--accent)" }}
                            >
                                NT$
                            </span>
                            <input
                                type="number"
                                className="expense-input !py-3 font-black !pl-12"
                                value={formData.amount || ""}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    {/* 改 1: 分類改為圖示卡片組 */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest pl-1 mb-3" style={{ color: "var(--accent)" }}>分類</label>
                        <div className="grid grid-cols-4 gap-2">
                            {CATEGORIES.map(({ label, icon }) => {
                                const isSelected = formData.category === label;
                                return (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, category: label })}
                                        className="flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-200 border-2"
                                        style={{
                                            backgroundColor: isSelected ? CATEGORY_COLORS[label] : "var(--bg-soft)",
                                            borderColor: isSelected ? "var(--accent)" : "transparent",
                                            transform: isSelected ? "scale(1.05)" : "scale(1)",
                                        }}
                                    >
                                        <img src={icon} alt={label} className="w-8 h-8 object-contain" />
                                        <span
                                            className="text-[10px] font-black"
                                            style={{ color: isSelected ? "var(--accent)" : "var(--text-muted)" }}
                                        >
                                            {label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 改 2: 付款方式改為 Toggle Button */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest pl-1 mb-3" style={{ color: "var(--accent)" }}>付款方式</label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => handlePaymentToggle(true)}
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all duration-200 border-2"
                                style={{
                                    backgroundColor: isCash ? "var(--accent)" : "var(--bg-soft)",
                                    color: isCash ? "white" : "var(--text-muted)",
                                    borderColor: isCash ? "var(--accent-hover)" : "transparent",
                                }}
                            >
                                💵 現金
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePaymentToggle(false)}
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all duration-200 border-2"
                                style={{
                                    backgroundColor: !isCash ? "var(--accent)" : "var(--bg-soft)",
                                    color: !isCash ? "white" : "var(--text-muted)",
                                    borderColor: !isCash ? "var(--accent-hover)" : "transparent",
                                }}
                            >
                                💳 信用卡
                            </button>
                        </div>

                        {/* 改 5: 信用卡輸入欄位加動畫 */}
                        <div
                            className="overflow-hidden transition-all duration-300 ease-in-out"
                            style={{
                                maxHeight: showCardInput ? "100px" : "0px",
                                opacity: showCardInput ? 1 : 0,
                            }}
                        >
                            <input
                                type="text"
                                placeholder="填寫刷哪張卡或支付方式 (如: 元大、Line Pay)"
                                className="expense-input mt-2 !py-3 font-bold"
                                value={formData.paymentMethod === "信用卡/行動支付" ? "" : (formData.paymentMethod || "")}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value || "信用卡/行動支付" })}
                            />
                        </div>
                    </div>

                    {/* 改 4: 取代 alert 的 Inline 錯誤訊息 */}
                    {errorMsg && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold animate-soft-in" style={{ backgroundColor: "#FEE2E2", color: "#b84a4a" }}>
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    <div className="flex gap-4 pt-2">
                        <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>
                            取消
                        </button>
                        <button type="submit" className="btn-primary flex-1" disabled={loading}>
                            {loading ? "儲存中..." : "確認修改"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
