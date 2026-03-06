"use client";

interface AIAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    advice: string;
}

export default function AIAnalysisModal({ isOpen, onClose, advice }: AIAnalysisModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-green-900/10 backdrop-blur-sm animate-soft-in">
            <div className="w-full max-w-sm glass-card p-8 bg-white border-4 animate-soft-in overflow-hidden relative" style={{ borderBottomWidth: "8px" }}>
                {/* 背景裝飾 */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--status-yellow)]/10 rounded-full -mr-12 -mt-12" />

                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-2xl shadow-lg" style={{ borderBottom: "4px solid rgba(0,0,0,0.15)" }}>
                        ✨
                    </div>
                    <div>
                        <h2 className="text-xl font-black leading-none mb-1" style={{ color: "var(--text-primary)" }}>AI 理財建議</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Pikmin Mentor Analysis</p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="bg-[var(--bg-soft)] rounded-[16px] px-7 py-5 max-h-[400px] overflow-y-auto scrollbar-hide border-2 border-white">
                        <div className="text-sm font-bold leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                            {advice || "正在傾聽種子的聲音..."}
                        </div>
                    </div>
                </div>

                <div className="pt-8 relative z-10">
                    <button className="btn-primary w-full" onClick={onClose}>
                        繼續探索草地 🌿
                    </button>
                </div>
            </div>
        </div>
    );
}
