"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push("/");
            } else {
                const data = await res.json();
                setError(data.error || "密碼錯誤");
            }
        } catch (err) {
            setError("連線失敗，請檢查網路");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6" style={{ background: "var(--bg-primary)" }}>
            {/* 裝飾氣泡 */}
            <div className="decoration-blob w-64 h-64 bg-green-200 top-[-50px] left-[-50px] animate-float" />
            <div className="decoration-blob w-48 h-48 bg-pink-100 bottom-[-20px] right-[-30px] animate-float-delayed" />

            <div className="w-full max-w-sm glass-card space-y-8 animate-soft-in">
                <div className="text-center">
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 rounded-[32px] mb-6 shadow-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] hover:scale-110 transition-transform duration-300 cursor-pointer"
                        style={{ borderBottom: "6px solid rgba(0,0,0,0.15)" }}
                    >
                        <span style={{ fontSize: "2.5rem" }}>🌱</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                        口袋記帳
                    </h1>
                    <p className="text-sm mt-3 font-bold" style={{ color: "var(--text-muted)" }}>
                        歡迎！請先輸入存取密碼
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-[0.15em] pl-1 text-[var(--text-muted)]">
                            Access Password
                        </label>
                        <input
                            type="password"
                            className="expense-input text-center tracking-widest text-xl font-bold"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            maxLength={20}
                            required
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-[rgba(245,160,193,0.15)] border-2 border-[#f5a0c1] rounded-2xl text-[#d45887] text-xs font-bold text-center animate-shake">
                            🌸 {error}
                        </div>
                    )}

                    <div className="relative">
                        <button
                            type="submit"
                            className="btn-primary w-full flex items-center justify-center gap-3 relative overflow-hidden h-[56px]"
                            disabled={loading}
                        >
                            <span className={`inline-flex items-center gap-3 transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                                進入草原 <span>✨</span>
                            </span>
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                </div>
                            )}
                        </button>
                    </div>
                </form>

                <p className="text-[10px] text-center font-medium" style={{ color: "var(--text-muted)" }}>
                    version 2.0 • Pikmin Bloom Style
                </p>
            </div>
        </div>
    );
}
