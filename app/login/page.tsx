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
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "var(--bg-primary)" }}>
            {/* 裝飾氣泡 */}
            <div className="decoration-blob w-64 h-64 bg-green-200 top-[-100px] left-[-100px]" />
            <div className="decoration-blob w-48 h-48 bg-pink-100 bottom-[-50px] right-[-50px]" />

            <div className="w-full max-w-sm glass-card p-10 space-y-8 animate-soft-in">
                <div className="text-center">
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 rounded-[32px] mb-6 shadow-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)]"
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
                        <label className="block text-xs font-black uppercase tracking-widest pl-1" style={{ color: "var(--accent)" }}>
                            Access Password
                        </label>
                        <input
                            type="password"
                            className="expense-input text-center tracking-[0.5em] text-xl"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border-2 border-red-100 rounded-2xl text-red-500 text-xs font-bold text-center animate-shake">
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary w-full flex items-center justify-center gap-3"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                進入草原 <span>✨</span>
                            </>
                        )}
                    </button>
                </form>

                <p className="text-[10px] text-center font-medium" style={{ color: "var(--text-muted)" }}>
                    version 2.0 • Pikmin Bloom Style
                </p>
            </div>
        </div>
    );
}
