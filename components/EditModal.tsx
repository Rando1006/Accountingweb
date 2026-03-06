"use client";

import { useState, useEffect } from "react";

interface ExpenseRow {
    id?: string;
    date: string;
    item: string;
    amount: number;
    category: string;
    userId: string;
}

interface EditModalProps {
    isOpen: boolean;
    data: ExpenseRow | null;
    onClose: () => void;
    onSave: (updated: ExpenseRow) => Promise<void>;
}

const CATEGORIES = ["飲食", "交通", "購物", "娛樂", "醫療", "其他"];

export default function EditModal({ isOpen, data, onClose, onSave }: EditModalProps) {
    const [formData, setFormData] = useState<ExpenseRow | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (data) setFormData({ ...data });
    }, [data, isOpen]);

    if (!isOpen || !formData) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            alert("儲存失敗");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-green-900/10 backdrop-blur-sm animate-soft-in">
            <div className="w-full max-w-sm glass-card p-8 bg-white border-4 animate-soft-in" style={{ borderBottomWidth: "8px" }}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--bg-soft)] flex items-center justify-center text-xl">
                        ✏️
                    </div>
                    <h2 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>修改記帳</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest pl-1 mb-2" style={{ color: "var(--accent)" }}>金額</label>
                            <input
                                type="number"
                                className="expense-input !py-3 font-black"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest pl-1 mb-2" style={{ color: "var(--accent)" }}>分類</label>
                            <select
                                className="expense-input !py-3 font-bold appearance-none bg-[var(--bg-soft)]"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
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
